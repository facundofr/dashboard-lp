import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Globe, ShieldCheck, Bell, Webhook, Activity, Share2, Code, Zap, Check, ArrowRight } from "lucide-react"

const features = [
  { icon: Activity, title: "Monitoreo de Uptime", desc: "Verificamos tus landings cada 15 minutos. Sabé al instante si alguna se cae." },
  { icon: ShieldCheck, title: "Control de SSL", desc: "Alertas antes de que venzan los certificados. Nunca más un SSL vencido." },
  { icon: Bell, title: "Alertas por Email", desc: "Notificaciones automáticas a tu equipo cuando algo falla." },
  { icon: Webhook, title: "Webhooks", desc: "Integrá con Slack, Discord o cualquier sistema. Notificaciones en tiempo real." },
  { icon: Share2, title: "Status Page Pública", desc: "Compartí el estado de tus servicios con un link. Como Statuspage.io." },
  { icon: Code, title: "API Pública", desc: "Consultá el estado de tus landings desde otros sistemas con API keys." },
]

const plans = [
  { name: "Free", price: "$0", desc: "Para empezar", features: ["10 landings", "Monitoreo cada 15 min", "Alertas por email", "Status page pública"] },
  { name: "Pro", price: "$9", desc: "Para profesionales", features: ["100 landings", "Monitoreo cada 5 min", "Webhooks ilimitados", "API pública", "Export CSV"], popular: true },
  { name: "Team", price: "$29", desc: "Para equipos", features: ["1000 landings", "Monitoreo cada 1 min", "Equipos multiusuario", "Soporte prioritario", "SLA 99.9%"] },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">GL</div>
          <span className="font-bold">Gestor Landings</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
          <Link to="/login">
            <Button size="sm">Empezar gratis</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 py-20 sm:py-32">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="w-3 h-3" />
          Monitoreo de landings en tiempo real
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mb-6">
          Nunca más una landing<span className="text-primary"> caída</span> sin saberlo
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Monitoreo de uptime, SSL y formularios para tus landing pages. Alertas por email y webhook.
          Status page pública compartible. Todo en un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/login">
            <Button size="lg" className="gap-2">
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline">Ver features</Button>
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Sin tarjeta de crédito. Plan free para siempre.</p>
      </section>

      {/* Stats band */}
      <section className="border-y bg-muted/30 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center px-4">
          <div><p className="text-3xl font-bold">15 min</p><p className="text-sm text-muted-foreground">Frecuencia de check</p></div>
          <div><p className="text-3xl font-bold">99.9%</p><p className="text-sm text-muted-foreground">Uptime detectado</p></div>
          <div><p className="text-3xl font-bold">30s</p><p className="text-sm text-muted-foreground">Alertas en tiempo real</p></div>
          <div><p className="text-3xl font-bold">∞</p><p className="text-sm text-muted-foreground">Webhooks</p></div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesitás para monitorear</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Una plataforma completa para gestionar y monitorear todas tus landings pages.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Planes simples</h2>
          <p className="text-muted-foreground text-center mb-12">Empezá gratis. Actualizá cuando lo necesites.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.name} className={`relative p-6 rounded-xl border bg-card ${p.popular ? "border-primary ring-2 ring-primary/20" : ""}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full">POPULAR</span>
                )}
                <p className="font-semibold">{p.name}</p>
                <p className="text-3xl font-bold mt-2">{p.price}<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                <ul className="space-y-2 mt-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block mt-6">
                  <Button variant={p.popular ? "default" : "outline"} className="w-full">
                    {p.price === "$0" ? "Empezar gratis" : `Elegir ${p.name}`}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Empezá a monitorear en 2 minutos</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Creá tu cuenta, agregá tu primera landing y recibí alertas al instante.</p>
        <Link to="/login">
          <Button size="lg" className="gap-2">Crear cuenta gratis <ArrowRight className="w-4 h-4" /></Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Gestor Landings — Monitoreo de landings pages</span>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/login">Iniciar sesión</Link>
            <a href="#features">Features</a>
          </div>
        </div>
      </footer>
    </div>
  )
}