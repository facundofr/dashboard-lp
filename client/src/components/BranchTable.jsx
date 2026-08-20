import { useState, useRef, useCallback } from "react"
import { ExternalLink, Pencil, Trash2, RefreshCw, Rocket, CheckSquare, Square } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import CategoryPicker from "./CategoryPicker"
import { api } from "../lib/api"

const estadoColors = {
  ACTIVO: "bg-green-500",
  INACTIVO: "bg-red-500",
  EN_DESARROLLO: "bg-yellow-500",
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

export default function BranchTable({ landings, selectedIds, onToggleSelect, onToggleSelectAll, onEdit, onDelete, onCategoryChange, categories = [] }) {
  const [checking, setChecking] = useState(null)
  const [deploying, setDeploying] = useState(null)
  const [checkResults, setCheckResults] = useState({})
  const timersRef = useRef({})

  const clearResult = useCallback((id) => {
    setCheckResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const handleCheck = async (e, landingId) => {
    e.stopPropagation()
    setChecking(landingId)
    try {
      const result = await api.checkLanding(landingId)
      setCheckResults((prev) => ({ ...prev, [landingId]: result }))
      if (timersRef.current[landingId]) clearTimeout(timersRef.current[landingId])
      timersRef.current[landingId] = setTimeout(() => clearResult(landingId), 4000)
    } catch {
      setCheckResults((prev) => ({
        ...prev,
        [landingId]: { url: { isUp: false, error: "Error de conexión" } },
      }))
      if (timersRef.current[landingId]) clearTimeout(timersRef.current[landingId])
      timersRef.current[landingId] = setTimeout(() => clearResult(landingId), 4000)
    }
    setChecking(null)
  }

  const handleDeploy = async (e, landingId) => {
    e.stopPropagation()
    setDeploying(landingId)
    try {
      await api.registerDeploy(landingId)
    } catch {}
    setDeploying(null)
  }

  const allSelected = landings.length > 0 && selectedIds.size === landings.length

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <button onClick={onToggleSelectAll} className="flex items-center">
                {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
              </button>
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">URL</TableHead>
            <TableHead className="hidden sm:table-cell w-44">Categoría</TableHead>
            <TableHead className="hidden lg:table-cell">Uptime</TableHead>
            <TableHead className="hidden lg:table-cell">SSL</TableHead>
            <TableHead className="hidden sm:table-cell">Último check</TableHead>
            <TableHead className="text-right w-40">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {landings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No se encontraron landings
              </TableCell>
            </TableRow>
          ) : (
            landings.map((landing) => {
              const isSelected = selectedIds.has(landing.id)
              const result = checkResults[landing.id]
              return (
                <TableRow key={landing.id} data-state={isSelected ? "selected" : undefined}>
                  <TableCell>
                    <button onClick={() => onToggleSelect(landing.id)} className="flex items-center">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${estadoColors[landing.estado] || "bg-gray-400"}`} />
                        <span className="font-medium truncate max-w-[150px]">{landing.nombre}</span>
                        {landing.templateType && <span title={landing.templateType.name}>{landing.templateType.icon}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{landing.marca}</span>
                      {landing.cliente && (
                        <span className="text-xs text-muted-foreground/70 truncate max-w-[200px]">{landing.cliente}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {landing.url ? (
                      <a href={landing.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 truncate max-w-[200px]">
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{landing.url}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {onCategoryChange ? (
                      <CategoryPicker
                        value={landing.categoria}
                        onChange={(v) => onCategoryChange(landing.id, v)}
                        categories={categories}
                        triggerClassName="h-7 text-xs"
                      />
                    ) : (
                      <Badge variant="outline" className="text-xs">{landing.categoria}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {landing.ultimoStatus ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        landing.ultimoStatus === "UP" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${landing.ultimoStatus === "UP" ? "bg-green-400" : "bg-red-400"}`} />
                        {landing.ultimoStatus === "UP" ? "Online" : "Caída"}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {typeof landing.ultimoSslValido === "boolean" ? (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        landing.ultimoSslValido ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {landing.ultimoSslValido ? "SSL" : "NO SSL"}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">{timeAgo(landing.ultimoCheck) || "—"}</span>
                  </TableCell>
                  <TableCell className="relative">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); onEdit(landing) }}
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(landing.id) }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      {landing.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleCheck(e, landing.id)}
                          disabled={checking === landing.id}
                          title="Verificar"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${checking === landing.id ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                      {landing.templateType?.hasMonitoring && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleDeploy(e, landing.id)}
                          disabled={deploying === landing.id}
                          title="Deploy"
                        >
                          <Rocket className={`w-3.5 h-3.5 ${deploying === landing.id ? "animate-pulse" : ""}`} />
                        </Button>
                      )}
                    </div>

                    {/* Check result toast */}
                    {result && (
                      <div
                        className={`absolute right-0 top-0 z-50 text-xs px-3 py-1.5 rounded-lg shadow-lg border whitespace-nowrap animate-in fade-in slide-in-from-top-1 ${
                          result.url?.isUp
                            ? "bg-green-500/15 text-green-400 border-green-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}
                        style={{ transform: "translateY(-110%)" }}
                      >
                        {result.url?.isUp ? "✓ Productiva" : "✗ Caída"}
                        {result.ssl?.valid !== undefined && (
                          <span className="ml-1.5 opacity-80">
                            · {result.ssl.valid ? "SSL" : "NO SSL"}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
