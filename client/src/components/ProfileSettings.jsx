import { useState } from "react"
import { api } from "../lib/api"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useAuth } from "../context/AuthContext"
import { toast } from "sonner"

export default function ProfileSettings({ onClose }) {
  const { user } = useAuth()
  const [nombre, setNombre] = useState(user?.nombre || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (newPassword) {
        await api.updateProfile({ nombre, email, currentPassword, newPassword })
        toast.success("Perfil actualizado")
      } else {
        localStorage.setItem("user", JSON.stringify({ ...user, nombre, email }))
        toast.success("Perfil actualizado")
      }
      if (onClose) onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h3 className="text-lg font-bold">Mi perfil</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Cambiar contraseña (opcional)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <Label>Contraseña actual</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Requerida para cambios" />
          </div>
          <div className="flex flex-col space-y-2">
            <Label>Nueva contraseña</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Dejar vacío para no cambiar" minLength={6} />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </div>
    </form>
  )
}
