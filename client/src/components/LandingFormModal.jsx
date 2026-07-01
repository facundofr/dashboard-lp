import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "./ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

const categorias = ["Cober", "Bristol", "Medicals", "Centros Médicos"]
const estados = ["ACTIVO", "INACTIVO", "EN_DESARROLLO"]

const emptyForm = {
  nombre: "", marca: "", url: "", estado: "ACTIVO", categoria: "Cober",
  ftpHost: "", ftpUser: "", ftpPass: "", ftpPath: "",
  tecnologias: "", notas: "", imagenUrl: "", sheetUrl: "", formStatus: "PENDIENTE", tags: "", cliente: "",
}

export default function LandingFormModal({ onSubmit, initialData, onSuccess, children }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...initialData } : { ...emptyForm })
    }
  }, [open, initialData])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSubmit(form)
    setOpen(false)
    if (onSuccess) onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          {children || "Nueva Landing"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Landing" : "Nueva Landing"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="BlackFriday 2026" required />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" name="marca" value={form.marca} onChange={handleChange} placeholder="Nike" required />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input id="cliente" name="cliente" value={form.cliente} onChange={handleChange} placeholder="Nombre del cliente" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" value={form.url} onChange={handleChange} placeholder="https://..." required />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Categoría</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Estado</Label>
              <Select
                value={form.estado}
                onValueChange={(v) => setForm({ ...form, estado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((e) => (
                    <SelectItem key={e} value={e}>{e.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="imagenUrl">URL de la imagen de portada</Label>
            <Input id="imagenUrl" name="imagenUrl" value={form.imagenUrl} onChange={handleChange} placeholder="https://ejemplo.com/screenshot.jpg" />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Formulario (Google Sheet)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="sheetUrl">URL del Sheet</Label>
                <Input id="sheetUrl" name="sheetUrl" value={form.sheetUrl} onChange={handleChange} placeholder="https://docs.google.com/spreadsheets/..." />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Estado del formulario</Label>
                <Select value={form.formStatus} onValueChange={(v) => setForm({ ...form, formStatus: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                    <SelectItem value="OK">Verificado</SelectItem>
                    <SelectItem value="ERROR">Con error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">FTP (opcional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="ftpHost">Host</Label>
                <Input id="ftpHost" name="ftpHost" value={form.ftpHost} onChange={handleChange} placeholder="ftp.ejemplo.com" />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="ftpPath">Ruta</Label>
                <Input id="ftpPath" name="ftpPath" value={form.ftpPath} onChange={handleChange} placeholder="/public_html/" />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="ftpUser">Usuario</Label>
                <Input id="ftpUser" name="ftpUser" value={form.ftpUser} onChange={handleChange} placeholder="user" />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="ftpPass">Contraseña</Label>
                <Input id="ftpPass" name="ftpPass" type="password" value={form.ftpPass} onChange={handleChange} placeholder="••••••••" />
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" name="tags" value={form.tags} onChange={handleChange} placeholder="premium, urgencia, redesign" />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="tecnologias">Tecnologías</Label>
            <Input id="tecnologias" name="tecnologias" value={form.tecnologias} onChange={handleChange} placeholder="React, Tailwind, Node.js" />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas" name="notas" value={form.notas} onChange={handleChange} rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Información adicional..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialData ? "Guardar cambios" : "Crear Landing"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
