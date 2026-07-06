import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import { toast } from "sonner"

export function useFieldDefinitions(typeId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["field-definitions", typeId],
    queryFn: () => api.getFieldDefinitions(typeId),
    enabled: !!typeId,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["field-definitions"] })

  const createMutation = useMutation({
    mutationFn: (data) => api.createFieldDefinition(typeId, data),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateFieldDefinition(typeId, id, data),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteFieldDefinition(typeId, id),
    onSuccess: () => {
      invalidate()
      toast.success("Campo eliminado")
    },
    onError: (err) => toast.error(err.message),
  })

  return {
    data: query.data || [],
    loading: query.isLoading,
    createField: createMutation.mutateAsync,
    updateField: updateMutation.mutateAsync,
    deleteField: deleteMutation.mutateAsync,
  }
}
