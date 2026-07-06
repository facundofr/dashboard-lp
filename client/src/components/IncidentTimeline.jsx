import { useState } from "react"
import { useActiveIncidents, useIncidentHistory } from "../hooks/useIncidents"
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react"

function formatDuration(seconds) {
  if (!seconds) return ""
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function ActiveIncidentsBanner() {
  const { data: incidents = [] } = useActiveIncidents()
  if (incidents.length === 0) return null
  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 bg-destructive/10 border-b border-destructive/20">
      <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
      <span className="text-sm font-medium text-destructive">
        {incidents.length} incidente(s) activo(s)
      </span>
      <span className="text-xs text-muted-foreground">
        — {incidents.map((i) => i.landing.nombre).join(", ")}
      </span>
    </div>
  )
}

function IncidentHistory({ page, onPageChange }) {
  const { data, isLoading } = useIncidentHistory(page)
  const incidents = data?.data || []
  const pagination = data?.pagination

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4 text-center">Cargando...</div>
  }
  if (incidents.length === 0) {
    return <div className="text-sm text-muted-foreground p-4 text-center">Sin incidentes registrados</div>
  }
  return (
    <div className="space-y-3">
      {incidents.map((inc) => (
        <div key={inc.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="mt-0.5">
            {inc.recoveredAt ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{inc.landing.nombre}</span>
              <span className="text-xs text-muted-foreground">{inc.landing.marca}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(inc.startedAt).toLocaleString("es-AR")}
              </span>
              {inc.recoveredAt && (
                <>
                  <span>→</span>
                  <span>{new Date(inc.recoveredAt).toLocaleString("es-AR")}</span>
                  <span className="font-medium text-foreground">{formatDuration(inc.duration)}</span>
                </>
              )}
              {!inc.recoveredAt && (
                <span className="text-destructive font-medium">Activo</span>
              )}
            </div>
            <a href={inc.landing.url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
              <ExternalLink className="w-3 h-3" /> {inc.landing.url}
            </a>
          </div>
        </div>
      ))}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 text-xs rounded bg-muted hover:bg-accent disabled:opacity-30">
            Anterior
          </button>
          <span className="text-xs text-muted-foreground">{page} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 text-xs rounded bg-muted hover:bg-accent disabled:opacity-30">
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

export { ActiveIncidentsBanner, IncidentHistory }
