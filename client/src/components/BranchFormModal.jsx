import { useState, useEffect, useMemo } from "react"
import { Plus, X, ArrowLeft } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useTemplateTypes } from "../hooks/useTemplateTypes"
import { useCategories } from "../hooks/useCategories"

const estados = ["ACTIVO", "INACTIVO", "EN_DESARROLLO"]

const legacyFields = [
  { name: "url", label: "URL", fieldType: "url", required: true, placeholder: "https://..." },
  { name: "cliente", label: "Cliente", fieldType: "text", placeholder: "Nombre del cliente" },
  { name: "categoria", label: "Categoría", fieldType: "select", placeholder: "Seleccionar categoría" },
  { name: "estado", label: "Estado", fieldType: "selectEstado", placeholder: "Estado" },
  { name: "imagenUrl", label: "URL de la imagen de portada", fieldType: "url", placeholder: "https://ejemplo.com/screenshot.jpg" },
  { name: "formStatus", label: "Estado del formulario", fieldType: "selectFormStatus", placeholder: "Estado del form" },
  { name: "sheetUrl", label: "URL del Sheet", fieldType: "url", placeholder: "https://docs.google.com/spreadsheets/..." },
  { name: "ftpHost", label: "Host FTP", fieldType: "text", placeholder: "ftp.ejemplo.com" },
  { name: "ftpPath", label: "Ruta FTP", fieldType: "text", placeholder: "/public_html/" },
  { name: "ftpUser", label: "Usuario FTP", fieldType: "text", placeholder: "user" },
  { name: "ftpPass", label: "Contraseña FTP", fieldType: "password", placeholder: "••••••••" },
  { name: "tags", label: "Tags", fieldType: "text", placeholder: "premium, urgencia, redesign" },
  { name: "tecnologias", label: "Tecnologías", fieldType: "text", placeholder: "React, Tailwind, Node.js" },
  { name: "notas", label: "Notas", fieldType: "textarea", placeholder: "Información adicional..." },
]

const knownFields = new Set(["nombre", "marca", "url", "cliente", "estado", "categoria", "imagenUrl", "ftpHost", "ftpUser", "ftpPass", "ftpPath", "tecnologias", "notas", "sheetUrl", "formStatus", "tags"])

