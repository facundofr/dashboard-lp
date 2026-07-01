import { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Button } from "../components/ui/button"
import { ArrowLeft, MailCheck } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <MailCheck className="w-16 h-16 mx-auto mb-2 text-primary" />
            <CardTitle className="text-2xl">Revisá tu email</CardTitle>
            <CardDescription>Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/" className="text-sm text-primary hover:underline">Volver al inicio de sesión</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
          <CardDescription>Te enviaremos un enlace para restablecer tu contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}