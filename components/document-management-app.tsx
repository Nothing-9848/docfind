"use client"

import { useState, useEffect } from "react"
import { DocumentStore } from "../store/document-store"
import { Sidebar } from "./sidebar"
import { MainContent } from "./main-content"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { AppState } from "../types"

export function DocumentManagementApp() {
  const [state, setState] = useState<AppState | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Ensure we're on the client side
    setIsClient(true)
    setState(DocumentStore.getState())

    const unsubscribe = DocumentStore.subscribe(setState)
    return unsubscribe
  }, [])

  // Show loading state until client-side hydration is complete
  if (!isClient || !state) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Document Management System...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar state={state} />
        <MainContent state={state} />
      </div>
    </SidebarProvider>
  )
}
