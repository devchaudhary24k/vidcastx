# Transcoder Roadmap — Performance & Architecture Wishlist

The current transcoder is a competent v1: ffprobe → ABR ladder → HLS VOD via a single ffmpeg invocation with `-var_stream_map`, plus a poster frame and a hover-preview WebM. It works, but it ships nothing novel and leaves substantial performance and quality on the table.

This document captures the upgrade path. Each section is independently buildable; the order below reflects rough priority, not strict dependency.

---

## 1. Chunked Distributed Transcoding

### The idea

Stop treating "one video = one job = one worker." Instead:

1. Split the source into N keyframe-aligned chunks.
2. Fan each chunk out to a separate worker as its own BullMQ job.
3. Each worker transcodes its chunk to all ladder rungs in parallel with the others.
4. A reassembly job concatenates the per-rung HLS segments back into the final master playlist.

A 60-minute video on 8 workers → ~7.5 minutes wall time instead of 60 minutes. This is the single biggest perceived-performance win available.

### Why it works

HLS is already segmented. The output of a normal transcode is a sequence of `*.ts` files glued together by an `.m3u8` playlist. If we produce those segments in parallel and stitch the playlists, the player can't tell the difference — as long as the segment boundaries align with keyframes.

### How to implement

**Splitting (the hard part):**

- Use `ffprobe` to enumerate keyframe timestamps:
  ```
  ffprobe -select_streams v -skip_frame nokey -show_frames \
          -show_entries frame=pts_time -of csv input.mp4
  ```
- Group keyframes into chunks of ~60–120 seconds (tunable). Never split mid-GOP.
- Use `ffmpeg -ss <start> -to <end> -c copy chunk_N.mp4` to extract chunks **without re-encoding** — copy mode is essentially free.

**Encoding:**

- Each chunk job runs the existing `runFFmpegTranscode` against `chunk_N.mp4`.
- Output filenames must be globally unique and ordered: `chunk_N_v0_segment000.ts`, `chunk_N_v0_segment001.ts`, etc.
- Critical: every chunk **must use identical encoder settings** (same GOP size, same profile, same bitrate target). Otherwise the stitched stream will judder at chunk boundaries.

**Reassembly:**

- Once all chunk jobs complete, a final job:
  - Renames segments into a single contiguous sequence per rung.
  - Generates one master `.m3u8` per rung from the ordered segment list.
  - Generates the top-level master playlist linking all rungs.

**BullMQ wiring:**

- Use a parent job (`transcodeOrchestrator`) that spawns N child jobs (`transcodeChunk`) and one final job (`assembleMaster`).
- BullMQ's `flows` API handles parent/child dependencies natively — the assembly job won't run until every chunk completes.

### Gotchas

- **Keyframe alignment is mandatory.** Force a fixed GOP at chunk boundaries (`-force_key_frames`) so segments concatenate cleanly.
- **Audio drift.** Audio samples don't always align to video frame boundaries. Either re-encode audio per chunk with PTS resets, or extract audio once into its own non-chunked job.
- **Failure handling.** If chunk 5 of 12 fails, retry only chunk 5 — not the whole video. This is also why #6 (resumable jobs) pairs naturally with this.

---

## 2. Per-Title Encoding (Content-Adaptive Ladder)

### The problem with our current ladder

We currently ship the same `(1080p @ 5000kbps, 720p @ 2800kbps, 480p @ 1400kbps)` ladder for every video. That's catastrophically wrong:

- A whiteboard screencast at 5000kbps is wasting ~70% of those bits.
- A high-motion gameplay clip at 5000kbps may look blocky and starved.

The ladder should be derived **from the content**, not hardcoded.

### How to detect complexity without AI

Three independent signals, all computed from pixels and bits — no models, no training:

#### Signal A: Spatial Information (SI)

Apply a Sobel edge filter to each frame and take the standard deviation. High SI = lots of fine detail = expensive to compress. Low SI = flat regions = cheap.

```
ffmpeg -i input.mp4 -vf "sobel,signalstats" -f null -
```

Whiteboard recording → low SI. Forest scene → high SI.

#### Signal B: Temporal Information (TI)

Subtract consecutive frames, take stddev of the difference. Static = small TI (talking head, screen recording). Heavy motion = large TI (sports, action).

```
ffmpeg -i input.mp4 -vf "tblend=all_mode=difference,signalstats" -f null -
```

SI + TI together is an ITU-T standard complexity metric. Used in research for decades. No ML required.

#### Signal C: The cheap probe encode (the most useful one)

Better than measuring features, **let the encoder tell you what the video costs**:

```
ffmpeg -i input.mp4 -c:v libx264 -preset ultrafast -crf 23 -an -f null -
```

CRF mode targets a _quality level_, not a bitrate. The resulting average bitrate is the encoder's honest answer to "how many bits do I need to keep this video at consistent quality?"

