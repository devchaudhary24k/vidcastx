import { useQuery } from "@tanstack/react-query";
import client from "#app/lib/api";

interface UseVideosParams {
  page?: number;
  limit?: number;
}

export function videosQueryKey(params: UseVideosParams) {
  return ["videos", params] as const;
}

export function useVideos({ page = 1, limit = 20 }: UseVideosParams = {}) {
  return useQuery({
    queryKey: videosQueryKey({ page, limit }),
    queryFn: async () => {
      const { data, error } = await client.api.v1.videos.get({
        query: { page, limit },
      });
      if (error) {
        console.error("failed to load videos", error);
        const msg =
          typeof error.value === "object" && "error" in error.value && typeof error.value.error === "string"
            ? error.value.error
            : "Failed to load videos";
        throw new Error(msg);
      }
      return data;
    },
  });
}
