import { useState, useEffect } from "react"
import { api } from "../lib/api"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { Crown, Check } from "lucide-react"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    limit: 10,
    features: ["10 landings", "Monitoreo cada 15 min", "Alertas por email", "Status page pública", "1 webhook"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9/mes",
    limit: 100,
    features: ["100 landings", "Monitoreo cada 5 min", "Alertas por email + webhook", "Status page personalizable", "Webhooks ilimitados", "API pública", "Export CSV"],
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$29/mes",
    limit: 1000,
    features: ["1000 landings", "Monitoreo cada 1 min", "Todo lo de Pro", "Equipos multiusuario", "Soporte prioritario", "Branding avanzado", "SLA 99.9%"],
  },
]

export default function PlanSelector() {
  const [currentPlan, setCurrentPlan] = useState("free")
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.getStats().then((s) => { setStats(s); setCurrentPlan(s.plan) }).catch(() => {})
  }, [])

  const handleSelect = async (planId) => {
    if (planId === currentPlan) return
    try {
      await api.updatePlan(planId)
      setCurrentPlan(planId)
      toast.success(`Plan cambiado a ${planId.toUpperCase()}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-5 h-5" />
        <h3 className="text-lg font-bold">Plan</h3>
      </div>
      {stats && (
        <p className="text-sm text-muted-foreground">
          Estás usando <span className="font-medium text-foreground">{stats.landings}</span> de <span className="font-medium">{stats.limit}</span> landings en el plan <span className="font-medium uppercase">{stats.plan}</span>.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border p-4 space-y-3 ${currentPlan === plan.id ? "border-primary ring-2 ring-primary/20" : ""} ${plan.popular ? "border-primary" : ""}`}
          >
            {plan.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">POPULAR</span>
            )}
            <div>
              <p className="font-bold">{plan.name}</p>
              <p className="text-2xl font-bold">{plan.price}</p>
            </div>
            <ul className="space-y-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant={currentPlan === plan.id ? "outline" : "default"}
              size="sm"
              className="w-full"
              onClick={() => handleSelect(plan.id)}
              disabled={currentPlan === plan.id}
            >
              {currentPlan === plan.id ? "Plan actual" : `Cambiar a ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}