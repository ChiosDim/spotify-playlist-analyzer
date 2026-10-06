import { useMutation } from "@tanstack/react-query";
import { spotifyApi } from "../api/client";

export function useLibrarySimilar() {
  return useMutation({
    mutationFn: ({ playlistId, minScore, perSource }) =>
      spotifyApi.similarFromLibrary(playlistId, { minScore, perSource }),
  });
}
