"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./enhanced-sidebar"
import { MainContent } from "./enhanced-main-content"
import { DocumentStore } from "../store/document-store"
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
        // Initialize services
        await EnhancedOCRService.initialize()

        // Get initial state from DocumentStore
        const storeState = DocumentStore.getState()
        setState(storeState)

        // Subscribe to store changes
        const unsubscribe = DocumentStore.subscribe((newState) => {
          console.log("NotionLayout: Store updated, new state:", newState)
          setState(newState)
        })

        // Cleanup subscription on unmount
        return () => {
          unsubscribe()
        }
      } catch (error) {
        console.error("Failed to initialize app:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const cleanup = initializeApp()
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then((fn) => fn && fn())
      }
    }
  }, [])

  const updateState = (updates: Partial<AppState>) => {
    console.log("NotionLayout: Updating state:", updates)

    // Update local state immediately for UI responsiveness
    setState((prev) => ({ ...prev, ...updates }))

    // Update store for persistence and other components
    if (updates.currentView) DocumentStore.setCurrentView(updates.currentView)
    if (updates.selectedFolder !== undefined) DocumentStore.setSelectedFolder(updates.selectedFolder)
    if (updates.searchQuery !== undefined) DocumentStore.setSearchQuery(updates.searchQuery)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading DocuFlow Pro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Sidebar - Notion-style */}
      <div className="flex-shrink-0 border-r border-gray-200">
        <Sidebar state={state} updateState={updateState} />
      </div>

      {/* Main Content - Notion-style */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <MainContent state={state} updateState={updateState} />
      </div>
    </div>
  )
}
