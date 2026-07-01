import { Component } from "react"
import { Button } from "./ui/button"
import { AlertTriangle } from "lucide-react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
            <p className="text-muted-foreground mb-6">
              Ocurrió un error inesperado. Recargá la página o intentá de nuevo.
            </p>
            <Button onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}