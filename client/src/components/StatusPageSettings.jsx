import { useState, useEffect } from "react"
import { api } from "../lib/api"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { toast } from "sonner"
import { ExternalLink, Copy, Globe } from "lucide-react"

export default function StatusPageSettings() {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [brandColor, setBrandColor] = useState("#7c3aed")
  const [logoUrl, setLogoUrl] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [slug, setSlug] = useState("")

  useEffect(() => {
    api.getStatusPage()
      .then((data) => {
        setPage(data)
        setTitle(data.title || "")
        setSubtitle(data.subtitle || "")
        setBrandColor(data.brandColor || "#7c3aed")
        setLogoUrl(data.logoUrl || "")
        setIsPublic(data.isPublic)
        setSlug(data.slug || "")
      })
      .catch(() => toast.error("Error al cargar status page"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateStatusPage({ title, subtitle, brandColor, logoUrl, isPublic })
      toast.success("Status page actualizada")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSlugChange = async () => {
    try {
      await api.updateStatusPageSlug(slug)
      toast.success("URL actualizada")
    } catch (err) {
      toast.error(err.message)
    }
  }

  const publicUrl = `${window.location.origin}/status/${slug}`

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl)
    toast.success("URL copiada al portapapeles")
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-5 h-5" />
        <h3 className="text-lg font-bold">Status Page Pública</h3>
      </div>
      <p className="text-sm text-muted-foreground">Compartí el estado de tus landings con un link público. Como Statuspage.io.</p>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        <Input value={publicUrl} readOnly className="font-mono text-sm flex-1" />
        <Button variant="outline" size="icon" onClick={copyUrl} title="Copiar"><Copy className="w-4 h-4" /></Button>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="icon" title="Abrir"><ExternalLink className="w-4 h-4" /></Button>
        </a>
      </div>

      <div className="space-y-3">
        <div>
          <Label>URL personalizada (slug)</Label>
          <div className="flex gap-2 mt-1">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="mi-empresa" className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleSlugChange}>Cambiar URL</Button>
          </div>
        </div>
        <div>
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Estado del Servicio" className="mt-1" />
        </div>
        <div>
          <Label>Subtítulo</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Descripción opcional" className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Color de marca</Label>
            <div className="flex gap-2 mt-1 items-center">
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
              <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="flex-1 font-mono text-sm" />
            </div>
          </div>
          <div>
            <Label>Logo URL (opcional)</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer pt-2">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4" />
          <div>
            <p className="text-sm font-medium">Pública</p>
            <p className="text-xs text-muted-foreground">Si está activado, cualquiera con el link puede verla</p>
          </div>
        </label>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>
    </div>
  )
}