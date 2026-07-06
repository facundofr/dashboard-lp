import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { api } from "../lib/api"

const NotificationContext = createContext(null)

const STORAGE_KEY = "app_notifications"
const MAX_NOTIFICATIONS = 50

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const synced = useRef(false)

  useEffect(() => {
    async function init() {
      try {
        const dbNotifications = await api.getNotifications()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbNotifications))
        setNotifications(dbNotifications)
        setUnreadCount(dbNotifications.filter((n) => !n.read).length)
      } catch {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            setNotifications(parsed)
            setUnreadCount(parsed.filter((n) => !n.read).length)
          } catch {}
        }
      }
      synced.current = true
    }
    init()
  }, [])

  const persist = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  const addNotification = useCallback(async ({ title, description, type = "info", link }) => {
    const addToState = (notification) => {
      setNotifications((prev) => {
        const next = [notification, ...prev].slice(0, MAX_NOTIFICATIONS)
        persist(next)
        return next
      })
      setUnreadCount((prev) => prev + 1)
    }

    let dbNotification
    try {
      dbNotification = await api.createNotification({ title, description, type, link })
      addToState(dbNotification)
    } catch {
      addToState({
        id: Date.now(),
        title,
        description: description || null,
        type: type || "info",
        link: link || null,
        read: false,
        createdAt: new Date().toISOString(),
      })
    }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await api.markNotificationsRead()
    } catch {}
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      persist(next)
      return next
    })
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(async () => {
    try {
      await api.clearNotifications()
    } catch {}
    setNotifications([])
    setUnreadCount(0)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)