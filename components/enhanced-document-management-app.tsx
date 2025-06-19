"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./enhanced-sidebar"
import { MainContent } from "./enhanced-main-content"
import { DocumentStore } from "../store/document-store"
import { DatabaseService } from "../services/database-service"
import type { AppState } from "../types"

export function DocumentManagementApp() {
  const [state, setState] = useState<AppState>(DocumentStore.getState())

  useEffect(() => {
    const unsubscribe = DocumentStore.subscribe(setState)

    // Load settings from database
    DatabaseService.getSettings()
      .then((settings) => {
        if (settings) {
          setState((prev) => ({ ...prev, settings }))
        }
      })
      .catch(console.error)

    return unsubscribe
  }, [])

  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates }

      // Save settings to database when they change
      if (updates.settings) {
        DatabaseService.saveSettings(updates.settings).catch(console.error)
      }

      return newState
    })
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar state={state} updateState={updateState} />
      <MainContent state={state} updateState={updateState} />
    </div>
  )
}
