import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "../context/AuthContext"
import { useNotifications } from "../context/NotificationContext"
import { useTheme } from "../context/ThemeContext"
import { api } from "../lib/api"
import { usePolling } from "../lib/usePolling"
import LandingCard from "../components/LandingCard"
import LandingFormModal from "../components/LandingFormModal"
import UptimeChart from "../components/UptimeChart"
import ProfileSettings from "../components/ProfileSettings"
import StatusPageSettings from "../components/StatusPageSettings"
import ApiKeyManager from "../components/ApiKeyManager"
import PlanSelector from "../components/PlanSelector"
import OnboardingChecklist from "../components/OnboardingChecklist"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet"
import { Pagination } from "../components/ui/pagination"
import { CardSkeleton, LogSkeleton } from "../components/ui/skeleton"
import NotificationBell from "../components/NotificationBell"
import {
  Globe, LogOut, Menu, Search, Plus, Home, RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle, History, Settings, ShieldAlert, Download, Moon, Sun, CheckSquare, Square, FileSpreadsheet, Share2, Key, Crown,
} from "lucide-react"

const categorias = ["Cober", "Bristol", "Medicals", "Centros Médicos"]
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
const categoriaColors = {
  Cober: "bg-purple-600",
  Bristol: "bg-blue-600",
  Medicals: "bg-emerald-600",
  "Centros Médicos": "bg-amber-600",
}

  const handleExportCSV = () => {
    const headers = ["Nombre", "Marca", "URL", "Estado", "Categoría", "Tags", "Último Status", "Código", "Tiempo (ms)", "SSL (días)", "Form Status", "Tecnologías"]
    const rows = landings.map((l) => [
      l.nombre, l.marca, l.url, l.estado, l.categoria, l.tags || "",
      l.ultimoStatus || "", l.ultimoCodigo || "", l.ultimoMs || "", l.ultimoSslDias ?? "", l.formStatus, l.tecnologias || "",
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `landings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleOpenAudit = async () => {
    setAuditModal(true)
    setAuditLoading(true)
    try {
      const data = await api.getAuditLogs()
      setAuditLogs(data)
    } catch {
      setAuditLogs([])
    } finally {
      setAuditLoading(false)
    }
  }

  const sidebarLinks = [
    { label: "Dashboard", icon: Home },
    { label: "Landings", icon: Globe },
    { label: "SSL", icon: ShieldAlert },
    { label: "Status Page", icon: Share2, action: () => setStatusPageOpen(true) },
    { label: "API Keys", icon: Key, action: () => setApiKeysOpen(true) },
    { label: "Plan", icon: Crown, action: () => setPlanModal(true) },
    { label: "Auditoría", icon: History },
    { label: "Configuración", icon: Settings },
  ]

const ITEMS_PER_PAGE = 12

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { addNotification } = useNotifications()
  const { dark, toggle: toggleTheme } = useTheme()
  const [landings, setLandings] = useState([])
  const [filteredLandings, setFilteredLandings] = useState([])
  const [search, setSearch] = useState("")
  const [activeCategoria, setActiveCategoria] = useState(null)
  const [activeStatus, setActiveStatus] = useState("todas")
  const [activeUptime, setActiveUptime] = useState("todas")
  const [activeTag, setActiveTag] = useState(null)
  const [editingLanding, setEditingLanding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [checkingAll, setCheckingAll] = useState(false)
  const [logsModal, setLogsModal] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [auditModal, setAuditModal] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [sendSslAlerts, setSendSslAlerts] = useState(true)
  const [sslModal, setSslModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [profileOpen, setProfileOpen] = useState(false)
  const [bulkChecking, setBulkChecking] = useState(false)
  const [statusPageOpen, setStatusPageOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [planModal, setPlanModal] = useState(false)

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLandings.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLandings.map((l) => l.id)))
    }
  }

  const handleBulkCheck = async () => {
    if (selectedIds.size === 0) { toast.error("Seleccioná al menos una landing"); return }
    setBulkChecking(true)
    try {
      await api.bulkCheckLandings([...selectedIds])
      toast.success(`${selectedIds.size} landings verificadas`)
      await fetchLandings()
      setSelectedIds(new Set())
    } catch { toast.error("Error en verificación masiva") } finally { setBulkChecking(false) }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`¿Eliminar ${selectedIds.size} landing(s)?`)) return
    try {
      await api.bulkDeleteLandings([...selectedIds])
      toast.success(`${selectedIds.size} landing(s) eliminadas`)
      await fetchLandings()
      setSelectedIds(new Set())
    } catch { toast.error("Error al eliminar") }
  }

  useEffect(() => {
    api.getUserSettings()
      .then((u) => { setNotifyEmail(u.notifyEmail); setSendSslAlerts(u.sendSslAlerts) })
      .catch(() => {})
  }, [])

  const handleSaveSettings = async () => {
    try {
      await api.updateUserSettings({ notifyEmail, sendSslAlerts })
      toast.success("Configuración guardada")
      setSettingsOpen(false)
    } catch {
      toast.error("Error al guardar configuración")
    }
  }

  const fetchLandings = useCallback(async () => {
    try {
      const res = await api.getLandings(1, 100)
      const data = res.data || res
      setLandings(data)
      const downLandings = data.filter((l) => l.ultimoStatus === "DOWN")
      downLandings.forEach((l) => {
        addNotification({ title: `${l.nombre} está CAÍDA`, description: `${l.url} — Código: ${l.ultimoCodigo || "N/A"}`, type: "error" })
      })
      const sslExpiring = data.filter((l) => l.ultimoSslDias !== null && l.ultimoSslDias < 14 && l.ultimoSslDias > 0)
      sslExpiring.forEach((l) => {
        addNotification({ title: `SSL próximo a vencer: ${l.nombre}`, description: `${l.ultimoSslDias} días restantes`, type: "warning" })
      })
    } catch (err) {
      toast.error("Error al cargar landings")
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => { fetchLandings() }, [fetchLandings])

  usePolling(fetchLandings, 30000, [fetchLandings])

  useEffect(() => {
    let result = landings
    if (activeCategoria) {
      result = result.filter((l) => l.categoria === activeCategoria)
    }
    if (activeStatus !== "todas") {
      result = result.filter((l) => l.estado === activeStatus)
    }
    if (activeUptime === "UP") {
      result = result.filter((l) => l.ultimoStatus === "UP")
    } else if (activeUptime === "DOWN") {
      result = result.filter((l) => l.ultimoStatus === "DOWN")
    } else if (activeUptime === "sin_verificar") {
      result = result.filter((l) => !l.ultimoStatus)
    }
    if (activeTag) {
      result = result.filter((l) => l.tags && l.tags.toLowerCase().includes(activeTag.toLowerCase()))
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((l) =>
        l.nombre.toLowerCase().includes(q) ||
        l.marca.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q)
      )
    }
    setFilteredLandings(result)
    setCurrentPage(1)
  }, [landings, activeCategoria, activeStatus, activeUptime, search, activeTag])

  const totalPages = Math.ceil(filteredLandings.length / ITEMS_PER_PAGE)
  const paginatedLandings = filteredLandings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleCreate = async (data) => {
    const landing = await api.createLanding(data)
    setModalKey((k) => k + 1)
    await fetchLandings()
    addNotification({ title: "Landing creada", description: `${landing.nombre} — ${landing.url}`, type: "success" })
    toast.success("Landing creada exitosamente")
  }

  const handleEdit = async (data) => {
    await api.updateLanding(editingLanding.id, data)
    setEditingLanding(null)
    await fetchLandings()
    addNotification({ title: "Landing actualizada", description: `${data.nombre}`, type: "success" })
    toast.success("Landing actualizada exitosamente")
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta landing?")) return
    await api.deleteLanding(id)
    await fetchLandings()
    addNotification({ title: "Landing eliminada", type: "info" })
    toast.error("Landing eliminada")
  }

  const handleCheckAll = async () => {
    setCheckingAll(true)
    try {
      const res = await api.checkAllLandings()
      const downCount = res.results.filter((r) => !r.isUp).length
      if (downCount > 0) {
        addNotification({ title: `${downCount} landing(s) caída(s)`, description: "Se detectaron landings con problemas", type: "error" })
      }
      addNotification({ title: "Verificación completa", description: `${res.checked} landings verificadas`, type: "success" })
      toast.success(`${res.checked} landings verificadas`)
      await fetchLandings()
    } catch {
      toast.error("Error al verificar todas")
    } finally {
      setCheckingAll(false)
    }
  }

  const handleViewLogs = async (landing) => {
    setLogsModal(landing)
    setLogsLoading(true)
    try {
      const data = await api.getLandingLogs(landing.id)
      setLogs(data)
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const stats = {
    total: landings.length,
    up: landings.filter((l) => l.ultimoStatus === "UP").length,
    down: landings.filter((l) => l.ultimoStatus === "DOWN").length,
    sinVerificar: landings.filter((l) => !l.ultimoStatus).length,
  }

  const SidebarContent = ({ mobile }) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
          GL
        </div>
        {(sidebarExpanded || mobile) && (
          <span className="text-sm font-semibold whitespace-nowrap">Gestor Landings</span>
        )}
      </div>
      <div className="flex-1 space-y-1 px-2">
        {sidebarLinks.map((link) => (
          <button
            key={link.label}
            onClick={link.action ? link.action : link.label === "Auditoría" ? handleOpenAudit : link.label === "Configuración" ? () => setSettingsOpen(true) : undefined}
            className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {(sidebarExpanded || mobile) && <span>{link.label}</span>}
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
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">Gestor Landings</span>
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
            <Button variant="outline" size="sm" onClick={handleCheckAll} disabled={checkingAll}>
              <RefreshCw className={`w-4 h-4 ${checkingAll ? "animate-spin" : ""}`} />
              Verificar todas
            </Button>
            <Button variant="outline" size="sm" onClick={() => api.exportCSV().then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `landings-${new Date().toISOString().slice(0,10)}.csv`; a.click() }).catch(() => toast.error("Error al exportar"))}>
              <Download className="w-4 h-4" />
              CSV
            </Button>
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={dark ? "Modo claro" : "Modo oscuro"}>
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <LandingFormModal key={modalKey + "-create"} onSubmit={handleCreate}>
              Nueva Landing
            </LandingFormModal>
          </div>
        </header>

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
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoria(activeCategoria === cat ? null : cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeCategoria === cat
                  ? "text-white shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
              style={activeCategoria === cat ? { backgroundColor: categoriaColors[cat] } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tags filter */}
        {landings.some((l) => l.tags) && (
          <div className="flex gap-1.5 px-3 sm:px-4 md:px-6 pt-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTag(null)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                !activeTag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Todos
            </button>
            {[...new Set(landings.flatMap((l) => (l.tags ? l.tags.split(",").map((t) => t.trim()) : [])))]
              .sort()
              .map((tag) => (
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
              <p className="text-lg font-medium">No hay landings</p>
              <p className="text-sm mt-1">Agregá tu primera landing para empezar</p>
            </div>
          ) : (
            <>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg text-sm">
                  <span className="font-medium">{selectedIds.size} seleccionada(s)</span>
                  <Button variant="outline" size="sm" onClick={handleBulkCheck} disabled={bulkChecking}>
                    <RefreshCw className={`w-3 h-3 ${bulkChecking ? "animate-spin" : ""}`} />
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
                    <LandingCard
                      landing={landing}
                      onEdit={setEditingLanding}
                      onDelete={handleDelete}
                      onCheck={fetchLandings}
                    />
                    <div className="mt-1 text-center">
                      <button
                        onClick={() => handleViewLogs(landing)}
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
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => setLogsModal(null)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Historial de checks</h2>
            <p className="text-sm text-muted-foreground mb-4">{logsModal.nombre} — {logsModal.url}</p>
            {logsLoading ? (
              <LogSkeleton />
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin verificaciones aún</p>
            ) : (
              <>
              <UptimeChart logs={logs} />
              <div className="space-y-2">
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
              <Button variant="outline" onClick={() => setLogsModal(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* SSL Dashboard modal */}
      {sslModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => setSslModal(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Estado SSL</h2>
            <p className="text-sm text-muted-foreground mb-4">Certificados SSL de todas las landings</p>
            {landings.filter((l) => l.ultimoSslDias !== null).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos SSL aún. Verificá alguna landing primero.</p>
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
              <Button variant="outline" onClick={() => setSslModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => setSettingsOpen(false)}>
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
                  <p className="text-xs text-muted-foreground">Recibir correo cuando una landing esté caída</p>
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
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit log modal */}
      {auditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => setAuditModal(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Historial de cambios</h2>
            {auditLoading ? (
              <LogSkeleton />
            ) : auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin cambios registrados aún</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
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
              <Button variant="outline" onClick={() => setAuditModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingLanding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-[800px] max-h-[90vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg sm:text-xl font-bold mb-5">Editar Landing</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                const data = Object.fromEntries(formData)
                await handleEdit(data)
              }}
              className="space-y-4"
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                  <input
                    name="nombre" defaultValue={editingLanding.nombre} required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Marca</label>
                  <input
                    name="marca" defaultValue={editingLanding.marca} required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <input
                    name="cliente" defaultValue={editingLanding.cliente || ""}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">URL</label>
                  <input
                    name="url" defaultValue={editingLanding.url} required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <select
                    name="categoria" defaultValue={editingLanding.categoria || "Cober"}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <select
                    name="estado" defaultValue={editingLanding.estado}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                    <option value="EN_DESARROLLO">En desarrollo</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">URL de la imagen de portada</label>
                <input
                  name="imagenUrl" defaultValue={editingLanding.imagenUrl || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                />
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Formulario (Google Sheet)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">URL del Sheet</label>
                    <input
                      name="sheetUrl" defaultValue={editingLanding.sheetUrl || ""}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      placeholder="https://docs.google.com/spreadsheets/..."
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Estado del formulario</label>
                    <select
                      name="formStatus" defaultValue={editingLanding.formStatus || "PENDIENTE"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="OK">Verificado</option>
                      <option value="ERROR">Con error</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">FTP (opcional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["ftpHost", "ftpPath", "ftpUser", "ftpPass"].map((field) => (
                    <div key={field} className="flex flex-col space-y-2">
                      <label className="text-sm font-medium">
                        {field === "ftpHost" ? "Host" : field === "ftpPath" ? "Ruta" : field === "ftpUser" ? "Usuario" : "Contraseña"}
                      </label>
                      <input
                        name={field}
                        type={field === "ftpPass" ? "password" : "text"}
                        defaultValue={editingLanding[field] || ""}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <input
                  name="tags" defaultValue={editingLanding.tags || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  placeholder="premium, redesign, urgencia"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="tecnologias">Tecnologías</Label>
                <input
                  name="tecnologias" defaultValue={editingLanding.tecnologias || ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  name="notas" rows={3} defaultValue={editingLanding.notas || ""}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setEditingLanding(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar cambios</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Page modal */}
      {statusPageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => setStatusPageOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <StatusPageSettings />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setStatusPageOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys modal */}
      {apiKeysOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => setApiKeysOpen(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <ApiKeyManager />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setApiKeysOpen(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Plan modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={() => setPlanModal(false)}>
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
            <PlanSelector />
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setPlanModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}