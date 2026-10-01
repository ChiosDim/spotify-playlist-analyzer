import { useMutation } from "@tanstack/react-query";
import { analyzeApi } from "../api/client";

export function useCompare() {
  return useMutation({ mutationFn: analyzeApi.compare });
}
