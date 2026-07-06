import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { toast } from "sonner"

export function useLandings({ search, activeCategoria, activeStatus, activeUptime, activeTag, currentPage } = {}) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["landings"],
    queryFn: async () => {
      const res = await api.getLandings(1, 100)
      return res.data || res
    },
    refetchInterval: 30000,
    staleTime: 10000,
  })

  const landings = query.data || []
  const loading = query.isLoading

  const filtered = landings.filter((l) => {
    if (activeCategoria && l.categoria !== activeCategoria) return false
    if (activeStatus !== "todas" && l.estado !== activeStatus) return false
    if (activeUptime === "UP" && l.ultimoStatus !== "UP") return false
    if (activeUptime === "DOWN" && l.ultimoStatus !== "DOWN") return false
    if (activeUptime === "sin_verificar" && l.ultimoStatus) return false
    if (activeTag && (!l.tags || !l.tags.toLowerCase().includes(activeTag.toLowerCase()))) return false
    if (search) {
      const q = search.toLowerCase()
      if (!l.nombre.toLowerCase().includes(q) && !l.marca.toLowerCase().includes(q) && !l.url.toLowerCase().includes(q)) return false
    }
    return true
  })

  const stats = {
    total: landings.length,
    up: landings.filter((l) => l.ultimoStatus === "UP").length,
    down: landings.filter((l) => l.ultimoStatus === "DOWN").length,
    sinVerificar: landings.filter((l) => !l.ultimoStatus).length,
  }

  const tags = [...new Set(landings.flatMap((l) => (l.tags ? l.tags.split(",").map((t) => t.trim()) : [])))].sort()

  const ITEMS_PER_PAGE = 12
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const createMutation = useMutation({
    mutationFn: (data) => api.createLanding(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landings"] }) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateLanding(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landings"] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteLanding(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landings"] }) },
  })

  const checkAllMutation = useMutation({
    mutationFn: () => api.checkAllLandings(),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landings"] }) },
  })

  const bulkCheckMutation = useMutation({
    mutationFn: (ids) => api.bulkCheckLandings(ids),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landings"] }) },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => api.bulkDeleteLandings(ids),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["landings"] }) },
  })

  return {
    landings,
    filteredLandings: filtered,
    paginatedLandings: paginated,
    totalPages,
    loading,
    stats,
    tags,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["landings"] }),
    createLanding: createMutation.mutateAsync,
    updateLanding: updateMutation.mutateAsync,
    deleteLanding: deleteMutation.mutateAsync,
    checkAllLandings: checkAllMutation.mutateAsync,
    bulkCheckLandings: bulkCheckMutation.mutateAsync,
    bulkDeleteLandings: bulkDeleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isCheckingAll: checkAllMutation.isPending,
    isBulkChecking: bulkCheckMutation.isPending,
  }
}
