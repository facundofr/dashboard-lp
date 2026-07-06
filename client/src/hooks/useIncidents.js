import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"

export function useActiveIncidents() {
  return useQuery({
    queryKey: ["incidents", "active"],
    queryFn: () => api.getActiveIncidents(),
    refetchInterval: 30000,
    staleTime: 10000,
  })
}

export function useIncidentHistory(page = 1) {
  return useQuery({
    queryKey: ["incidents", "history", page],
    queryFn: () => api.getIncidentHistory(page),
    staleTime: 30000,
  })
}
