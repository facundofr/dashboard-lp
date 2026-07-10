import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useFieldDefinitions } from "../hooks/useFieldDefinitions"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

const fieldTypeOptions = [
  { value: "text", label: "Texto" },
  { value: "url", label: "URL" },
  { value: "password", label: "Contraseña" },
  { value: "textarea", label: "Texto largo" },
]

export default function FieldDefinitionEditor({ typeId, fields: initialFields, standalone, onFieldsChange }) {
  const db = useFieldDefinitions(typeId)
  const [localFields, setLocalFields] = useState(initialFields || [])
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newType, setNewType] = useState("text")
  const [newRequired, setNewRequired] = useState(false)

  const displayFields = standalone ? localFields : (db.data.length > 0 ? db.data : initialFields)

  useEffect(() => {
    if (standalone && onFieldsChange) onFieldsChange(localFields)
  }, [localFields])

  useEffect(() => {
    if (standalone && initialFields) setLocalFields(initialFields)
  }, [initialFields])

  const resetForm = () => { setNewLabel(""); setNewType("text"); setNewRequired(false); setAdding(false) }

  const toName = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    const name = toName(newLabel)
    if (!name) return
    const field = {
      id: standalone ? Date.now() : undefined,
      name,
      label: newLabel.trim(),
      fieldType: newType,
      required: newRequired,
      sortOrder: displayFields.length,
      placeholder: null,
      options: null,
      defaultVisible: true,
    }
    if (standalone) {
      setLocalFields((prev) => [...prev, field])
      resetForm()
    } else {
      try {
        await db.createField({ ...field, placeholder: null, options: null, defaultVisible: true, sortOrder: displayFields.length })
        resetForm()
      } catch {}
    }
  }

  const handleDelete = async (field) => {
    if (!window.confirm(`¿Eliminar "${field.label}"?`)) return
    if (standalone) {
      setLocalFields((prev) => prev.filter((f) => f !== field))
    } else {
      await db.deleteField(field.id)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-1">
        Estos son los campos del formulario. Cada campo se puede ocultar con la <strong>X</strong> al crear un activo.
      </p>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Ej: URL, Teléfono, Notas..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd() } }}
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm w-28"
        >
          {fieldTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
          <input type="checkbox" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} className="w-4 h-4" />
          Requerido
        </label>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!newLabel.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {displayFields.length > 0 && (
        <div className="space-y-1 mt-3">
          {displayFields.map((field) => (
            <div key={field.id || field.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors group">
              <span className="text-sm flex-1">{field.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{fieldTypeOptions.find(o => o.value === field.fieldType)?.label || field.fieldType}</span>
              {field.required && <span className="text-xs text-destructive font-bold" title="Requerido">*</span>}
              <button onClick={() => handleDelete(field)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 transition-all">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
