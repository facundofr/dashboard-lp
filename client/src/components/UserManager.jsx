import { useState, useEffect } from "react"
import { toast } from "sonner"
import { api } from "../lib/api"
import { Button } from "./ui/button"
import { LogSkeleton } from "./ui/skeleton"

export default function UserManager({ onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleToggleStatus = async (id, email) => {
    if (!confirm(`¿${users.find(u => u.id === id)?.disabled ? "Habilitar" : "Deshabilitar"} a ${email}?`)) return
    try {
      await api.toggleUserStatus(id)
      toast.success("Estado actualizado")
      fetchUsers()
    } catch { toast.error("Error al cambiar estado") }
  }

  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin"
    if (!confirm(`¿Cambiar rol de ${users.find(u => u.id === id)?.email} a ${newRole}?`)) return
    try {
      await api.updateUserRole(id, newRole)
      toast.success("Rol actualizado")
      fetchUsers()
    } catch { toast.error("Error al cambiar rol") }
  }

  const handleDelete = async (id, email) => {
    if (!confirm(`¿Eliminar permanentemente a ${email}? Esta acción eliminará todas sus landings y datos.`)) return
    try {
      await api.deleteUser(id)
      toast.success("Usuario eliminado")
      fetchUsers()
    } catch { toast.error("Error al eliminar usuario") }
  }

  const handleApprove = async (id, email) => {
    if (!confirm(`¿Autorizar el ingreso de ${email}?`)) return
    try {
      await api.approveUser(id)
      toast.success("Usuario autorizado")
      fetchUsers()
    } catch { toast.error("Error al autorizar usuario") }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Usuarios</h2>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          Actualizar
        </Button>
      </div>
      {loading ? (
        <LogSkeleton />
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Sin usuarios registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-2">Email</th>
                <th className="text-left py-2 px-2">Nombre</th>
                <th className="text-center py-2 px-2">Rol</th>
                <th className="text-center py-2 px-2">Estado</th>
                <th className="text-center py-2 px-2">Validación</th>
                <th className="text-center py-2 px-2">Plan</th>
                <th className="text-right py-2 pl-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 pr-2 truncate max-w-[180px]">{u.email}</td>
                  <td className="py-2 px-2 truncate max-w-[120px]">{u.nombre}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${u.role === "admin" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`text-xs font-medium ${u.disabled ? "text-destructive" : "text-green-600"}`}>
                      {u.disabled ? "Inactivo" : "Activo"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${u.approved ? "text-green-600" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                      {u.approved ? "Aprobado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center text-xs text-muted-foreground">{u.plan}</td>
                  <td className="py-2 pl-2 text-right">
                    <div className="flex gap-1 justify-end">
                      {!u.approved && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleApprove(u.id, u.email)}>
                          Autorizar
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleChangeRole(u.id, u.role)}>
                        {u.role === "admin" ? "Hacer user" : "Hacer admin"}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleToggleStatus(u.id, u.email)}>
                        {u.disabled ? "Habilitar" : "Deshab."}
                      </Button>
                      <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleDelete(u.id, u.email)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  )
}
