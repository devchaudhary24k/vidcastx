import { useMutation, useQueryClient } from "@tanstack/react-query";

import client from "#app/lib/api";

import type { CreateFolderInput } from "../validator/folder-schema";
import { folderKeys } from "./folder-keys";
import { extractErrorMessage } from "./use-folder-browse";

type CreateFolderBody = CreateFolderInput & { parentId: string | null };

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateFolderBody) => {
      const { data, error } = await client.api.v1.folders.post(body);
      if (error) {
        throw new Error(extractErrorMessage(error, "Failed to create folder"));
      }
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: folderKeys.browse(variables.parentId) });
    },
  });
}
