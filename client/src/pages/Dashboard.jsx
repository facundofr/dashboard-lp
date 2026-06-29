import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import LandingCard from "../components/LandingCard"
import LandingFormModal from "../components/LandingFormModal"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet"
import {
  Home, Globe, LogOut, Menu, Search, Plus, User,
} from "lucide-react"

const categorias = ["Cober", "Bristol", "Medicals", "Centros Médicos"]
const statusTabs = [
  { key: "todas", label: "Todas" },
  { key: "ACTIVO", label: "Activas" },
  { key: "INACTIVO", label: "Inactivas" },
  { key: "EN_DESARROLLO", label: "En desarrollo" },
]
const categoriaColors = {
  Cober: "bg-purple-600",
  Bristol: "bg-blue-600",
  Medicals: "bg-emerald-600",
  "Centros Médicos": "bg-amber-600",
}

const sidebarLinks = [
  { label: "Dashboard", icon: Home },
  { label: "Landings", icon: Globe },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [landings, setLandings] = useState([])
  const [filteredLandings, setFilteredLandings] = useState([])
  const [search, setSearch] = useState("")
  const [activeCategoria, setActiveCategoria] = useState(null)
  const [activeStatus, setActiveStatus] = useState("todas")
  const [editingLanding, setEditingLanding] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const fetchLandings = useCallback(async () => {
    try {
      const data = await api.getLandings()
      setLandings(data)
    } catch (err) {
      toast.error("Error al cargar landings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLandings() }, [fetchLandings])

  useEffect(() => {
    let result = landings
    if (activeCategoria) {
      result = result.filter((l) => l.categoria === activeCategoria)
    }
    if (activeStatus !== "todas") {
      result = result.filter((l) => l.estado === activeStatus)
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
  }, [landings, activeCategoria, activeStatus, search])

  const handleCreate = async (data) => {
    await api.createLanding(data)
    setModalKey((k) => k + 1)
    await fetchLandings()
    toast.success("Landing creada exitosamente")
  }

  const handleEdit = async (data) => {
    await api.updateLanding(editingLanding.id, data)
    setEditingLanding(null)
    await fetchLandings()
    toast.success("Landing actualizada exitosamente")
  }

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta landing?")) return
    await api.deleteLanding(id)
    await fetchLandings()
    toast.error("Landing eliminada")
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
            className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {(sidebarExpanded || mobile) && <span>{link.label}</span>}
          </button>
        ))}
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
            <span className="text-xs text-muted-foreground truncate">
              {user?.nombre || user?.email}
            </span>
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
          <LandingFormModal key={modalKey + "-create"} onSubmit={handleCreate}>
            Nueva Landing
          </LandingFormModal>
        </header>

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

        <div className="px-3 sm:px-4 md:px-6 pt-2">
          <Tabs value={activeStatus} onValueChange={setActiveStatus}>
            <TabsList>
              {statusTabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredLandings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Globe className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay landings</p>
              <p className="text-sm mt-1">Agregá tu primera landing para empezar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredLandings.map((landing, idx) => (
                <div key={landing.id} className="w-full max-w-[400px] mx-auto sm:mx-0">
                  <LandingCard
                    landing={landing}
                    onEdit={setEditingLanding}
                    onDelete={handleDelete}
                    variant={idx % 2 === 0 ? "3d" : "comet"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editingLanding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-card rounded-xl p-5 sm:p-6 w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl border" onClick={(e) => e.stopPropagation()}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="text-sm font-medium">Tecnologías</label>
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
    </div>
  )
}
