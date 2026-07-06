import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "../context/AuthContext"
import { useNotifications } from "../context/NotificationContext"
import { useTheme } from "../context/ThemeContext"
import { useLandings } from "../hooks/useLandings"
import { useModals } from "../hooks/useModals"
import { useActiveIncidents } from "../hooks/useIncidents"
import Logo from "../components/Logo"
import { api } from "../lib/api"
import BranchCard from "../components/BranchCard"
import BranchFormModal from "../components/BranchFormModal"
import UptimeChart from "../components/UptimeChart"
import ProfileSettings from "../components/ProfileSettings"
import StatusPageSettings from "../components/StatusPageSettings"
import ApiKeyManager from "../components/ApiKeyManager"
import WebhookSettings from "../components/WebhookSettings"
import UserManager from "../components/UserManager"
import OnboardingChecklist from "../components/OnboardingChecklist"
import CategoryManager from "../components/CategoryManager"
import TemplateTypeManager from "../components/TemplateTypeManager"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"
import { Pagination } from "../components/ui/pagination"
import { CardSkeleton, LogSkeleton } from "../components/ui/skeleton"
import NotificationBell from "../components/NotificationBell"
import { ActiveIncidentsBanner, IncidentHistory } from "../components/IncidentTimeline"
import { useCategories } from "../hooks/useCategories"
import {
  Globe, LogOut, Menu, Search, Home, RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle, History, Settings, ShieldAlert, Download, Moon, Sun, CheckSquare, Square, Share2, Key, AlertOctagon, Tags, FileText,
} from "lucide-react"

