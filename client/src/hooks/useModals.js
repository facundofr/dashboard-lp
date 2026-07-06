import { useState } from "react"
import { api } from "../lib/api"

export function useModals() {
  const [editingLanding, setEditingLanding] = useState(null)
  const [logsModal, setLogsModal] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [auditModal, setAuditModal] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sslModal, setSslModal] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [statusPageOpen, setStatusPageOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [usersOpen, setUsersOpen] = useState(false)
  const [incidentsOpen, setIncidentsOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [templateTypesOpen, setTemplateTypesOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleViewLogs = async (landing) => {
    setLogsModal(landing)
    setLogsLoading(true)
    try {
      const data = await api.getLandingLogs(landing.id)
      setLogs(data)
    } catch {
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const openAudit = async () => {
    setAuditLoading(true)
    try {
      const data = await api.getAuditLogs()
      setAuditLogs(data)
    } catch {}
    setAuditLoading(false)
    setAuditModal(true)
  }

  return {
    editingLanding, setEditingLanding,
    logsModal, setLogsModal,
    logs, logsLoading,
    auditModal, setAuditModal,
    auditLogs, auditLoading,
    settingsOpen, setSettingsOpen,
    sslModal, setSslModal,
    profileOpen, setProfileOpen,
    statusPageOpen, setStatusPageOpen,
    apiKeysOpen, setApiKeysOpen,
    usersOpen, setUsersOpen,
    incidentsOpen, setIncidentsOpen,
    categoriesOpen, setCategoriesOpen,
    templateTypesOpen, setTemplateTypesOpen,
    sheetOpen, setSheetOpen,
    handleViewLogs, openAudit,
  }
}
