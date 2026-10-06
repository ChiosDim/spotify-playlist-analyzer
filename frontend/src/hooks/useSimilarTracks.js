import { useMutation } from "@tanstack/react-query";
import { analyzeApi } from "../api/client";

export function useSimilarTracks() {
  return useMutation({
    mutationFn: ({ file, minScore, perTrack }) =>
      analyzeApi.similarTracks(file, { minScore, perTrack }),
  });
}
