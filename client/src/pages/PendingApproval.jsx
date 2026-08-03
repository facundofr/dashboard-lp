import { useAuth } from "../context/AuthContext"
import Logo from "../components/Logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function PendingApproval() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo className="h-20 w-auto text-foreground" />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Usuario pendiente de validación</CardTitle>
            <CardDescription>
              Hola {user?.nombre || ""}, tu cuenta ({user?.email}) todavía no fue autorizada por un administrador.
              Vas a poder acceder al panel apenas se apruebe tu ingreso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={logout}>
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
