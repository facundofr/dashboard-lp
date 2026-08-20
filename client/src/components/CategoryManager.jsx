import { useState } from "react"
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, CATEGORY_COLORS } from "../hooks/useCategories"
import { useAuth } from "../context/AuthContext"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import CategoryPicker from "./CategoryPicker"

export default function CategoryManager() {
  const { data: categories = [], isLoading } = useCategories()
  const createCat = useCreateCategory()
  const updateCat = useUpdateCategory()
  const deleteCat = useDeleteCategory()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0].value)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    await createCat.mutateAsync({ name: newName, color: newColor }).catch(() => {})
    setNewName("")
    setNewColor(CATEGORY_COLORS[0].value)
  }

  const handleUpdate = async (id) => {
    if (!editing || !editing.name.trim()) return
    await updateCat.mutateAsync({ id, data: { name: editing.name, color: editing.color } }).catch(() => {})
    setEditing(null)
  }

  // Si la categoría tiene activos, primero hay que elegir a dónde se mueven.
  const handleDelete = (cat) => {
    if (cat.landingsCount > 0) {
      const target = categories.find((c) => c.id !== cat.id)
      setDeleting({ ...cat, reassignTo: target?.name || "" })
      return
    }
    if (window.confirm(`¿Eliminar "${cat.name}"?`)) {
      deleteCat.mutateAsync({ id: cat.id }).catch(() => {})
    }
  }

  const confirmDelete = async () => {
    if (!deleting?.reassignTo) return
    await deleteCat.mutateAsync({ id: deleting.id, reassignTo: deleting.reassignTo }).catch(() => {})
    setDeleting(null)
  }

  if (isLoading) return null

  return (
    <div className="space-y-4">
      {isAdmin && (
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
          <div className="flex gap-1 items-center">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setNewColor(c.value)}
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${c.value} ${newColor === c.value ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                title={c.label}
              />
            ))}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> Crear
          </button>
        </form>
      )}

      <div className="divide-y">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 py-2">
            <span className={`w-3 h-3 rounded-full bg-gradient-to-br ${cat.color} shrink-0`} />
            {editing?.id === cat.id ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                />
                <div className="flex gap-1 items-center">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setEditing({ ...editing, color: c.value })}
                      className={`w-5 h-5 rounded-full bg-gradient-to-br ${c.value} ${editing.color === c.value ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleUpdate(cat.id)} className="h-8 px-2 rounded bg-primary text-primary-foreground text-xs font-medium">Guardar</button>
                  <button onClick={() => setEditing(null)} className="h-8 px-2 rounded bg-muted text-xs"><X className="w-3 h-3" /></button>
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {cat.landingsCount || 0} activo{cat.landingsCount === 1 ? "" : "s"}
                </span>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(cat)} className="p-1 rounded hover:bg-accent"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat)} className="p-1 rounded hover:bg-accent text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {deleting && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-3">
          <p className="text-sm">
            <span className="font-medium">"{deleting.name}"</span> tiene {deleting.landingsCount} activo(s) digital(es).
            Elegí a qué categoría moverlos antes de eliminarla.
          </p>
          <CategoryPicker
            value={deleting.reassignTo}
            onChange={(v) => setDeleting({ ...deleting, reassignTo: v })}
            categories={categories.filter((c) => c.id !== deleting.id)}
            placeholder="Mover a..."
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleting(null)} className="h-8 px-3 rounded-md bg-muted text-xs font-medium">Cancelar</button>
            <button
              onClick={confirmDelete}
              disabled={!deleting.reassignTo || deleteCat.isPending}
              className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium disabled:opacity-50"
            >
              Mover y eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
