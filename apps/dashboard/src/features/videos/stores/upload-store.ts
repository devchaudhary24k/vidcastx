import { Store } from "@tanstack/react-store";

export interface UploadItem {
  id: string;
  videoId: string;
  filename: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}

export interface UploadState {
  uploads: Record<string, UploadItem>;
  isGlobalUploading: boolean;
}

export const uploadStore = new Store<UploadState>({
  uploads: {},
  isGlobalUploading: false,
});

export const uploadActions = {
  // Initialize the store with default values
  addUpload: (id: string, item: UploadItem) => {
    uploadStore.setState((state) => ({
      ...state,
      isGlobalUploading: true,
      uploads: { ...state.uploads, [id]: item },
    }));
  },

  // Helper functions to update the store
  updateProgress: (id: string, progress: number) => {
    uploadStore.setState((state) => {
      const current = state.uploads[id];
      if (!current) return state;

      return {
        ...state,
        uploads: {
          ...state.uploads,
          [id]: { ...current, progress },
        },
      };
    });
  },

  // Helper functions to mark upload complete
  markComplete: (id: string) => {
    uploadStore.setState((state) => {
      const current = state.uploads[id];
      if (!current) return state;

      const newItem: UploadItem = {
        ...current,
        status: "complete",
        progress: 100,
      };

      const newUploads: Record<string, UploadItem> = {
        ...state.uploads,
        [id]: newItem,
      };

      const isStillUploading = Object.values(newUploads).some(
        (u) => u.status === "uploading",
      );

      return {
        ...state,
        uploads: newUploads,
        isGlobalUploading: isStillUploading,
      };
    });
  },

  // Helper functions to mark upload error
  markError: (id: string, error: string) => {
    uploadStore.setState((state) => {
      const current = state.uploads[id];
      if (!current) return state;

      const newItem: UploadItem = {
        ...current,
        status: "error",
        error,
      };

      return {
        ...state,
        uploads: {
          ...state.uploads,
          [id]: newItem,
        },
      };
    });
  },
};
