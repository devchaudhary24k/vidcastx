vidcastx/
├── apps/
│ ├── web/ # [Next.js] Dashboard, Marketing, & TUS Upload Client.
│ ├── api-server/ # [Elysia] The "Brain". Auth, Webhooks, Orchestration.
│ ├── live-server/ # [Node-Media-Server] RTMP Ingest & HLS Generation.
│ ├── worker-transcode/ # [Node.js + FFmpeg] VOD Encoding.
│ └── worker-ai/ # [Python/Node] Whisper Transcription & Summarization.
│
├── packages/
│ ├── db/ # [Drizzle ORM] DB Schema & Client (Shared).
│ ├── queue/ # [BullMQ] Redis Job Definitions (Shared).
│ ├── storage/ # [AWS SDK] Abstracted Hetzner/S3 Client (Shared).
│ ├── ui/ # [React] Design System components.
│ ├── player/ # [NPM Package] The custom Video Player.
│ └── ts-config/ # Shared TypeScript configs.
│
├── infra/
│ ├── docker/ # Docker Compose (Redis, Postgres, MinIO).
│ └── k8s/ # (Future) Kubernetes manifests.
│
└── turbo.json # Build pipeline configuration.
