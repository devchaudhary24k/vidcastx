import { MachineClient } from "@vidcastx/m2m";

import { env } from "./env";

const m2mClient = new MachineClient({
  apiUrl: env.API_URL,
  clientId: env.TRANSCODER_ID,
  clientSecret: env.TRANSCODER_SECRET,
});

export async function notifyApiStatus(
  videoId: string,
  status: "processing" | "ready" | "failed",
  data?: { playbackUrl?: string; errorReason?: string },
) {
  try {
    await m2mClient.request(`/api/internal/videos/${videoId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, ...data }),
    });

    console.log(`[Worker API] Successfully marked video ${videoId} as ${status}`);
  } catch (err) {
    console.error(`[Worker API] Network error notifying API for video ${videoId}:`, err);
    throw err; // Throw so BullMQ knows the job ultimately failed to report back
  }
}
