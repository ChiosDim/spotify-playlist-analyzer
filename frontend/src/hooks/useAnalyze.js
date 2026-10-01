import { useMutation } from "@tanstack/react-query";
import { analyzeApi } from "../api/client";

export function useAnalyze() {
  return useMutation({ mutationFn: analyzeApi.upload });
}
