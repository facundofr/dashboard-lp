import { useState, useEffect } from "react"
import { api } from "../lib/api"
import { Button } from "./ui/button"
import { CheckCircle, Circle, X, Rocket } from "lucide-react"
import { toast } from "sonner"

const STORAGE_KEY = "gl_onboarding_dismissed"

const steps = [
  { id: "create", label: "Creá tu primera landing", desc: "Agregá una landing para empezar a monitorearla." },
  { id: "check", label: "Verificá una landing", desc: "Hacé click en 'Verificar' para ver su estado actual." },
  { id: "statuspage", label: "Configurá tu status page", desc: "Compartí el estado de tus landings con un link público." },
  { id: "webhook", label: "Conectá un webhook", desc: "Recibí notificaciones en Slack o Discord." },
]

export default function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false)
  const [stats, setStats] = useState(null)
  const [webhooks, setWebhooks] = useState(0)
  const [statusPage, setStatusPage] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "true") setDismissed(true)

    api.getStats().then((s) => setStats(s)).catch(() => {})
    api.getWebhooks().then((w) => setWebhooks(w.length)).catch(() => {})
    api.getStatusPage().then((sp) => setStatusPage(sp)).catch(() => {})
  }, [])

  if (dismissed) return null

  const completed = {
    create: (stats?.landings || 0) > 0,
    check: (stats?.logs || 0) > 0,
    statuspage: !!statusPage,
    webhook: webhooks > 0,
  }

  const completedCount = Object.values(completed).filter(Boolean).length
  const allDone = completedCount === steps.length

  if (allDone) return null

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setDismissed(true)
    toast.success("Onboarding completado")
  }

  return (
    <div className="rounded-xl border bg-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">Onboarding — {completedCount}/{steps.length}</h3>
        </div>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 mb-4">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="space-y-1.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3 text-sm">
            {completed[step.id] ? (
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={completed[step.id] ? "text-muted-foreground line-through" : "font-medium"}>{step.label}</p>
              {!completed[step.id] && <p className="text-xs text-muted-foreground">{step.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}