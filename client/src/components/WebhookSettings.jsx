import { useState, useEffect } from "react"
import { api } from "../lib/api"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { toast } from "sonner"
import { Plus, Trash2, TestTube, Webhook } from "lucide-react"

export default function WebhookSettings({ onClose }) {
  const [webhooks, setWebhooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState("")
  const [newEvents, setNewEvents] = useState("down,ssl_expiring")
  const [newSecret, setNewSecret] = useState("")
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    api.getWebhooks().then(setWebhooks).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!newUrl) return
    try {
      const wh = await api.createWebhook({ url: newUrl, events: newEvents, secret: newSecret || undefined })
      setWebhooks((prev) => [...prev, wh])
      setNewUrl("")
      setNewSecret("")
      toast.success("Webhook agregado")
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteWebhook(id)
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
      toast.success("Webhook eliminado")
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleTest = async (url) => {
    setTesting(true)
    try {
      const result = await api.testWebhook(url)
      if (result.ok) {
        toast.success("Webhook funcionando correctamente")
      } else {
        toast.error(`Error: ${result.error || "No se pudo conectar"}`)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Webhook className="w-5 h-5" />
        <h3 className="text-lg font-bold">Webhooks</h3>
      </div>
      <p className="text-sm text-muted-foreground">Recibí notificaciones en Slack, Discord u otros servicios cuando una landing se caiga o el SSL esté por vencer.</p>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
              <div className={`w-2 h-2 rounded-full shrink-0 ${wh.enabled ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="flex-1 truncate">{wh.url}</span>
              <span className="text-xs text-muted-foreground">{wh.events}</span>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleTest(wh.url)} disabled={testing}>
                <TestTube className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => handleDelete(wh.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <Label>Agregar webhook</Label>
        <Input placeholder="https://hooks.slack.com/services/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
        <div className="flex gap-2">
          <select value={newEvents} onChange={(e) => setNewEvents(e.target.value)} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="down,ssl_expiring">Caídas + SSL</option>
            <option value="down">Solo caídas</option>
            <option value="ssl_expiring">Solo SSL</option>
          </select>
          <Input placeholder="Secret (opcional)" value={newSecret} onChange={(e) => setNewSecret(e.target.value)} className="flex-1" />
          <Button onClick={handleAdd} size="sm"><Plus className="w-4 h-4" />Agregar</Button>
        </div>
      </div>
    </div>
  )
}