export default function BranchFormModal({ onSubmit, initialData, onSuccess, onClose, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false)
  const [form, setForm] = useState({ nombre: "", marca: "", url: "", estado: "ACTIVO", categoria: "Cober" })
  const [error, setError] = useState("")
  const [selectedTypeId, setSelectedTypeId] = useState(initialData?.templateTypeId || null)
  const [step, setStep] = useState(initialData?.templateTypeId ? "fillForm" : "selectType")
  const [hiddenFields, setHiddenFields] = useState(new Set())

  const { data: templateTypes = [] } = useTemplateTypes()
  const { data: categories = [] } = useCategories()

  const selectedType = templateTypes.find((t) => t.id === selectedTypeId)
  const templateFields = selectedType?.fieldDefinitions || []
  const isLegacy = !selectedTypeId

  const allFields = useMemo(() => {
    if (isLegacy) return legacyFields
    return templateFields
  }, [isLegacy, templateFields])

  const visibleFields = useMemo(() => {
    if (isLegacy) return allFields
    return allFields.filter((f) => !hiddenFields.has(f.name))
  }, [isLegacy, allFields, hiddenFields])

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          nombre: initialData.nombre || "",
          marca: initialData.marca || "",
          url: initialData.url || "",
          estado: initialData.estado || "ACTIVO",
          categoria: initialData.categoria || "Cober",
        })
        const parsedDyn = initialData.dynamicValues ? JSON.parse(initialData.dynamicValues) : {}
        setForm((prev) => ({ ...prev, ...parsedDyn }))
        setError("")
        const visibleArr = initialData.visibleFields ? JSON.parse(initialData.visibleFields) : null
        const hidden = visibleArr
          ? new Set(allFields.map((f) => f.name).filter((n) => !visibleArr.includes(n)))
          : new Set()
        setHiddenFields(hidden)
      } else {
        setForm({ nombre: "", marca: "", url: "", estado: "ACTIVO", categoria: "Cober" })
        setSelectedTypeId(null)
        setStep("selectType")
        setHiddenFields(new Set())
        setError("")
      }
    }
  }, [open, initialData])

  const handleOpenChange = (v) => {
    setOpen(v)
    if (!v) {
      setError("")
      setStep("selectType")
      setSelectedTypeId(null)
      if (onClose) onClose()
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const toggleField = (name) => {
    setHiddenFields((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const getValue = (field) => form[field.name] || ""

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const payload = {
        nombre: form.nombre,
        marca: form.marca,
        templateTypeId: selectedTypeId,
        visibleFields: [...allFields.map((f) => f.name).filter((n) => !hiddenFields.has(n))],
      }

      if (isLegacy) {
        payload.url = form.url
        payload.estado = form.estado
        payload.categoria = form.categoria
        for (const f of legacyFields) {
          if (f.name !== "categoria" && f.name !== "estado" && f.name !== "formStatus") {
            payload[f.name] = form[f.name] || ""
          }
        }
        payload.formStatus = form.formStatus || "PENDIENTE"
      } else {
        if (selectedType?.hasMonitoring) {
          payload.url = form.url
        }
        payload.estado = form.estado || "ACTIVO"
        payload.categoria = form.categoria || "Cober"
        payload.formStatus = form.formStatus || "PENDIENTE"

        const dynamicValues = {}
        for (const f of templateFields) {
          if (!knownFields.has(f.name)) {
            dynamicValues[f.name] = form[f.name] || ""
          } else if (["ftpHost", "ftpUser", "ftpPass", "ftpPath", "url", "sheetUrl", "imagenUrl", "tags", "tecnologias", "notas", "cliente", "formStatus"].includes(f.name)) {
            payload[f.name] = form[f.name] || ""
          }
        }
        payload.dynamicValues = dynamicValues
      }

      await onSubmit(payload)
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message)
    }
  }

  const renderField = (field) => {
    if (isLegacy && field.name === "categoria") {
      return (
        <div key={field.name} className="flex flex-col space-y-2">
          <Label>{field.label}</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (isLegacy && field.name === "estado") {
      return (
        <div key={field.name} className="flex flex-col space-y-2">
          <Label>{field.label}</Label>
          <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {estados.map((e) => <SelectItem key={e} value={e}>{e.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (isLegacy && field.name === "formStatus") {
      return (
        <div key={field.name} className="flex flex-col space-y-2">
          <Label>{field.label}</Label>
          <Select value={form.formStatus || "PENDIENTE"} onValueChange={(v) => setForm({ ...form, formStatus: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="OK">Verificado</SelectItem>
              <SelectItem value="ERROR">Con error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (field.fieldType === "textarea") {
      return (
        <div key={field.name} className="flex flex-col space-y-2">
          <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
          <textarea
            name={field.name} value={getValue(field)} onChange={handleChange} rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder={field.placeholder || ""}
          />
        </div>
      )
    }
    if (field.fieldType === "select") {
      return (
        <div key={field.name} className="flex flex-col space-y-2">
          <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
          <Select value={getValue(field)} onValueChange={(v) => setForm({ ...form, [field.name]: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(field.options ? JSON.parse(field.options) : []).map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }
    if (field.fieldType === "password") {
      return (
        <div key={field.name} className="flex flex-col space-y-2">
          <Label>{field.label}</Label>
          <Input name={field.name} type="password" value={getValue(field)} onChange={handleChange} placeholder={field.placeholder || ""} />
        </div>
      )
    }
    return (
      <div key={field.name} className="flex flex-col space-y-2">
        <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
        <Input name={field.name} type={field.fieldType || "text"} value={getValue(field)} onChange={handleChange} placeholder={field.placeholder || ""} />
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          {children || "Nueva Branch Comercial"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        {step === "selectType" && !initialData ? (
          <>
            <DialogHeader>
              <DialogTitle>¿Qué querés crear?</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <button
                onClick={() => { setSelectedTypeId(null); setStep("fillForm") }}
                className="w-full p-4 rounded-xl border border-input hover:border-primary hover:bg-accent transition-all text-left flex items-center gap-4"
              >
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-medium">Formulario clásico</p>
                  <p className="text-xs text-muted-foreground">Todos los campos de Branch Comercial (legacy)</p>
                </div>
              </button>
              {templateTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => { setSelectedTypeId(type.id); setStep("fillForm") }}
                  className="w-full p-4 rounded-xl border border-input hover:border-primary hover:bg-accent transition-all text-left flex items-center gap-4"
                >
                  <span className="text-2xl">{type.icon || "📄"}</span>
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-xs text-muted-foreground">{type.description || ""}</p>
                  </div>
                  {type.hasMonitoring && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 ml-auto">Monitoreo</span>}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {!initialData && (
                  <button type="button" onClick={() => setStep("selectType")} className="p-1 rounded hover:bg-accent transition-colors" title="Cambiar tipo">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <DialogTitle>
                  {initialData ? "Editar Branch Comercial" : `Nueva ${selectedType?.name || "Branch Comercial"}`}
                  {selectedType && <span className="ml-2 text-sm font-normal text-muted-foreground">{selectedType.icon} {selectedType.name}</span>}
                </DialogTitle>
              </div>
              {!isLegacy && !initialData && (
                <p className="text-xs text-muted-foreground mt-1">
                  Hacé click en la <X className="inline w-3 h-3" /> para ocultar campos que no necesites
                </p>
              )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="nombre">Nombre <span className="text-destructive">*</span></Label>
                  <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="BlackFriday 2026" required />
                </div>
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="marca">Marca <span className="text-destructive">*</span></Label>
                  <Input id="marca" name="marca" value={form.marca} onChange={handleChange} placeholder="Nike" required />
                </div>
              </div>

              {visibleFields.map((field) => {
                if (field.name === "nombre" || field.name === "marca") return null
                return (
                  <div key={field.name} className="relative group">
                    {renderField(field)}
                    {!isLegacy && (
                      <button
                        type="button"
                        onClick={() => toggleField(field.name)}
                        className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Ocultar este campo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )
              })}

              {!isLegacy && hiddenFields.size > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Campos ocultos (click para mostrar):</p>
                  <div className="flex flex-wrap gap-2">
                    {allFields.filter((f) => hiddenFields.has(f.name)).map((f) => (
                      <button
                        key={f.name}
                        type="button"
                        onClick={() => toggleField(f.name)}
                        className="text-xs px-2 py-1 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        + {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {initialData ? "Guardar cambios" : "Crear"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
