import { Button } from "./ui/button"
import { LogSkeleton } from "./ui/skeleton"
import BranchFormModal from "./BranchFormModal"
import UptimeChart from "./UptimeChart"
import ProfileSettings from "./ProfileSettings"
import StatusPageSettings from "./StatusPageSettings"
import WebhookSettings from "./WebhookSettings"
import UserManager from "./UserManager"
import CategoryManager from "./CategoryManager"
import TemplateTypeManager from "./TemplateTypeManager"
import { ActiveIncidentsBanner, IncidentHistory } from "./IncidentTimeline"
import { X, AlertTriangle, CheckSquare, Square } from "lucide-react"

export function LogsModal({ landing, logs, loading, onClose }) {
  if (!landing) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1">Historial de checks</h2>
        <p className="text-sm text-muted-foreground mb-4">{landing.nombre} — {landing.url}</p>
        {loading ? <LogSkeleton /> : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin verificaciones aún</p>
        ) : (
          <>
            <UptimeChart logs={logs} />
            <div className="space-y-2 mt-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-muted/50">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${log.isUp ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="font-medium">{log.isUp ? `OK ${log.statusCode || ""}` : "DOWN"}</span>
                  {log.responseMs && <span className="text-muted-foreground">{log.responseMs}ms</span>}
                  {log.error && <span className="text-destructive truncate">{log.error}</span>}
                  <span className="text-muted-foreground ml-auto shrink-0">
                    {new Date(log.createdAt).toLocaleString("es-AR")}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  )
}

export function SslModal({ landings, onClose }) {
  const withSsl = landings.filter((l) => l.ultimoSslDias !== null)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-1">Estado SSL</h2>
        <p className="text-sm text-muted-foreground mb-4">Certificados SSL de todos los activos</p>
        {withSsl.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos SSL aún. Verificá algún activo primero.</p>
        ) : (
          <div className="space-y-2">
            {[...withSsl].sort((a, b) => (a.ultimoSslDias || 999) - (b.ultimoSslDias || 999)).map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full shrink-0 ${(l.ultimoSslDias || 0) > 30 ? "bg-green-500" : (l.ultimoSslDias || 0) > 7 ? "bg-yellow-500" : "bg-red-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{l.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{l.url}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${(l.ultimoSslDias || 0) > 30 ? "text-green-500" : (l.ultimoSslDias || 0) > 7 ? "text-yellow-500" : "text-red-500"}`}>{l.ultimoSslDias}d</p>
                  <p className="text-xs text-muted-foreground">{l.ultimoSslVence ? new Date(l.ultimoSslVence).toLocaleDateString("es-AR") : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  )
}

export function SettingsModal({ open, onClose, notifyEmail, sendSslAlerts, onSave, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Configuración</h2>
        <div className="border-b pb-4 mb-4"><ProfileSettings onClose={() => {}} /></div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Notificaciones por email</h3>
        <div className="space-y-4 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifyEmail} onChange={(e) => onSave("notifyEmail", e.target.checked)} className="w-4 h-4" />
            <div><p className="text-sm font-medium">Alertas por email</p><p className="text-xs text-muted-foreground">Recibir correo cuando un activo esté caído</p></div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={sendSslAlerts} onChange={(e) => onSave("sendSslAlerts", e.target.checked)} className="w-4 h-4" />
            <div><p className="text-sm font-medium">Alertas de SSL</p><p className="text-xs text-muted-foreground">Avisar cuando un certificado SSL esté por vencer</p></div>
          </label>
        </div>
        <div className="border-t pt-4"><WebhookSettings /></div>
        {children}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  )
}

export function AuditModal({ open, logs, loading, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Historial de cambios</h2>
        {loading ? <LogSkeleton /> : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin cambios registrados aún</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-muted/50">
                <span className={`w-2 h-2 rounded-full shrink-0 ${log.action === "CREATE" ? "bg-green-500" : log.action === "UPDATE" ? "bg-blue-500" : log.action === "DELETE" ? "bg-red-500" : "bg-gray-500"}`} />
                <span className="font-medium">{log.action}</span>
                {log.details && <span className="text-muted-foreground truncate max-w-[200px]">{log.details}</span>}
                <span className="text-muted-foreground ml-auto shrink-0">#{log.userId} &middot; {new Date(log.createdAt).toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  )
}

export function GenericModal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  )
}