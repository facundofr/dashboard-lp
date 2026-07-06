import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useTemplateTypes } from "../hooks/useTemplateTypes"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import FieldDefinitionEditor from "./FieldDefinitionEditor"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog"

const iconOptions = ["📄", "🌐", "🏢", "🔑", "🛒", "📱", "💻", "🎯", "📊", "⚙️", "🔒", "📝", "🎨", "🚀", "📦", "🛡️", "🎬", "📡", "🖥️"]

export default function TemplateTypeManager() {
  const { data: types, loading, createTemplateType, updateTemplateType, deleteTemplateType } = useTemplateTypes()
  const [openCreate, setOpenCreate] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: "", icon: "📄", description: "", hasMonitoring: false })
  const [fields, setFields] = useState([])
  const [editingFields, setEditingFields] = useState(null)

  const resetForm = () => {
    setForm({ name: "", icon: "📄", description: "", hasMonitoring: false })
    setFields([])
    setEditId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    try {
      if (editId) {
        await updateTemplateType({ id: editId, data: form })
      } else {
        await createTemplateType({ ...form, fields })
      }
      resetForm()
      setOpenCreate(false)
    } catch (err) {
      // error handled by the hook via toast
    }
  }

  const handleEdit = (type) => {
    setEditId(type.id)
    setForm({ name: type.name, icon: type.icon || "📄", description: type.description || "", hasMonitoring: type.hasMonitoring })
    setOpenCreate(true)
  }

  const handleDelete = async (type) => {
    if (!window.confirm(`¿Eliminar el tipo "${type.name}"?`)) return
    await deleteTemplateType(type.id)
  }

  if (loading) return <div className="text-sm text-muted-foreground">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tipos de Template</h3>
        <Dialog open={openCreate} onOpenChange={(v) => { setOpenCreate(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4" /> Nuevo Tipo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Tipo" : "Nuevo Tipo de Template"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label>Nombre del template</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Landing, Marca, Credencial" required />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Icono</Label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 text-lg rounded-lg border flex items-center justify-center hover:bg-accent transition-colors ${form.icon === icon ? "border-primary bg-accent ring-2 ring-primary/30" : "border-input"}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Descripción</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="¿Para qué se usa este tipo?" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="hasMonitoring" checked={form.hasMonitoring} onChange={(e) => setForm({ ...form, hasMonitoring: e.target.checked })} className="w-4 h-4" />
                <Label htmlFor="hasMonitoring">Habilitar monitoreo (uptime/SSL)</Label>
              </div>

              {!editId && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-semibold">Campos del template</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Definí los campos que va a tener este tipo. Después podés editarlos desde la lista.
                  </p>
                  <FieldDefinitionEditor
                    fields={fields}
                    standalone
                    onFieldsChange={setFields}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); resetForm() }}>Cancelar</Button>
                <Button type="submit">{editId ? "Guardar" : "Crear Tipo"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {types.map((type) => (
          <Card key={type.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon || "📄"}</span>
                <div>
                  <CardTitle className="text-base">{type.name}</CardTitle>
                  {type.description && <p className="text-xs text-muted-foreground">{type.description}</p>}
                </div>
                {type.hasMonitoring && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Monitoreo</span>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(type)} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(type)} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <button
                onClick={() => setEditingFields(editingFields === type.id ? null : type.id)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {editingFields === type.id ? "Ocultar campos" : `${type.fieldDefinitions?.length || 0} campos definidos`}
              </button>
              {editingFields === type.id && (
                <div className="mt-3">
                  <FieldDefinitionEditor typeId={type.id} fields={type.fieldDefinitions || []} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {types.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No hay tipos de template todavía. Creá uno para empezar.</p>
        )}
      </div>
    </div>
  )
}
