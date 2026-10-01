import { useMutation } from "@tanstack/react-query";
import { analyzeApi } from "../api/client";

export function useRecommendations() {
  return useMutation({
    mutationFn: ({ file, minScore, perTrack }) =>
      analyzeApi.recommend(file, { minScore, perTrack }),
  });
}
