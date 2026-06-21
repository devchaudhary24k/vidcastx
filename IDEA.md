# VidcastX — Product Idea & Vision

> The video infrastructure your product deserves — hosted, streamed, transcribed, translated, distributed, and measured — under one API and one UI, built for teams that ship.

## 1. What is VidcastX?

VidcastX is a B2B video platform that bundles **hosting, adaptive streaming, AI post-processing, live broadcasting, multi-platform distribution, and analytics** into a single organization-scoped workspace. It is engineered as API-first infrastructure (Elysia on Bun) with a batteries-included creator studio on top (TanStack Start + shadcn), so the same product serves both **end-user creators** through the web app and **developer teams** embedding video into their own SaaS via the typed API and the `@vidcastx/player` embeddable NPM package.

Unlike consumer destinations (YouTube, Vimeo) that own the audience, VidcastX stays white-label: every video lives under your org, plays via your embed, and is measured by your analytics. Unlike pure developer APIs (Mux, api.video, Cloudflare Stream) that stop at playback URLs, VidcastX ships the full content lifecycle — transcripts, chapters, summaries, dubbing, semantic embeddings, folders, distribution to YouTube/Twitch/TikTok/Facebook, live RTMP with auto-VOD, and usage-based billing — out of the box.

## 2. Who is it for?

| Segment                                                                             | Why VidcastX                                                                                                                 |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Independent creators & educators** going direct-to-audience                       | Own the player, own the analytics, own the subscriber list; escape YouTube's discovery roulette and arbitrary demonetization |
| **Course platforms / ed-tech**                                                      | Auto-transcripts, chapters, searchable transcripts via vector embeddings, multilingual dubbing, per-seat usage billing       |
| **SaaS products embedding video** (support, onboarding, async demos, product tours) | Drop-in typed API + NPM player, signed playback URLs, embed-domain stats, webhook-driven workflows                           |
| **Media companies & agencies**                                                      | Multi-brand orgs, RBAC, cross-post to YouTube/Twitch/TikTok/Facebook from one upload, VOD-from-live recording                |
| **Internal comms / L&D teams**                                                      | Private-by-default visibility, folder hierarchy, heatmap analytics, soft-delete audit trail, org-scoped RBAC                 |
| **Podcasters going visual**                                                         | RTMP live, auto-VOD, transcript → SEO description pipeline, hover-preview clips ready for social                             |
| **DevRel & marketing teams**                                                        | Embed tracking by domain, CTA/engagement heatmaps, auto-chapters from recorded talks                                         |

The common thread: teams that have outgrown an embed code but don't want to assemble Mux + Deepgram + ElevenLabs + Stripe + Zapier + Restream themselves.

## 3. Core capabilities (shipped + designed)

Every capability below has schema + API scaffolding in the repo today; the build-status column separates what plays end-to-end from what is awaiting endpoint/UI wire-up.

### 3.1 Upload & hosting

- Resumable S3 multipart uploads via Uppy — survives disconnects, browser closes, flaky mobile networks
- Video state machine: `draft → uploaded → queued → dispatched → processing → ready → failed`
- Soft-delete with `trash` + `restore` — nothing is hard-deleted without an audit trail
- Hierarchical folder tree (self-referential `parentId`) with per-folder color, pinning, default-visibility, and private/public folder visibility
- Scheduled publishing (set a publish date, video flips to public automatically)
- Visibility: public / private / unlisted

**Status:** shipped end-to-end (upload → DB → transcode enqueue).

### 3.2 Adaptive streaming

- HLS ABR output (dynamic rung set: 480p / 720p / 1080p, capped to source resolution)
- Pluggable encoders: libx264 default; h264_nvenc / h264_videotoolbox / h264_qsv wired; AV1 on the roadmap
- Per-video poster JPEG + short WebM hover-preview clip (YouTube-style grid hover)
- Signed playback URLs only — raw S3 keys never leak through the API (`t.Pick` allowlisted responses)
- `@vidcastx/player` drop-in NPM embeddable player — renders HLS + streams back telemetry events over the same session

**Status:** transcoder mid-refactor from subprocess FFmpeg to in-process `node-av` libav bindings (branch `feat/transcoder-libav`); core transcode + poster + preview all produce correct output and land in S3.

### 3.3 AI post-processing

- **Transcripts** — auto-generated (Whisper), multilingual, word-level timings, confidence scoring, provider-agnostic
- **Vector embeddings** per transcript segment (1536-dim pgvector) — "find the moment I talked about X" semantic search
- **Chapters** — LLM-generated or manual, with timestamps, thumbnails, descriptions, re-orderable
- **Summaries** — short / medium / long variants per language, plus key points, topics, SEO-ready descriptions
- **Dubbing** — ElevenLabs-class voice synthesis per target language, preserves original tone and pacing
- **Clean mode** — filler-word removal (designed)
- **Metadata generation** — SEO titles, tags, cover suggestions
- Per-job cost tracking: tokens used, provider, execution time, cents — rolls into the billing subsystem

