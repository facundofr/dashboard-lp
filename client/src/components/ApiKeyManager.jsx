import { useState, useEffect } from "react"
import { api } from "../lib/api"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { toast } from "sonner"
import { Key, Plus, Trash2, Copy, Code } from "lucide-react"

export default function ApiKeyManager() {
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [newKey, setNewKey] = useState(null)
  const [creating, setCreating] = useState(false)

  const fetch = () => {
    api.getApiKeys()
      .then(setKeys)
      .catch(() => toast.error("Error al cargar API keys"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const result = await api.createApiKey({ name: name || "API Key" })
      setNewKey(result.key)
      setName("")
      fetch()
      toast.success("API key creada")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta API key? Las integraciones que la usen dejarán de funcionar.")) return
    try {
      await api.deleteApiKey(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
      toast.success("API key eliminada")
    } catch (err) {
      toast.error(err.message)
    }
  }

  const copyKey = () => {
    navigator.clipboard.writeText(newKey)
    toast.success("API key copiada")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-5 h-5" />
        <h3 className="text-lg font-bold">API Keys</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Usá la API pública para consultar el estado de tus landings desde otros sistemas. Base URL: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{window.location.origin}/v1</code>
      </p>

      {newKey && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 space-y-2">
          <p className="text-sm font-medium text-green-600">API key creada. Copiala ahora, no se volverá a mostrar.</p>
          <div className="flex gap-2">
            <Input value={newKey} readOnly className="font-mono text-xs flex-1" />
            <Button variant="outline" size="icon" onClick={copyKey}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tenés API keys creadas</p>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm">
                <Code className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{k.prefix}...</p>
                </div>
                {k.lastUsedAt && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                    {new Date(k.lastUsedAt).toLocaleDateString("es-AR")}
                  </span>
                )}
                <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(k.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <Label>Crear nueva API key</Label>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (ej: Integración Slack)" />
          <Button onClick={handleCreate} disabled={creating}><Plus className="w-4 h-4" />Crear</Button>
        </div>
      </div>
    </div>
  )
}