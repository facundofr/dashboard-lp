import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { api } from "../lib/api"
import { CheckCircle, XCircle, AlertTriangle, Activity, ArrowLeft } from "lucide-react"
import UptimeChart from "../components/UptimeChart"

export default function StatusPage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uptimeModal, setUptimeModal] = useState(null)
  const [uptimeData, setUptimeData] = useState(null)
  const [uptimeLoading, setUptimeLoading] = useState(false)

  useEffect(() => {
    api.getPublicStatusPage(slug)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  const handleViewUptime = async (landing) => {
    setUptimeModal(landing)
    setUptimeLoading(true)
    try {
      const result = await api.getPublicUptime(slug, landing.id)
      setUptimeData(result)
    } catch {
      setUptimeData(null)
    } finally {
      setUptimeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="w-16 h-16 text-muted-foreground opacity-50" />
        <h1 className="text-2xl font-bold">Status page no encontrada</h1>
        <p className="text-muted-foreground">La página que buscás no existe o no es pública.</p>
        <Link to="/" className="text-primary hover:underline">Ir al inicio</Link>
      </div>
    )
  }

  const { page, stats, landings } = data
  const overallStatus = stats.down > 0 ? "degraded" : stats.sinVerificar === stats.total ? "unknown" : "ok"

  return (
    <div className="min-h-screen bg-background">
      {/* Header with branding */}
      <header
        className="py-12 px-4 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${page.brandColor}, ${page.brandColor}dd)` }}
      >
        {page.logoUrl && (
          <img src={page.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl mx-auto mb-4 object-cover bg-white/20 p-2" />
        )}
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{page.title}</h1>
        {page.subtitle && <p className="text-lg opacity-90 max-w-xl mx-auto">{page.subtitle}</p>}
        <p className="text-sm opacity-70 mt-3">Mantenido por {page.owner}</p>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Overall status banner */}
        <div className={`rounded-xl p-6 mb-8 text-center ${overallStatus === "ok" ? "bg-green-500/10" : overallStatus === "degraded" ? "bg-red-500/10" : "bg-muted"}`}>
          {overallStatus === "ok" && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-green-600">Todos los sistemas operativos</h2>
            </>
          )}
          {overallStatus === "degraded" && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold text-red-600">Sistemas con problemas</h2>
              <p className="text-sm text-muted-foreground">{stats.down} de {stats.total} landings caídas</p>
            </>
          )}
          {overallStatus === "unknown" && (
            <>
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <h2 className="text-xl font-bold">Sin verificaciones aún</h2>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="text-center p-4 rounded-xl border bg-card">
            <p className="text-2xl font-bold text-green-500">{stats.up}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
          <div className="text-center p-4 rounded-xl border bg-card">
            <p className="text-2xl font-bold text-red-500">{stats.down}</p>
            <p className="text-xs text-muted-foreground">Caídas</p>
          </div>
          <div className="text-center p-4 rounded-xl border bg-card">
            <p className="text-2xl font-bold text-yellow-500">{stats.sinVerificar}</p>
            <p className="text-xs text-muted-foreground">Sin verificar</p>
          </div>
        </div>

        {/* Landings list */}
        <div className="space-y-2">
          {landings.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                l.ultimoStatus === "UP" ? "bg-green-500" :
                l.ultimoStatus === "DOWN" ? "bg-red-500" : "bg-gray-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{l.nombre}</p>
                <p className="text-xs text-muted-foreground truncate">{l.url}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-medium ${
                  l.ultimoStatus === "UP" ? "text-green-500" :
                  l.ultimoStatus === "DOWN" ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {l.ultimoStatus === "UP" ? "Operativo" : l.ultimoStatus === "DOWN" ? "Caída" : "Sin verificar"}
                </p>
                {l.ultimoMs && <p className="text-xs text-muted-foreground">{l.ultimoMs}ms</p>}
              </div>
              {l.ultimoStatus && (
                <button
                  onClick={() => handleViewUptime(l)}
                  className="text-xs text-primary hover:underline shrink-0 ml-2"
                >
                  Uptime
                </button>
              )}
            </div>
          ))}
        </div>

        {landings.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hay landings monitoreadas todavía</p>
          </div>
        )}

        {/* SSL info */}
        {landings.some((l) => l.ultimoSslDias !== null) && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Certificados SSL
            </h3>
            <div className="space-y-2">
              {landings.filter((l) => l.ultimoSslDias !== null).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                  <span className="truncate">{l.nombre}</span>
                  <span className={`font-medium ${
                    l.ultimoSslDias > 30 ? "text-green-500" :
                    l.ultimoSslDias > 7 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {l.ultimoSslDias} días
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">Gestor Landings</span> · Actualizado cada 15 minutos
          </p>
        </div>
      </main>

      {/* Uptime modal */}
      {uptimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setUptimeModal(null)}>
          <div className="bg-card rounded-xl p-6 w-full max-w-lg shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">{uptimeModal.nombre}</h2>
            <p className="text-sm text-muted-foreground mb-4">{uptimeModal.url}</p>
            {uptimeLoading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : uptimeData ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{uptimeData.uptimePct ?? "—"}%</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{uptimeData.totalChecks}</p>
                    <p className="text-xs text-muted-foreground">Checks</p>
                  </div>
                </div>
                <UptimeChart logs={uptimeData.logs} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setUptimeModal(null)} className="text-sm text-muted-foreground hover:text-foreground">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}