const statusTabs = [
  { key: "todas", label: "Todas" },
  { key: "ACTIVO", label: "Activas" },
  { key: "INACTIVO", label: "Inactivas" },
  { key: "EN_DESARROLLO", label: "En desarrollo" },
]
const uptimeFilters = [
  { key: "todas", label: "Todo" },
  { key: "UP", label: "Online" },
  { key: "DOWN", label: "Caídas" },
  { key: "sin_verificar", label: "Sin verificar" },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { addNotification } = useNotifications()
  const { dark, toggle: toggleTheme } = useTheme()
  const [search, setSearch] = useState("")
  const [activeCategoria, setActiveCategoria] = useState(null)
  const [activeStatus, setActiveStatus] = useState("todas")
  const [activeUptime, setActiveUptime] = useState("todas")
  const [activeTag, setActiveTag] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [sendSslAlerts, setSendSslAlerts] = useState(true)
  const [incidentPage, setIncidentPage] = useState(1)
  const notifiedDown = useRef(new Set())
  const notifiedSsl = useRef(new Set())
  const { data: activeIncidents = [] } = useActiveIncidents()
  const { data: categories = [] } = useCategories()
  const firstLoadDone = useRef(false)

  const {
    landings, filteredLandings, paginatedLandings, totalPages,
    loading, stats, tags, refetch,
    createLanding, updateLanding, deleteLanding,
    checkAllLandings, bulkCheckLandings, bulkDeleteLandings,
    isCheckingAll, isBulkChecking,
  } = useLandings({ search, activeCategoria, activeStatus, activeUptime, activeTag, currentPage })

  const modals = useModals()

  useEffect(() => {
    api.getUserSettings()
      .then((u) => { setNotifyEmail(u.notifyEmail); setSendSslAlerts(u.sendSslAlerts) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!firstLoadDone.current && !loading) {
      firstLoadDone.current = true
    }
    if (!loading && firstLoadDone.current) {
      const downLandings = landings.filter((l) => l.ultimoStatus === "DOWN")
      const currentDown = new Set(downLandings.map((l) => l.id))
      notifiedDown.current.forEach((id) => { if (!currentDown.has(id)) notifiedDown.current.delete(id) })
      downLandings.forEach((l) => {
        if (!notifiedDown.current.has(l.id)) {
          notifiedDown.current.add(l.id)
          addNotification({ title: `${l.nombre} está CAÍDA`, description: `${l.url} — Código: ${l.ultimoCodigo || "N/A"}`, type: "error" })
        }
      })
      const sslExpiring = landings.filter((l) => l.ultimoSslDias !== null && l.ultimoSslDias < 14 && l.ultimoSslDias > 0)
      const currentSsl = new Set(sslExpiring.map((l) => l.id))
      notifiedSsl.current.forEach((id) => { if (!currentSsl.has(id)) notifiedSsl.current.delete(id) })
      sslExpiring.forEach((l) => {
        if (!notifiedSsl.current.has(l.id)) {
          notifiedSsl.current.add(l.id)
          addNotification({ title: `SSL próximo a vencer: ${l.nombre}`, description: `${l.ultimoSslDias} días restantes`, type: "warning" })
        }
      })
    }
  }, [landings, loading, addNotification])

  const sidebarLinks = [
    { label: "Dashboard", icon: Home, action: () => { setActiveCategoria(null); setActiveStatus("todas"); setActiveUptime("todas"); setActiveTag(null); setSearch(""); setCurrentPage(1); } },
    { label: "Branch Comercial", icon: Globe, action: () => document.querySelector(".flex-1.overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" }) },
    { label: "SSL", icon: ShieldAlert, action: () => modals.setSslModal(true) },
    { label: "Status Page", icon: Share2, action: () => modals.setStatusPageOpen(true) },
    { label: "API Keys", icon: Key, action: () => modals.setApiKeysOpen(true) },
    { label: "Categorías", icon: Tags, action: () => modals.setCategoriesOpen(true) },
    { label: "Tipos de Template", icon: FileText, action: () => modals.setTemplateTypesOpen(true) },
    { label: "Incidentes", icon: AlertOctagon, count: activeIncidents.length, action: () => modals.setIncidentsOpen(true) },
    ...(user?.role === "admin" ? [{ label: "Usuarios", icon: ShieldAlert, action: () => modals.setUsersOpen(true) }] : []),
    { label: "Auditoría", icon: History, action: () => modals.openAudit() },
    { label: "Configuración", icon: Settings, action: () => modals.setSettingsOpen(true) },
  ]

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedLandings.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedLandings.map((l) => l.id)))
    }
  }

  const handleBulkCheck = async () => {
    if (selectedIds.size === 0) { toast.error("Seleccioná al menos una branch comercial"); return }
    try {
      await bulkCheckLandings([...selectedIds])
      toast.success(`${selectedIds.size} branches verificadas`)
      setSelectedIds(new Set())
    } catch { toast.error("Error en verificación masiva") }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Eliminar ${selectedIds.size} branch(es) comercial(es)?`)) return
    try {
      await bulkDeleteLandings([...selectedIds])
      toast.success(`${selectedIds.size} branch(es) eliminadas`)
      setSelectedIds(new Set())
    } catch { toast.error("Error al eliminar") }
  }

  const handleSaveSettings = async () => {
    try {
      await api.updateUserSettings({ notifyEmail, sendSslAlerts })
      toast.success("Configuración guardada")
      modals.setSettingsOpen(false)
    } catch {
      toast.error("Error al guardar configuración")
    }
  }

  const handleCreate = async (data) => {
    const landing = await createLanding(data)
    setModalKey((k) => k + 1)
    addNotification({ title: "Branch Comercial creada", description: `${landing.nombre} — ${landing.url}`, type: "success" })
    toast.success("Branch Comercial creada exitosamente")
  }

  const handleEdit = async (data) => {
    await updateLanding({ id: modals.editingLanding.id, data })
    modals.setEditingLanding(null)
    addNotification({ title: "Branch Comercial actualizada", description: `${data.nombre}`, type: "success" })
    toast.success("Branch Comercial actualizada exitosamente")
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta branch comercial?")) return
    await deleteLanding(id)
    addNotification({ title: "Branch Comercial eliminada", type: "info" })
    toast.error("Branch Comercial eliminada")
  }

  const handleCheckAll = async () => {
    try {
      const res = await checkAllLandings()
      const downCount = res?.results?.filter((r) => !r.isUp).length || 0
      if (downCount > 0) {
        addNotification({ title: `${downCount} branch(es) caída(s)`, description: "Se detectaron branches con problemas", type: "error" })
      }
      addNotification({ title: "Verificación completa", description: `${res?.checked || 0} branches verificadas`, type: "success" })
      toast.success(`${res?.checked || 0} branches verificadas`)
    } catch {
      toast.error("Error al verificar todas")
    }
  }

  const SidebarContent = ({ mobile, closeSheet }) => {
    const handleAction = (action) => {
      action()
      if (closeSheet) closeSheet()
    }
    return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="overflow-hidden shrink-0">
          <Logo className="h-10 w-auto text-foreground" />
        </div>
      </div>
      <div className="flex-1 space-y-1 px-2">
        {sidebarLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => handleAction(link.action)}
            className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {(sidebarExpanded || mobile) && <span>{link.label}</span>}
            {(sidebarExpanded || mobile) && link.count > 0 && (
              <span className="ml-auto text-xs font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {link.count > 9 ? "9+" : link.count}
              </span>
            )}
          </button>
        ))}
        {(sidebarExpanded || mobile) && user?.role === "admin" && (
          <a href="/api-docs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-lg hover:bg-accent transition-colors">
            <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">API</span>
            <span>Documentación API</span>
          </a>
        )}
      </div>
      <div className="px-2 py-4 border-t">
        <button
          className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(sidebarExpanded || mobile) && <span>Cerrar sesión</span>}
        </button>
        <div className="flex items-center gap-2 mt-4 px-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
          </div>
          {(sidebarExpanded || mobile) && (
            <div className="min-w-0">
              <span className="text-xs text-muted-foreground truncate block">
                {user?.nombre || user?.email}
              </span>
              {user?.role === "admin" && (
                <span className="text-[10px] font-medium text-amber-500">Admin</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div
        className="hidden md:flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-all duration-200"
        style={{ width: sidebarExpanded ? "200px" : "64px" }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <SidebarContent />
      </div>

      {/* Mobile header */}
      <div className="flex md:hidden items-center gap-2 p-3 border-b bg-background fixed top-0 left-0 right-0 z-30">
        <Sheet open={modals.sheetOpen} onOpenChange={modals.setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent mobile closeSheet={() => modals.setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 md:pt-0 pt-14">
        <header className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 sm:p-4 md:p-6 border-b bg-card">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, marca o URL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCheckAll} disabled={isCheckingAll}>
              <RefreshCw className={`w-4 h-4 ${isCheckingAll ? "animate-spin" : ""}`} />
              Verificar todas
            </Button>
            <Button variant="outline" size="sm" onClick={() => api.exportCSV().then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `branches-${new Date().toISOString().slice(0,10)}.csv`; a.click() }).catch(() => toast.error("Error al exportar"))}>
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={dark ? "Modo claro" : "Modo oscuro"}>
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <BranchFormModal key={modalKey + "-create"} onSubmit={handleCreate}>
              Nueva Branch Comercial
            </BranchFormModal>
          </div>
        </header>

        <ActiveIncidentsBanner />

        {/* Stats row */}
        <div className="flex gap-3 px-3 sm:px-4 md:px-6 pt-3">
          <div className="flex items-center gap-2 text-xs bg-card border rounded-lg px-3 py-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{stats.total}</span>
            <span className="text-muted-foreground">total</span>
          </div>
          <div className="flex items-center gap-2 text-xs bg-card border rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium">{stats.up}</span>
            <span className="text-muted-foreground">online</span>
          </div>
          <div className="flex items-center gap-2 text-xs bg-card border rounded-lg px-3 py-2">
            <XCircle className={`w-4 h-4 ${stats.down > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            <span className="font-medium">{stats.down}</span>
            <span className="text-muted-foreground">caídas</span>
          </div>
          <div className="flex items-center gap-2 text-xs bg-card border rounded-lg px-3 py-2">
            <Activity className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">{stats.sinVerificar}</span>
            <span className="text-muted-foreground">sin verificar</span>
          </div>
          {stats.down > 0 && (
            <Button variant="destructive" size="sm" className="text-xs h-8" onClick={() => setActiveUptime("DOWN")}>
              <AlertTriangle className="w-3 h-3" />
              {stats.down} caída{stats.down > 1 ? "s" : ""}
            </Button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 px-3 sm:px-4 md:px-6 pt-3 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategoria(activeCategoria === cat.name ? null : cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategoria === cat.name
                  ? "bg-gradient-to-br text-white shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              } ${activeCategoria === cat.name ? cat.color : ""}`}
            >
              <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${cat.color}`} />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Tags filter */}
        {tags.length > 0 && (
          <div className="flex gap-1.5 px-3 sm:px-4 md:px-6 pt-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                !activeTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Todos
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                  activeTag === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Status tabs + Uptime filter */}
        <div className="flex items-center gap-3 px-3 sm:px-4 md:px-6 pt-2 overflow-x-auto scrollbar-none">
          <Tabs value={activeStatus} onValueChange={setActiveStatus} className="shrink-0">
            <TabsList>
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex gap-1">
            {uptimeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveUptime(f.key)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                  activeUptime === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <OnboardingChecklist />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[1,2,3,4,5,6,7,8].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredLandings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Globe className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay branches comerciales</p>
              <p className="text-sm mt-1">Agregá tu primer branch comercial para empezar</p>
            </div>
          ) : (
            <>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg text-sm">
                  <span className="font-medium">{selectedIds.size} seleccionada(s)</span>
                  <Button variant="outline" size="sm" onClick={handleBulkCheck} disabled={isBulkChecking}>
                    <RefreshCw className={`w-3 h-3 ${isBulkChecking ? "animate-spin" : ""}`} />
                    Verificar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Eliminar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Limpiar</Button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <button onClick={toggleSelectAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  {selectedIds.size === paginatedLandings.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  Seleccionar todos
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {paginatedLandings.map((landing) => (
                  <div key={landing.id} className="w-full max-w-[400px] mx-auto sm:mx-0 relative">
                    <button
                      onClick={() => toggleSelect(landing.id)}
                      className="absolute top-2 left-2 z-20 p-1 rounded bg-background/80 backdrop-blur-sm shadow-sm hover:bg-accent transition-colors"
                    >
                      {selectedIds.has(landing.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <BranchCard
                      landing={landing}
                      onEdit={modals.setEditingLanding}
                      onDelete={handleDelete}
                      onCheck={refetch}
                    />
                    <div className="mt-1 text-center">
                      <button
                        onClick={() => modals.handleViewLogs(landing)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Ver historial de checks
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>

      {/* Logs history modal */}
      {modals.logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setLogsModal(null)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Historial de checks</h2>
            <p className="text-sm text-muted-foreground mb-4">{modals.logsModal.nombre} — {modals.logsModal.url}</p>
            {modals.logsLoading ? (
              <LogSkeleton />
            ) : modals.logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin verificaciones aún</p>
            ) : (
              <>
              <UptimeChart logs={modals.logs} />
              <div className="space-y-2">
                {modals.logs.map((log) => (
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
              <Button variant="outline" onClick={() => modals.setLogsModal(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* SSL Dashboard modal */}
      {modals.sslModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setSslModal(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Estado SSL</h2>
            <p className="text-sm text-muted-foreground mb-4">Certificados SSL de todas las branches</p>
            {landings.filter((l) => l.ultimoSslDias !== null).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos SSL aún. Verificá alguna branch primero.</p>
            ) : (
              <div className="space-y-2">
                {[...landings]
                  .filter((l) => l.ultimoSslDias !== null)
                  .sort((a, b) => (a.ultimoSslDias || 999) - (b.ultimoSslDias || 999))
                  .map((l) => (
                    <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        (l.ultimoSslDias || 0) > 30 ? "bg-green-500" :
                        (l.ultimoSslDias || 0) > 7 ? "bg-yellow-500" : "bg-red-500"
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{l.nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.url}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${
                          (l.ultimoSslDias || 0) > 30 ? "text-green-500" :
                          (l.ultimoSslDias || 0) > 7 ? "text-yellow-500" : "text-red-500"
                        }`}>
                          {l.ultimoSslDias}d
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {l.ultimoSslVence ? new Date(l.ultimoSslVence).toLocaleDateString("es-AR") : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => modals.setSslModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {modals.settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setSettingsOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Configuración</h2>

            <div className="border-b pb-4 mb-4">
              <ProfileSettings onClose={() => {}} />
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Notificaciones por email</h3>
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">Alertas por email</p>
                  <p className="text-xs text-muted-foreground">Recibir correo cuando una branch esté caída</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={sendSslAlerts} onChange={(e) => setSendSslAlerts(e.target.checked)} className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium">Alertas de SSL</p>
                  <p className="text-xs text-muted-foreground">Avisar cuando un certificado SSL esté por vencer</p>
                </div>
              </label>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveSettings}>Guardar preferencias</Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <WebhookSettings />
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => modals.setSettingsOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit log modal */}
      {modals.auditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setAuditModal(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Historial de cambios</h2>
            {modals.auditLoading ? (
              <LogSkeleton />
            ) : modals.auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin cambios registrados aún</p>
            ) : (
              <div className="space-y-2">
                {modals.auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-muted/50">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      log.action === "CREATE" ? "bg-green-500" :
                      log.action === "UPDATE" ? "bg-blue-500" :
                      log.action === "DELETE" ? "bg-red-500" : "bg-gray-500"
                    }`} />
                    <span className="font-medium">{log.action}</span>
                    {log.details && <span className="text-muted-foreground truncate max-w-[200px]">{log.details}</span>}
                    <span className="text-muted-foreground ml-auto shrink-0">
                      #{log.userId} &middot; {new Date(log.createdAt).toLocaleString("es-AR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => modals.setAuditModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modals.editingLanding && (
        <BranchFormModal
          key={modalKey + "-edit"}
          initialData={modals.editingLanding}
          onSubmit={handleEdit}
          onSuccess={() => modals.setEditingLanding(null)}
          onClose={() => modals.setEditingLanding(null)}
          defaultOpen={true}
        >
          <span />
        </BranchFormModal>
      )}

      {/* Status Page modal */}
      {modals.statusPageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setStatusPageOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <StatusPageSettings />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => modals.setStatusPageOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Incidents modal */}
      {modals.incidentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setIncidentsOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Incidentes</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                {activeIncidents.length} activo(s)
              </div>
            </div>
            <IncidentHistory page={incidentPage} onPageChange={setIncidentPage} />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => modals.setIncidentsOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys modal */}
      {modals.apiKeysOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setApiKeysOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <ApiKeyManager />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => modals.setApiKeysOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Categories modal */}
      {modals.categoriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setCategoriesOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Categorías</h2>
            <CategoryManager />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => modals.setCategoriesOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Types modal */}
      {modals.templateTypesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setTemplateTypesOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Tipos de Template</h2>
            <TemplateTypeManager />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => modals.setTemplateTypesOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Users modal */}
      {modals.usersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => modals.setUsersOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <UserManager onClose={() => modals.setUsersOpen(false)} />
          </div>
        </div>
      )}

    </div>
  )
}
