import { useMutation } from "@tanstack/react-query";
import { spotifyApi } from "../api/client";

export function useSpotifyAnalyze() {
  return useMutation({
    mutationFn: ({ playlistId, include }) => spotifyApi.analyze(playlistId, include),
  });
}