**Status:** schema complete; `ai_job` queue type defined; endpoints + UI pending.

### 3.4 Analytics (hollywood-grade)

- **Daily aggregates** — views, watch time, avg % watched, likes, shares, bounces, finishes
- **Heatmaps** — per-segment engagement showing which 5-second windows get rewatched and where drop-offs cluster
- **Session-level telemetry** — device, browser, OS, geo, fullscreen / PiP usage, subtitle toggles, buffering events, quality switches, bitrate
- **Event stream** — play, pause, seek, error, quality_change, buffer_start, buffer_end, rate_change
- **Dimensional slicing** — by device type, traffic source (direct / search / external / embedded / social), referrer domain, country
- **Embed stats** — which external domains render the iframe, per-embed engagement
- **Channel subscribers, search queries, realtime concurrent-viewer counts**

All telemetry is harvested automatically by `@vidcastx/player` — no customer instrumentation needed.

**Status:** schema + event shapes defined; ingestion endpoints and dashboards pending.

### 3.5 Live streaming

- RTMP ingest per channel with rotatable stream keys
- Session tracking with peak concurrent viewers and broadcast duration
- **Auto-VOD** — every finished live session produces a recording video row that threads straight into the VOD pipeline (transcode → transcribe → chapter → summarize → distribute)
- Webhooks fire on live start / end / recording ready

**Status:** schema complete; ingest infrastructure pending.

### 3.6 Multi-platform distribution

- OAuth integrations with **YouTube, Twitch, TikTok, Facebook** (refresh + access token lifecycle managed)
- One-click cross-post: upload once → publish to N platforms in parallel
- Per-platform dispatch log: `pending / processing / success / failed` with external IDs, external URLs, and error payloads for debugging

**Status:** schema + token storage designed; dispatcher pending.

### 3.7 Auth, orgs, RBAC

- Better Auth: email / password + GitHub + Discord OAuth (more providers wirable)
- Organizations as the unit of isolation — every resource is org-scoped
- Owner / Admin / Member roles with invitation flow
- Redis-backed sessions with IP + user-agent tracking

**Status:** shipped.

### 3.8 Billing & metered usage

- Per-org tracking across **six metered dimensions**: encoding minutes, storage GB, AI tokens, bandwidth GB, live-streaming minutes, API requests
- Daily rollups with per-metric cost attribution (`usage_record` → `usage_summary`)
- Stripe subscription integration: customer, subscription, price, plan, trial + cancellation state
- Invoices, payment methods, credits, promo codes — all schema-ready with soft-delete

**Status:** schema complete; Stripe metered sync + customer dashboard pending.

### 3.9 Extensibility & developer surface

- **Webhooks** per org for lifecycle events — customers plug VidcastX into Zapier, n8n, internal pipelines
- **Fully typed API** via Eden Treaty — SaaS customers embed upload + playback + analytics reads in their own apps with end-to-end TypeScript types
- **OpenAPI** auto-generated docs
- **M2M JWT** for worker-to-API communication (rate-limited `/internal/token` endpoint)
- **`@vidcastx/player`** NPM package — universally compatible React + Web Component player that doubles as the telemetry collector

## 4. Tech stack highlights

| Layer    | Tech                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Frontend | TanStack Start (Vite + SSR), React 19, TanStack Router/Query/Form, Zod, shadcn + Tailwind v4, Uppy, zustand, nuqs      |
| API      | Elysia on Bun, TypeBox schemas, Better Auth, Eden Treaty typed client, OpenAPI                                         |
| DB       | PostgreSQL + pgvector, Drizzle ORM + Drizzle Kit                                                                       |
| Queues   | BullMQ + Redis                                                                                                         |
| Storage  | S3-compatible (MinIO dev, AWS / Cloudflare R2 / Hetzner prod), multipart resume                                        |
| Workers  | Node transcoder moving in-process to libav via `node-av` (MIT, prebuilt binaries, no system FFmpeg needed)             |
| AI       | Whisper (STT), LLM (chapters / summaries / SEO), ElevenLabs-class (dubbing), pgvector (semantic search)                |
| CDN      | Cloudflare / CloudFront fronting the public delivery bucket                                                            |
| Tooling  | Turbo, pnpm workspaces, ESLint 9 flat + type-aware strict, Prettier 3, Husky + lint-staged, sherif, `@t3-oss/env-core` |

Architectural signatures worth calling out:

