import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "#app/lib/api";

import { folderKeys } from "./folder-keys";
import { extractErrorMessage } from "./use-folder-browse";

export function useToggleVideoPin(parentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { data, error } = await client.api.v1.videos({ id }).patch({ pinned });
      if (error) {
        throw new Error(extractErrorMessage(error, "Failed to update video"));
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.browse(parentId) });
    },
  });
}
