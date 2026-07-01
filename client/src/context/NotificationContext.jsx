import { createContext, useContext, useState, useEffect, useCallback } from "react"

const NotificationContext = createContext(null)

const STORAGE_KEY = "app_notifications"
const MAX_NOTIFICATIONS = 50

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setNotifications(parsed)
        setUnreadCount(parsed.filter((n) => !n.read).length)
      }
    } catch {}
  }, [])

  const persist = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  const addNotification = useCallback(({ title, description, type = "info", link }) => {
    setNotifications((prev) => {
      const next = [
        { id: Date.now(), title, description, type, link, read: false, createdAt: new Date().toISOString() },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS)
      persist(next)
      return next
    })
    setUnreadCount((prev) => prev + 1)
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      persist(next)
      return next
    })
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(() => {
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