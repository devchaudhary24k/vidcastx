import { useMutation, useQueryClient } from "@tanstack/react-query";

import client from "#app/lib/api";

import type { FolderVisibility } from "../validator/folder-schema";
import { folderKeys } from "./folder-keys";
import { extractErrorMessage } from "./use-folder-browse";

type UpdateFolderPatch = Partial<{
  name: string;
  parentId: string | null;
  visibility: FolderVisibility;
  color: string;
  coverImageUrl: string | null;
  description: string | null;
  pinned: boolean;
  defaultVideoPrivate: boolean;
}>;

export function useUpdateFolder(parentId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateFolderPatch }) => {
      const { data, error } = await client.api.v1.folders({ id }).patch(patch);
      if (error) {
        throw new Error(extractErrorMessage(error, "Failed to update folder"));
      }
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.browse(parentId) });
      if (variables.patch.parentId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: folderKeys.browse(variables.patch.parentId) });
      }
      void queryClient.invalidateQueries({ queryKey: folderKeys.detail(variables.id) });
    },
  });
}
