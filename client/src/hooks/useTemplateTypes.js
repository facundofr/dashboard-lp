import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { toast } from "sonner"

export function useTemplateTypes() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["template-types"],
    queryFn: api.getTemplateTypes,
  })

  const createMutation = useMutation({
    mutationFn: api.createTemplateType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-types"] })
      toast.success("Tipo de template creado")
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateTemplateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-types"] })
      toast.success("Tipo de template actualizado")
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteTemplateType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-types"] })
      toast.success("Tipo de template eliminado")
    },
    onError: (err) => toast.error(err.message),
  })

  return {
    data: query.data || [],
    loading: query.isLoading,
    createTemplateType: createMutation.mutateAsync,
    updateTemplateType: updateMutation.mutateAsync,
    deleteTemplateType: deleteMutation.mutateAsync,
  }
}