- **Organization-scoped everything** — no resource exists without an `orgId`
- **Soft-delete everywhere** — videos, folders, assets, transcripts, chapters, channels, webhooks, integrations, subscriptions
- **State machines over flags** — explicit `status` enums with well-defined transitions and failure states
- **Allowlist response schemas** — API responses `Pick` fields explicitly; storage keys and internal JSONB blobs never leak
- **The API never touches video bytes** — upload is client-to-S3, transcoding is worker-side, the API only orchestrates

## 5. Competitive landscape

VidcastX doesn't fit neatly into one bucket — it spans three markets that rarely overlap in one product. That's both the differentiator and the scope risk.

### 5.1 Developer video APIs (direct API competitors)

| Competitor                                         | Strength                                                   | Where VidcastX differs                                                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Mux**                                            | Gold-standard streaming reliability, excellent QoS metrics | Pure infrastructure — no AI transcripts, no chapters, no distribution, no creator UI. VidcastX bundles the full lifecycle. |
| **Cloudflare Stream**                              | Cheap bandwidth, global edge                               | Zero AI, basic analytics, no live-to-VOD polish, no multi-platform distribution                                            |
| **api.video**                                      | Solid API, fair pricing                                    | Similar breadth to Stream; lacks the creator studio layer + AI automation                                                  |
| **Bunny Stream**                                   | Aggressive pricing                                         | Minimal feature set; playback only                                                                                         |
| **AWS IVS / MediaConvert / MediaLive / Elemental** | Enterprise-grade, AWS-integrated                           | Assembly required — customers still build the control plane VidcastX ships out of the box                                  |
| **Gumlet**                                         | Self-host + API hybrid                                     | Narrower AI surface, weaker analytics depth                                                                                |
| **VdoCipher**                                      | DRM / piracy protection                                    | Niche focus on DRM; VidcastX has broader lifecycle                                                                         |

**Wedge vs this tier:** VidcastX ships the creator studio, AI pipeline, distribution, live, and billing on top of the same API — **one vendor instead of five**.

### 5.2 Creator-facing hosting (UX competitors)

| Competitor                                | Strength                                                          | Where VidcastX differs                                         |
| ----------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| **Vimeo (Pro / OTT)**                     | Strong player, embed customization                                | Closed ecosystem, expensive at scale, slow AI feature shipping |
| **Wistia**                                | Best-in-class for B2B marketing video (CTAs, forms, integrations) | Narrow marketing focus; weak on AI, dubbing, distribution      |
| **Loom**                                  | Instant async-video messaging                                     | Not a hosting platform — ephemeral use case                    |
| **Vidyard**                               | Sales-enablement video                                            | Narrow niche like Loom / Wistia                                |
| **Uscreen / Dacast / Kajabi / Thinkific** | Course + membership video                                         | Closed, opinionated UIs; no API-first story                    |
| **Brightcove / JW Player**                | Enterprise broadcaster tooling                                    | Enterprise sales cycle, legacy UX, per-seat pricing            |
| **Panopto**                               | Internal corporate video                                          | Enterprise / campus focus, no creator story                    |

**Wedge vs this tier:** API-first + white-label + typed SDK — a customer can build their own Wistia / Vimeo on top of us in weeks, not months.

### 5.3 AI-video tooling (AI competitors)

| Competitor                           | Strength                                   | Where VidcastX differs                                                                 |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| **Descript**                         | Text-based video editing, podcast workflow | Desktop-first editing tool, not infrastructure                                         |
| **Opus Clip / Vizard / Munch**       | Auto-short-form clipping for social        | Single-purpose; VidcastX can host + analyze + distribute the clips these tools produce |
| **Riverside / Podcastle / Zencastr** | Remote recording with local-first quality  | Recording tools, not hosting or delivery                                               |
| **Rev / Deepgram / AssemblyAI**      | Best-of-breed STT                          | Transcript-only; no video context, no storage, no player                               |
| **ElevenLabs**                       | Best-of-breed voice AI                     | Dubbing only; VidcastX wraps it into an end-to-end translated-video workflow           |
| **HeyGen / Synthesia**               | AI avatars, synthetic video                | Focused on generation, not the long-tail of hosting + analytics + distribution         |

**Wedge vs this tier:** these tools become **features inside VidcastX** rather than standalone products — transcripts + dubbing + chapters + embeddings come free as a byproduct of hosting with us.

### 5.4 Live streaming (live competitors)

| Competitor                  | Strength                      | Where VidcastX differs                                           |
| --------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| **Restream / StreamYard**   | Multi-platform live simulcast | Broadcasting-only, no VOD / analytics / AI after the stream ends |
| **Agora / LiveKit / 100ms** | Low-latency WebRTC infra      | Real-time infra, not a product; assembly required                |
| **Mux Live / IVS**          | Live infrastructure           | Live only, no AI layer above the stream                          |
| **Twitch / YouTube Live**   | Owned audiences               | Closed platforms; you don't own the stream, chat, or audience    |

