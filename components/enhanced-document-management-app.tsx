"use client"

import { useState, useEffect } from "react"
import { DocumentStore } from "../store/document-store"
import { DatabaseService } from "../services/database-service"
import type { AppState } from "../types"
import { NotionLayout } from "./notion-layout"

export function DocumentManagementApp() {
  const [state, setState] = useState<AppState>(DocumentStore.getState())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = DocumentStore.subscribe(setState)

    // Initialize database and load data
    const initializeApp = async () => {
      try {
        await DatabaseService.initialize()

        // Load settings from database
        const savedSettings = await DatabaseService.getSettings()
        if (savedSettings) {
          // Update store with saved settings if needed
          console.log("Loaded settings:", savedSettings)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Failed to initialize app:", error)
        setIsLoading(false)
      }
    }

    initializeApp()

    return unsubscribe
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing DocuFlow Pro...</p>
        </div>
      </div>
    )
  }

  return <NotionLayout state={state} />
}
