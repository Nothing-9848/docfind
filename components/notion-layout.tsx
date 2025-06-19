"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./enhanced-sidebar"
import { MainContent } from "./enhanced-main-content"
import { DatabaseService } from "../services/database-service"
import { EnhancedOCRService } from "../services/enhanced-ocr-service"
import type { AppState } from "../types"

const initialState: AppState = {
  documents: [],
  folders: [],
  tags: [],
  currentView: "dashboard",
  selectedFolder: null,
  searchQuery: "",
  isProcessing: false,
  settings: {
    ocrLanguages: ["eng", "hin", "tel"],
    defaultLanguage: "eng",
    storageLocation: "browser",
    autoBackup: true,
  },
}

export function NotionLayout() {
  const [state, setState] = useState<AppState>(initialState)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await DatabaseService.initialize()
        await EnhancedOCRService.initialize()

        // Load data from database
        const [documents, folders, tags] = await Promise.all([
          DatabaseService.getDocuments(),
          DatabaseService.getFolders(),
          DatabaseService.getTags(),
        ])

        // Load settings
        const settings = await DatabaseService.getSettings()

        setState((prev) => ({
          ...prev,
          documents: documents || [],
          folders: folders.length > 0 ? folders : prev.folders,
          tags: tags || [],
          settings: settings || prev.settings,
        }))
      } catch (error) {
        console.error("Failed to initialize app:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing DocuFlow Pro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar - Fixed width with internal scrolling */}
      <div className="flex-shrink-0">
        <Sidebar state={state} updateState={updateState} />
      </div>

      {/* Main Content - Flexible width with internal scrolling */}
      <div className="flex-1 flex flex-col min-w-0">
        <MainContent state={state} updateState={updateState} />
      </div>
    </div>
  )
}
