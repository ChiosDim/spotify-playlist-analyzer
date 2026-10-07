import { useMutation } from "@tanstack/react-query";
import { spotifyApi } from "../api/client";

export function useSpotifySimilarTracks() {
  return useMutation({
    mutationFn: ({ playlistId, minScore, perTrack }) =>
      spotifyApi.similarTracks(playlistId, { minScore, perTrack }),
  });
}
