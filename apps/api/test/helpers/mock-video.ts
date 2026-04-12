/**
 * Mock video fixtures for testing.
 */
export const mockVideo = {
  id: "vid_testmockvideo123",
  orgId: "org_testorg123",
  uploaderId: "usr_testuser123",
  folderId: null,
  title: "Test Video",
  description: null,
  visibility: "private" as const,
  scheduledAt: null,
  publishedAt: null,
  status: "draft" as const,
  errorReason: null,
  duration: null,
  resolution: null,
  aspectRatio: null,
  frameCount: null,
  masterAccessUrl: "raw/org_testorg123/vid_testmockvideo123.mp4",
  playbackUrl: null,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  trashedAt: null,
  fileSize: null,
};
