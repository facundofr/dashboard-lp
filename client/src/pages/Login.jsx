import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [error, setError] = useState("")
  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register({ email, password, nombre })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Gestor de Landings</CardTitle>
          <CardDescription>
            {isLogin ? "Iniciá sesión para continuar" : "Creá tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="flex flex-col space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" required />
              </div>
            )}
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" required />
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                )}
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full">
              {isLogin ? "Ingresar" : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
