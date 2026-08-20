import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { toast } from "sonner"

const CATEGORY_COLORS = [
  { value: "from-purple-600/80 to-pink-600/80", label: "Púrpura", bg: "bg-purple-600" },
  { value: "from-blue-600/80 to-cyan-600/80", label: "Azul", bg: "bg-blue-600" },
  { value: "from-emerald-600/80 to-teal-600/80", label: "Verde", bg: "bg-emerald-600" },
  { value: "from-amber-600/80 to-orange-600/80", label: "Ámbar", bg: "bg-amber-600" },
  { value: "from-red-600/80 to-rose-600/80", label: "Rojo", bg: "bg-red-600" },
  { value: "from-cyan-600/80 to-sky-600/80", label: "Cian", bg: "bg-cyan-600" },
  { value: "from-violet-600/80 to-fuchsia-600/80", label: "Violeta", bg: "bg-violet-600" },
  { value: "from-lime-600/80 to-green-600/80", label: "Lima", bg: "bg-lime-600" },
  { value: "from-pink-600/80 to-rose-600/80", label: "Rosa", bg: "bg-pink-600" },
  { value: "from-indigo-600/80 to-purple-600/80", label: "Índigo", bg: "bg-indigo-600" },
]

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    staleTime: 60000,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] })
      toast.success("Categoría creada")
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateCategory(id, data),
    onSuccess: () => {
      // Renombrar arrastra la categoría en los activos: hay que refrescar ambas listas.
      qc.invalidateQueries({ queryKey: ["categories"] })
      qc.invalidateQueries({ queryKey: ["landings"] })
      qc.invalidateQueries({ queryKey: ["template-types"] })
      toast.success("Categoría actualizada")
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reassignTo } = {}) => api.deleteCategory(id, reassignTo),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["categories"] })
      qc.invalidateQueries({ queryKey: ["landings"] })
      qc.invalidateQueries({ queryKey: ["template-types"] })
      toast.success(
        res?.reassigned
          ? `Categoría eliminada — ${res.reassigned} activo(s) movidos a "${res.reassignedTo}"`
          : "Categoría eliminada"
      )
    },
    onError: (err) => toast.error(err.message),
  })
}

export function getColorBg(gradient) {
  const found = CATEGORY_COLORS.find((c) => c.value === gradient)
  return found ? found.bg : "bg-purple-600"
}

export { CATEGORY_COLORS }
