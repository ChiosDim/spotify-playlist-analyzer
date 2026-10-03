import { useMutation } from "@tanstack/react-query";
import { spotifyApi } from "../api/client";

export function useSpotifyAnalyze(options = {}) {
  return useMutation({
    mutationFn: ({ playlistId, include }) => spotifyApi.analyze(playlistId, include),
    ...options,
  });
}
