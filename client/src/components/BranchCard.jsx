import { useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Pencil, Trash2, FileSpreadsheet, RefreshCw, Rocket, Store } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import CategoryPicker from "./CategoryPicker"
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

export default function BranchCard({ landing, onEdit, onDelete, onCheck, onCategoryChange, categories = [] }) {
  const catColor = categories.find((c) => c.name === landing.categoria)?.color || "from-purple-600 to-pink-600"
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null)
  const [deploying, setDeploying] = useState(false)
  const [imgError, setImgError] = useState(false)

  const templateType = landing.templateType
  const dynamicValues = landing.dynamicValues ? (typeof landing.dynamicValues === 'string' ? JSON.parse(landing.dynamicValues) : landing.dynamicValues) : {}
  const visibleFields = landing.visibleFields ? JSON.parse(landing.visibleFields) : null

  const templateFields = templateType?.fieldDefinitions || []
  const visibleTemplateFields = visibleFields
    ? templateFields.filter((f) => visibleFields.includes(f.name))
    : templateFields

  const handleDeploy = async (e) => {
    e.stopPropagation()
    setDeploying(true)
    try {
      await api.registerDeploy(landing.id)
      if (onCheck) onCheck()
    } catch {}
    setDeploying(false)
  }

  const hasImage = landing.imagenUrl && landing.imagenUrl.trim() !== "" && !imgError

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden group h-full flex flex-col">
        {/* Header image or gradient placeholder */}
        <div className={`relative h-32 overflow-hidden ${hasImage ? "" : `bg-gradient-to-br ${catColor}`}`}>
          {hasImage ? (
            <img
              src={landing.imagenUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl font-bold text-white/80 select-none drop-shadow-lg">
                {landing.marca?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Top actions */}
          <div className="absolute top-2 right-2 flex gap-1.5 z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(landing) }}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
              title="Editar"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(landing.id) }}
              className="p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white hover:bg-red-500/60 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status dot + estado + category on image */}
          <div className="absolute bottom-2 left-3 flex items-center gap-2 z-10">
            <span className={`w-2 h-2 rounded-full shadow-sm ${estadoColors[landing.estado] || "bg-gray-400"}`} />
            <span className="text-xs font-medium text-white/90 drop-shadow-sm">{estadoLabels[landing.estado] || landing.estado}</span>
            {onCategoryChange ? (
              <CategoryPicker
                value={landing.categoria}
                onChange={(v) => onCategoryChange(landing.id, v)}
                categories={categories}
                triggerClassName="h-6 w-auto gap-1 rounded-full border-white/30 bg-black/30 px-2 py-0 text-xs text-white/90 shadow-none backdrop-blur-sm hover:bg-black/50"
              />
            ) : (
              <Badge variant="outline" className="text-xs text-white/90 border-white/30 bg-black/20 backdrop-blur-sm">
                {landing.categoria}
              </Badge>
            )}
          </div>

          {/* Uptime badge on image */}
          {uptimeBadge && (
            <div className="absolute bottom-2 right-3 z-10">
              {uptimeBadge}
            </div>
          )}
        </div>

        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">{landing.nombre}</h3>
                {templateType && <span className="text-xs shrink-0" title={templateType.name}>{templateType.icon}</span>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{landing.marca}</p>
              {landing.cliente && (
                <p className="text-xs text-muted-foreground/70 truncate flex items-center gap-1 mt-0.5">
                  <Store className="w-3 h-3" /> {landing.cliente}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-2 px-4 flex-1 space-y-2">
          {landing.url && (
            <a
              href={landing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{landing.url}</span>
            </a>
          )}

          {landing.sheetUrl && (
            <div className="flex items-center gap-2">
              <a
                href={landing.sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Ver hoja de cálculo"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
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

          {/* Dynamic fields */}
          {visibleTemplateFields.map((f) => {
            const value = dynamicValues[f.name] || landing[f.name]
            if (!value) return null
            if (f.name === "cliente" || f.name === "url") return null
            if (f.fieldType === "password") return (
              <div key={f.name} className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">{f.label}:</span>
                <span className="font-mono">••••••••</span>
              </div>
            )
            return (
              <div key={f.name} className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">{f.label}:</span>
                <span className="truncate max-w-[200px]">{value}</span>
              </div>
            )
          })}

          {/* Template type */}
          {templateType && (
            <div className="flex items-center gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border bg-secondary/50 text-secondary-foreground border-border`}>
                {templateType.icon} {templateType.name}
              </span>
            </div>
          )}

          {/* Tags */}
          {landing.tags && (
            <div className="flex flex-wrap gap-1">
              {landing.tags.split(",").map((tag, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground border border-border">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Meta tags */}
          {landing.metaTags && (() => {
            const tags = typeof landing.metaTags === 'string' ? JSON.parse(landing.metaTags) : landing.metaTags
            if (tags.error) return null
            return (
              <div className="flex flex-wrap gap-1">
                {tags.gtm && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono">{tags.gtm}</span>}
                {tags.ga && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">{tags.ga}</span>}
                {tags.fbPixel && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono">FB Pixel</span>}
                {tags.gsc && <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">GSC</span>}
                {tags.ogTitle && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">OG</span>}
              </div>
            )
          })()}

          {/* SSL */}
          {landing.ultimoSslDias !== null && (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                landing.ultimoSslDias > 30 ? "bg-green-500/20 text-green-400" :
                landing.ultimoSslDias > 7 ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  landing.ultimoSslDias > 30 ? "bg-green-400" :
                  landing.ultimoSslDias > 7 ? "bg-yellow-400" :
                  "bg-red-400"
                }`} />
                SSL: {landing.ultimoSslDias}d
              </span>
            </div>
          )}

          {/* Tecnologias */}
          {landing.tecnologias && (
            <div className="flex flex-wrap gap-1">
              {landing.tecnologias.split(",").map((tech, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {tech.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Check result feedback */}
          {checkResult && (
            <div className={`text-xs px-2 py-1 rounded ${
              checkResult.url?.isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            }`}>
              {checkResult.url?.isUp
                ? `✓ ${checkResult.url.statusCode} — ${checkResult.url.responseMs}ms`
                : `✗ ${checkResult.url?.error || "Error"}`}
              {checkResult.ssl?.valid !== undefined && (
                <span className="ml-2">
                  SSL: {checkResult.ssl.valid ? `${checkResult.ssl.daysRemaining}d` : checkResult.ssl.error || "Inválido"}
                </span>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="px-4 py-3 flex items-center gap-2 flex-wrap border-t">
          {landing.url && (
            <>
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
              {landing._count?.logs > 0 && (
                <span className="text-xs text-muted-foreground">
                  {landing._count.logs} checks
                </span>
              )}
              {landing.ultimoCheck && !checking && (
                <span className="text-xs text-muted-foreground ml-auto">{timeAgo(landing.ultimoCheck)}</span>
              )}
            </>
          )}
          {templateType?.hasMonitoring && landing.url && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleDeploy}
                disabled={deploying}
              >
                <Rocket className={`w-3 h-3 ${deploying ? "animate-pulse" : ""}`} />
                Deploy
              </Button>
              {landing.ultimoDeploy && (
                <span className="text-xs text-muted-foreground">{timeAgo(landing.ultimoDeploy)}</span>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
