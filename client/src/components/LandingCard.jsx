import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Pencil, Trash2, FileSpreadsheet, Activity, RefreshCw } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { api } from "../lib/api"

const estadoColors = {
  ACTIVO: "bg-green-500",
  INACTIVO: "bg-red-500",
  EN_DESARROLLO: "bg-yellow-500",
}

const estadoLabels = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  EN_DESARROLLO: "En desarrollo",
}

const categoriaGradients = {
  Cober: "from-purple-600/80 to-pink-600/80",
  Bristol: "from-blue-600/80 to-cyan-600/80",
  Medicals: "from-emerald-600/80 to-teal-600/80",
  "Centros Médicos": "from-amber-600/80 to-orange-600/80",
}

function timeAgo(date) {
  if (!date) return ""
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export default function LandingCard({ landing, onEdit, onDelete, onCheck }) {
  const cardRef = useRef(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)

  const hasImage = landing.imagenUrl && landing.imagenUrl.trim() !== ""

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    setRotateX((y - centerY) / 20)
    setRotateY((centerX - x) / 20)
  }

  const handleMouseLeave = () => {
    setRotateX(0)
    setRotateY(0)
  }

  const handleCheck = async (e) => {
    e.stopPropagation()
    setChecking(true)
    try {
      const result = await api.checkLanding(landing.id)
      setCheckResult(result)
      if (onCheck) onCheck()
    } catch {
      setCheckResult({ url: { isUp: false, error: "Error de conexión" } })
    } finally {
      setChecking(false)
    }
  }

  const uptimeBadge = landing.ultimoStatus ? (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      landing.ultimoStatus === "UP" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${landing.ultimoStatus === "UP" ? "bg-green-400" : "bg-red-400"}`} />
      {landing.ultimoStatus === "UP" ? `OK ${landing.ultimoCodigo || ""}` : "DOWN"}
      {landing.ultimoMs ? ` ${landing.ultimoMs}ms` : ""}
    </span>
  ) : null

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-xl border bg-card text-card-foreground shadow overflow-hidden group"
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: "transform 0.1s ease-out",
          minHeight: "300px",
        }}
      >
        {hasImage && (
          <div className="absolute inset-0">
            <img src={landing.imagenUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/95 via-gray-900/70 to-gray-900/40" />
          </div>
        )}

        <div className={`relative z-10 p-5 flex flex-col h-full min-h-[300px] ${hasImage ? "text-white" : ""}`}>
          <div className="absolute top-3 right-3 flex gap-2 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(landing) }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:bg-accent transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(landing.id) }}
              className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>

          <div className="w-full mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${categoriaGradients[landing.categoria] || "from-purple-500 to-pink-500"} flex items-center justify-center text-white font-bold text-sm shrink-0`}
              >
                {landing.marca?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold truncate">{landing.nombre}</h3>
                <p className="text-sm opacity-80 truncate">{landing.marca}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${estadoColors[landing.estado] || "bg-gray-400"}`} />
            <span className="text-xs font-medium opacity-90">{estadoLabels[landing.estado] || landing.estado}</span>
            <Badge variant="outline" className={`text-xs ${hasImage ? "bg-white/20 backdrop-blur-sm border-white/30" : ""}`}>
              {landing.categoria}
            </Badge>
            {uptimeBadge}
          </div>

          <div className="w-full mb-2">
            <a
              href={landing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{landing.url}</span>
            </a>
          </div>

          {landing.sheetUrl && (
            <div className="flex items-center gap-2 mb-2">
              <a
                href={landing.sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Ver hoja de cálculo"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </a>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                landing.formStatus === "OK" ? "bg-green-500/20 text-green-400" :
                landing.formStatus === "ERROR" ? "bg-red-500/20 text-red-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  landing.formStatus === "OK" ? "bg-green-400" :
                  landing.formStatus === "ERROR" ? "bg-red-400" :
                  "bg-yellow-400"
                }`} />
                {landing.formStatus === "OK" ? "Verificado" : landing.formStatus === "ERROR" ? "Con error" : "Pendiente"}
              </span>
            </div>
          )}

          {/* Check & Logs row */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleCheck}
              disabled={checking}
            >
              <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
              Verificar
            </Button>
            {landing.logs && landing.logs.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {landing._count?.logs || landing.logs.length} checks
              </span>
            )}
            {landing.ultimoCheck && (
              <span className="text-xs text-muted-foreground ml-auto">{timeAgo(landing.ultimoCheck)}</span>
            )}
          </div>

          {/* Check result feedback */}
          {checkResult && (
            <div className={`text-xs mb-2 px-2 py-1 rounded ${
              checkResult.url?.isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            }`}>
              {checkResult.url?.isUp
                ? `✓ ${checkResult.url.statusCode} — ${checkResult.url.responseMs}ms`
                : `✗ ${checkResult.url?.error || "Error"}`}
              {checkResult.ssl?.valid !== undefined && checkResult.ssl.valid !== null && (
                <span className="ml-2">
                  SSL: {checkResult.ssl.valid ? `${checkResult.ssl.daysRemaining}d` : checkResult.ssl.error || "Inválido"}
                </span>
              )}
            </div>
          )}

          {landing.tecnologias && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {landing.tecnologias.split(",").map((tech, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-full ${hasImage ? "bg-white/20 backdrop-blur-sm" : "bg-muted text-muted-foreground"}`}
                >
                  {tech.trim()}
                </span>
              ))}
            </div>
          )}

          <div className={`text-xs mt-auto ${hasImage ? "opacity-70" : "text-muted-foreground"}`}>
            {new Date(landing.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