Empirical examples at CRF 23, 1080p:

- Talking head → ~1200 kbps
- Screencast → ~600 kbps
- Animation → ~800 kbps
- Sports / action → ~6000 kbps

Now build the ladder around that number:

```
target_1080p = probe_bitrate * 1.10        // small headroom
target_720p  = probe_bitrate * 0.55
target_480p  = probe_bitrate * 0.25
```

### Bonus: drop redundant rungs

If the probe says 800 kbps suffices at 1080p, a separate 720p rung adds nothing — viewers can't distinguish them and you're paying 2× the storage and CDN. Drop rungs whose target bitrate falls below ~70% of the rung above. One smart rung beats three dumb ones.

### The premium-tier upgrade: convex-hull optimization

For paid tiers, do this instead:

1. Encode at a small grid of `(resolution × bitrate)` combinations using `-preset ultrafast` (10–15 sample encodes, each ~30s).
2. Measure each output with `libvmaf` (built into ffmpeg) against the source.
3. Plot quality (VMAF score) vs bitrate per resolution.
4. Take the **upper envelope** (convex hull) across all resolutions — this is the mathematically optimal rate-quality curve for _this specific video_.
5. Pick ladder rungs at meaningful quality steps (VMAF 70 / 80 / 90 / 95).

This is exactly what Netflix calls "per-title encoding" and they published the methodology in 2015. Cost: ~10× the probe overhead. Benefit: 30–50% bandwidth savings at identical perceived quality.

### Implementation order

1. Add a `probe` step that runs the cheap CRF probe and returns target bitrate.
2. Modify `buildStreamVariants` to scale rungs from the probe number instead of hardcoding `BASE_RESOLUTIONS`.
3. Add the rung-dropping logic.
4. (Premium tier, later) implement convex-hull search as a separate `optimizeLadder()` function.

---

## 3. AV1 Output (with H.264 Fallback)

### Why

AV1 is ~30% smaller than H.264 at the same perceived quality. That translates directly to:

- 30% lower CDN bandwidth bill
- 30% less storage
- Faster startup on slow connections (less to download for the same buffer fill)

Browser support is now broad: Chrome, Firefox, Edge, and Safari (16.4+) all decode AV1. Mobile is solid on Android; iOS 17+ added support.

### The encoder choice: SVT-AV1

Until ~2023, AV1 encoding was unusably slow for VOD (10–100× real-time slower than x264). **SVT-AV1** changed that — it's now within 2–3× of x264 at preset 8, and acceptable at preset 10 for batch jobs.

```
ffmpeg -i input.mp4 \
  -c:v libsvtav1 \
  -preset 8 \
  -crf 30 \
  -svtav1-params "tune=0:enable-overlays=1" \
  -c:a libopus -b:a 128k \
  output.mp4
```

### How to ship it without breaking older players

Encode **two ladders in parallel**:

- **AV1 ladder** as primary (smaller, modern players only).
- **H.264 ladder** as fallback (universal compatibility).

In the master HLS playlist, list both renditions. HLS supports declaring multiple `#EXT-X-STREAM-INF` entries with different `CODECS=` attributes; players automatically pick the best they can decode.

DASH manifests handle this even more cleanly via `<AdaptationSet>` per codec.

### Pairs naturally with #2

Per-title encoding is even more impactful for AV1 because:

- AV1's quality-per-bit is more content-sensitive than H.264.
- The savings compound: per-title shaves 30–50%, AV1 shaves another 30%. Combined ladder can be ~60% smaller than our current dumb H.264 output at identical quality.

### Cost

Encoding is more expensive — even SVT-AV1 preset 8 is ~3× slower than x264 medium. Mitigations:

