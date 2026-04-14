import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "#app/lib/api";

import { folderKeys } from "./folder-keys";
import { extractErrorMessage } from "./use-folder-browse";

export function useDeleteFolder(parentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data, error } = await client.api.v1.folders({ id }).delete();
      if (error) {
        throw new Error(extractErrorMessage(error, "Failed to delete folder"));
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.all() });
      void queryClient.invalidateQueries({ queryKey: folderKeys.browse(parentId) });
    },
  });
}
