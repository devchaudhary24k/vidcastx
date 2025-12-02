# Vidcastx Master To-Do List

## Phase 1: Core Infrastructure Packages

### packages/redis (Infrastructure)

- [x] Initialize Package: Setup ioredis connection.
- [x] Singleton Implementation: Ensure global singleton pattern for hot-reloading.
- [x] Connection Events: Add error handling and connection logging (prevent silent failures).

### packages/storage (File Handling)

- [ ] Initialize Package: Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
- [ ] Client Factory: Create an exported S3 Client configured via .env (Endpoint, Region, Keys).

- Upload Utilities:
  - [ ] `uploadFile(bucket, key, buffer/stream)`
  - [ ] `generatePresignedUploadUrl(bucket, key)` (For direct browser uploads later).

- Download Utilities:
  - [ ] `downloadFile(bucket, key, localPath)` (For workers to fetch raw files).
  - [ ] `getFileStream(bucket, key)`

- Management:
  - [ ] `deleteFile(bucket, key)`
  - [ ] `deleteFolder(bucket, prefix)` (For cleaning up HLS folders).

### packages/queue (Job Orchestration)

- [ ] Initialize Package: Install `bullmq`.
- Queue Definitions:
  - [ ] Define video-processing queue.
  - [ ] Define ai-jobs queue.
  - [ ] Define webhooks queue.

- Job Types (TypeScript):
  - [ ] Define `TranscodeJobData` interface (videoId, filePath).
  - [ ] Define `AIJobData` interface (videoId, type: 'transcribe' | 'dub').

- Worker Factory: Create a reusable `createWorker` function that automatically connects to the shared Redis.

---

## Phase 2: Dashboard Architecture & UI

Build the "Mux/Vercel-like" Interface.

### Sidebar Structure & Navigation

The dashboard will be divided into Contexts (Organization switching at top).

### 1. Media Management (Core)

- [ ] Home / Overview: High-level stats (Views today, Storage used).
- [ ] Videos (List View):
  - Datatable with columns: Thumbnail, Title, Status, Created At, Duration.
  - Filter tabs: All, Processing, Ready, Failed.

- Video Detail View (deep dive page):
  - [ ] Player Preview.
  - [ ] Asset Files (Download links for m3u8, mp4).
  - [ ] Transcript / Subtitles Editor.
  - [ ] AI Dubbing Settings.

- Live Streaming:
  - [ ] Stream Key display (Persistent).
  - [ ] Go Live status indicator.
  - [ ] Past Streams (Recordings) list.

### 2. Data & Insights

- Analytics:
  - [ ] Views over time (Line chart).
  - [ ] Geography (Map).
  - [ ] Device/OS breakdown (Pie charts).
  - [ ] Real-time "Now Watching" counter.

### 3. Developers (The “Mux” part)

- API Keys:
  - [ ] List keys.
  - [ ] Create new token (Secret Key reveal UI).

- Webhooks:
  - [ ] Add Endpoint URL.
  - [ ] Event Selector (checkboxes for video.ready, etc.).
  - [ ] Webhook Logs: List of recent delivery attempts and response codes (200/500).

### 4. Organization Settings

- General: Org Name, Slug, Logo upload.
- Team:
  - [ ] Member list with Roles.
  - [ ] “Invite Member” modal.

- Billing:
  - [ ] Usage bars (Encoding minutes used / limit).
  - [ ] Invoices list (Stripe integration).
  - [ ] Plan upgrade/downgrade UI.

---

## Phase 3: Feature Development

### feat-upload (Video Input)

- [ ] API: Implement TUS Server in Elysia (`@tus/server`).
- [ ] Configure S3 Store for TUS.
- [ ] Add `onUploadComplete` hook to trigger Database insert.
- [ ] Add `onUploadComplete` hook to trigger BullMQ transcode job.
- UI:
  - [ ] Create `UploadArea` component.
  - [ ] Drag & Drop zone.
  - [ ] Progress bar with Resume/Pause buttons.

### feat-process (Transcoding Engine)

- Worker: Scaffold `apps/worker-transcode`.
- FFmpeg tasks:
  - [ ] Script to generate HLS Master Playlist + 3 variants (1080p, 720p, 480p).
  - [ ] Script to extract Thumbnail image at t=2s.

- Flow:
  - [ ] Worker downloads raw file from Storage.
  - [ ] Runs FFmpeg.
  - [ ] Uploads HLS segments back to Storage.
  - [ ] Updates Database `video.status` to ready.

### feat-ai (Intelligence Layer)

- Worker: Scaffold `apps/worker-ai`.
- Transcription:
  - [ ] Integrate Whisper or Deepgram.
  - [ ] Save VTT file to Storage.
  - [ ] Save text to Database (transcripts table).

- Dubbing:
  - [ ] Integrate ElevenLabs.
  - [ ] Translate text and generate audio.
  - [ ] Merge new audio track into HLS manifest.

### feat-auth (Security & Access)

- [ ] Middleware: Implement “Hybrid Guard” in API (Cookie vs API Key).
- API Keys:
  - [ ] Implement key generation and hashing logic.
- RBAC:
  - [ ] Ensure “Viewer” role cannot delete videos in API logic.

### feat-dist (Distribution)

- YouTube integration:
  - [ ] Configure Google Cloud Console Project.
  - [ ] Implement OAuth2 flow in Dashboard (“Connect YouTube”).
  - [ ] Create `apps/worker-publisher` to handle upload streams to YouTube.

---

## Housekeeping & Ops

- [ ] CI/CD: Setup GitHub Actions to lint/build.
- [ ] Docker: Ensure all new apps (worker-transcode, worker-ai) have Dockerfiles.
- [ ] Documentation: Create a `CONTRIBUTING.md` for open-source devs.
