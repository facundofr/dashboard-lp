import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "./ui/button"
import { useNotifications } from "../context/NotificationContext"

const typeIcons = {
  error: "🔴",
  warning: "🟡",
  success: "🟢",
  info: "🔵",
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => { setOpen(!open); if (!open) markAllRead() }}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-card">
            <span className="text-sm font-semibold">Notificaciones</span>
            <div className="flex gap-2">
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground">Limpiar</button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Sin notificaciones</div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 text-sm ${n.read ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-2">
                    <span>{typeIcons[n.type] || "🔵"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{n.title}</p>
                      {n.description && <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}