**Wedge vs this tier:** a live session **auto-becomes a VOD** in the same library, transcribed, chaptered, and distributable the next day — no re-upload, no re-transcribe.

### 5.5 Summary

No single competitor covers **API + creator UI + AI + live + distribution + usage-billing** under one tenant. Customers today stitch together Mux + Deepgram + ElevenLabs + Stripe + Zapier + Restream + a custom dashboard. **VidcastX's thesis is that the assembly itself is the product gap.**

## 6. Alternatives — what you'd build instead if VidcastX didn't exist

| "I just need to…"                          | Today                                                       | With VidcastX                                            |
| ------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------- |
| Host + stream video in my SaaS             | Mux + custom player + custom analytics + custom DB mapping  | Typed API + NPM embeddable player + built-in analytics   |
| Add transcripts & chapters to videos       | Deepgram + OpenAI + custom job queue + storage              | Flip a flag on the video record                          |
| Auto-publish to YouTube + TikTok           | Zapier chains + OAuth storage + error handling              | Integration toggles per org                              |
| Meter usage per customer for billing       | Custom events + Stripe metered prices + reconciliation cron | `usage_record` rolls up to `usage_summary` → Stripe      |
| Run a live show with VOD replay            | Restream + separate VOD host + re-upload + re-transcribe    | Live RTMP → auto-VOD → auto-transcript → auto-distribute |
| Offer semantic search inside video         | pgvector + custom embedding pipeline + segment indexing     | `transcript_embedding` table, indexed by default         |
| Translate a library to 10 languages        | Whisper + GPT + ElevenLabs + glue code + ops                | One AI job per target language                           |
| Measure embed engagement on customer sites | Custom beacon + ETL + warehouse + dashboard                 | `embed_stats` + analytics dashboard out of the box       |

## 7. Build status snapshot (2026-04)

**✅ Shipped**

- Monorepo, tooling, CI, commit / PR hooks
- Auth + orgs + RBAC + invitations (Better Auth)
- Resumable multipart upload pipeline (Uppy → S3)
- Video + folder CRUD API (v1)
- TanStack Start studio: auth, onboarding, dashboard, videos, folders
- Transcoder worker producing HLS + poster + hover preview
- M2M JWT between API and workers
- Typed API (Eden Treaty) + auto-generated OpenAPI

**🚧 In progress**

- Transcoder: subprocess FFmpeg → in-process `node-av` libav bindings (branch `feat/transcoder-libav`)

**📋 Designed, not yet built** (schemas + types present, endpoints / UI pending)

- `@vidcastx/player` NPM embeddable player package
- AI job orchestration endpoints (transcription, chapters, summaries, dubbing, metadata)
- Analytics ingestion + dashboards (heatmaps, realtime, dimensional slicing, embed stats)
- Live channel management + RTMP ingest infrastructure
- Distribution integrations (YouTube / Twitch / TikTok / Facebook OAuth + dispatcher)
- Billing dashboard + Stripe metered sync + invoices / credits UI
- Webhooks admin UI
- Marketing site (`apps/marketing`)
- Transcoder roadmap §1–§8: per-title encoding, segment checkpointing, chunked transcoding, hardware fingerprinting, AV1, convex-hull VMAF, structured job logging + admin UI (see `workers/transcoder/ROADMAP.md`)

## 8. Why now

1. **Creators want escape velocity from YouTube** — discovery is algorithmic, demonetization is arbitrary, audiences are rented. Owning the player + audience + data is the next wave.
2. **AI video features have commoditized** — Whisper, GPT, ElevenLabs, pgvector are all one API call away, but nobody has assembled them into a cohesive **video-lifecycle product** yet.
3. **Self-hostable infrastructure is back in fashion** — post–Twitter-API and post–Reddit-API shocks, developers are done betting their product on closed platforms.
4. **Per-title encoding + AV1 are finally practical** — prebuilt FFmpeg NAPI bindings (`node-av`) make the transcoder stack deployable on any Node / Bun host without system FFmpeg wrangling.
5. **Bun + TanStack Start + Drizzle + Better Auth** mean the full control plane can be built by a 1–3 person team that would have needed 10 engineers five years ago.
6. **Usage-based billing is the default SaaS pricing model now** — customers expect metered video minutes the way they expect metered LLM tokens.

## 9. North-star product statement

> **Upload a video. Ship a professional, transcribed, chaptered, semantically searchable, multilingual, multi-platform video experience — with hollywood-grade analytics and usage-based billing — in one API call or one button click.**

That is the product. Everything in this repo is in service of that one sentence.