- Run AV1 only for videos above a view-count threshold (the long tail isn't worth it).
- Run AV1 jobs on lower-priority queue with cheaper hardware.
- Combine with #1 (chunked) to keep wall-clock time down even though CPU-time goes up.

---

## 5. Native FFmpeg via libav Bindings (Drop the `spawn` Approach)

### The current pain

We invoke `ffmpeg` and `ffprobe` as subprocesses via `node:child_process.spawn`. This works but is architecturally crude:

- **Progress parsing is fragile.** We `regex` ffmpeg's stderr (`time=HH:MM:SS.ms`) which can change format across versions and is locale-sensitive.
- **Cancellation is brittle.** Killing the process is the only abort mechanism. Cleanup of partial files is manual.
- **No shared GPU context.** Each ffmpeg process initializes its own CUDA/VAAPI context — hundreds of milliseconds per job, plus VRAM fragmentation.
- **Process boundary overhead.** Marshalling pixels through stdin/stdout pipes (when chaining filters) is slow. We avoid it now by writing files, but that costs disk I/O.
- **No fine-grained progress.** "Time encoded" via stderr regex is the only signal. Frame-level callbacks aren't possible.

### The upgrade: link against libavcodec/libavformat directly

FFmpeg the CLI is just a thin wrapper around the **libav\* libraries** (`libavcodec`, `libavformat`, `libavfilter`, `libswscale`). Real production transcoders link against these libraries directly instead of spawning the CLI.

### Three implementation options, ranked

#### Option A: Rust sidecar via NAPI

Build a native Node addon in Rust using the [`ffmpeg-next`](https://crates.io/crates/ffmpeg-next) crate (bindings to libav\*) and [`napi-rs`](https://napi.rs/) to expose it to Node/Bun.

```rust
#[napi]
pub async fn transcode(opts: TranscodeOptions, on_progress: ThreadsafeFunction<f32>) -> Result<()> {
    // ffmpeg-next API: open input, configure encoder, loop frames,
    // call on_progress.call(percent, ...) per frame
}
```

Pros:

- Memory-safe, modern.
- Real callbacks for progress (per-frame, not per-second).
- Shared GPU context across calls.
- Cancellation via Rust's async cooperative model — no `kill -9`.
- Same binary deploys everywhere ffmpeg's libraries do.

Cons:

- Requires a Rust toolchain in the build pipeline.
- Native addon = per-platform builds (Linux glibc, Linux musl, macOS arm64, etc.). Use `napi-rs`'s prebuild matrix.

**This is the option I'd build.**

#### Option B: Zig sidecar

Same architecture, Zig instead of Rust. Smaller binaries, simpler build, weaker ecosystem. Worth considering if the team already knows Zig; otherwise Rust wins on tooling maturity.

#### Option C: Bun's native FFI (`bun:ffi`)

Bun can dlopen libavcodec directly and call C functions from JS. No compilation needed.

```ts
import { dlopen, FFIType } from "bun:ffi";

const lib = dlopen("libavcodec.so.60", {
  avcodec_version: { returns: FFIType.u32, args: [] },
  // ... avcodec_open2, avcodec_send_frame, etc.
});
```

Pros: No build step. Zero deployment friction.

Cons: libav\*'s C API is genuinely huge (~500 functions across 6 libraries) and very stateful. Wrapping enough of it to do transcoding via bun:ffi is a multi-week project. The Rust crate already did this work for you.

### Expected wins

- **10–15% raw throughput** from removing process boundaries and pipe I/O.
- **~200ms saved per job** from skipping process spawn + GPU context init.
- **Real frame-level progress** (better UX, better OTel spans).
- **Clean cancellation** — abort signals propagate into the encoder loop.
- **Resource pooling** — keep encoder contexts warm across jobs.

### Cost

Significant. This is a 2–4 week project depending on chosen language. Pays off long-term but isn't urgent until #1 and #2 are in place.

---

## 6. Resumable Jobs via Segment-Level Checkpointing

### The problem

Today: worker dies mid-encode → job restarts from frame 0 on retry. A 90% complete 2-hour transcode loses 100% of its work. With #1 (chunked encoding) this gets less catastrophic (you only lose the in-flight chunks), but it's still wasteful.

### The fix

Track encoding progress at segment granularity in Redis and resume from the last completed segment on restart.

### How

**State to track per job, per rung:**

```
transcode:<videoId>:<rung>:segments → SET of completed segment indices
transcode:<videoId>:<rung>:status   → "in_progress" | "complete"
transcode:<videoId>:probe           → ProbeResult JSON (don't re-probe on resume)
```

**On worker startup for a job:**

1. Check Redis for existing state.
2. If state exists, read which segments are done.
3. Configure ffmpeg to start at `(last_completed_segment * segment_duration)` using `-ss`.
4. Resume writing into the same output directory; new segments append cleanly because HLS is just files.

**On segment completion:**

- ffmpeg writes `*.ts` files as it goes; we can watch the output directory or parse stderr for `segment_filename` mentions.
- On each new segment file appearing on disk, atomically `SADD` to the segments set.

**On crash:**

- BullMQ retries the job → state is still in Redis → resume from the last checkpoint.

### Pairs perfectly with #1

With chunked encoding, segments are already isolated and addressable. Checkpointing essentially becomes "track which chunks completed" — which is just BullMQ's natural job-status tracking. Plus per-segment progress within a chunk for crash recovery on long chunks.

### Edge cases

- **Worker crashes mid-segment write.** The partially-written `.ts` file is corrupt. On resume, delete any segment file whose index is **not** in the completed set before continuing — ffmpeg will overwrite it.
- **Settings drift between resumes.** If someone redeploys with different encoder settings between the original run and the resume, the output is inconsistent. Fix: hash the encoder settings and store in Redis; refuse to resume if the hash doesn't match.
- **Probe staleness.** If we re-probe on resume we waste time. Cache probe output per-video (`transcode:<videoId>:probe`) so resumes skip it.

### Time to build

Small. ~2–3 days. Big UX win for any video > 5 minutes.

---

## 7. Hardware Fingerprinting + Capability-Aware Scheduling

### The vision

A transcoding fleet is heterogeneous in real deployments:

- A Mac mini M2 with VideoToolbox (fast H.264, decent HEVC, no AV1 hardware).
- A Linux box with an RTX 4090 (NVENC for H.264/HEVC/AV1, 8 parallel encode sessions).
- A bunch of cheap c7i EC2 instances (CPU only, fast x264, no GPU).
- An AWS g5 instance (NVIDIA A10G, NVENC, lots of VRAM).

Today our `HW_ENCODER` env var is a single string per worker. It doesn't know what the worker can actually do, and the scheduler can't route jobs by capability.

### The upgrade

**At worker boot, probe the hardware and register capabilities.**

```ts
async function probeHardware(): Promise<WorkerCapabilities> {
  return {
    cpuCores: os.cpus().length,
    cpuModel: os.cpus()[0].model,
    encoders: {
      h264_nvenc: await testEncoder("h264_nvenc"),
      hevc_nvenc: await testEncoder("hevc_nvenc"),
      av1_nvenc: await testEncoder("av1_nvenc"),
      h264_videotoolbox: await testEncoder("h264_videotoolbox"),
      h264_qsv: await testEncoder("h264_qsv"),
      h264_vaapi: await testEncoder("h264_vaapi"),
      libsvtav1: true, // CPU AV1, always available
      libx264: true,
    },
    gpu: await probeGpu(), // returns { vendor, model, vram_mb } or null
    parallelSessions: deriveParallelSessions(gpu), // NVENC consumer cards: 5; pro: unlimited
  };
}
```

Where `testEncoder` runs a 1-second dummy encode and returns true/false based on exit code.

**Register in Redis at boot:**

```
worker:<workerId>:capabilities → JSON
worker:<workerId>:heartbeat    → timestamp (refresh every 5s)
```

**Scheduler routes jobs by tag.**

When enqueuing a transcode job, derive required capabilities from the desired output:

```ts
enqueue("transcode", payload, {
  requires: ["av1_nvenc"], // or ["libsvtav1"] if no NVENC available
  prefers: ["high_vram"], // for 4K source
});
```

BullMQ's `groupId` and worker concurrency knobs let you partition workers into pools by capability and route jobs to the right pool.

**The fancy version: live priority routing.**

- Idle GPU worker present? Route AV1 there.
- All GPU workers busy? Fall back to CPU SVT-AV1 on idle compute workers.
- Long-tail video, no urgency? Force it to the cheapest CPU pool.
- Live "premium customer just uploaded" signal? Bump it to the front of the GPU queue.

### Why this matters

Without this, you waste hardware. A 4090 sitting idle while a c7i grinds out an H.264 transcode it could do in 1/10th the time is real money on the table. With it, you can mix cheap commodity workers with a few high-end accelerators and get optimal throughput per dollar.

### Build complexity

Moderate. ~1 week:

- `probeHardware()` and `testEncoder()`: 1–2 days.
- Redis registration + heartbeat + leasing: 1 day.
- BullMQ pool partitioning + tagged routing: 2 days.
- Dashboard endpoint to visualize the fleet: 1 day (optional but nice).

### Pairs with #3

When AV1 ships, this becomes essential — you need to know which workers can do `av1_nvenc` natively (NVIDIA Ada Lovelace and later) vs which fall back to SVT-AV1.

---

## Suggested build order

A pragmatic 3-month roadmap that compounds wins instead of doing them in isolation:

1. **#2 cheap-probe per-title** (1 week) — immediate quality + bandwidth win, foundation for everything else.
2. **#6 segment-level checkpointing** (3 days) — defensive infrastructure before #1 makes failure modes more complex.
3. **#1 chunked distributed transcoding** (2 weeks) — the headline feature. Demoably faster.
4. **#7 hardware fingerprinting + scheduling** (1 week) — needed before #3 ships in mixed-fleet production.
5. **#3 AV1 output** (1 week) — biggest cost win, depends on #2 and #7 being in place.
6. **#5 native libav bindings** (3–4 weeks) — pure infrastructure cleanup; do this last when the architecture is stable enough that you're not throwing away the rewrite.
7. **#2 convex-hull premium tier** (1 week) — bolt onto #2 once #3 ships, since AV1 benefits most from optimal rungs.

After all of this lands, the transcoder is genuinely best-in-class for a self-hosted system: distributed, content-adaptive, modern codec, hardware-aware, crash-resilient, and running on native libraries instead of subprocess soup.
