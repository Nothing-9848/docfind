"use client"

import { useState, useEffect } from "react"
import { DocumentStore } from "../store/document-store"
import { Sidebar } from "./sidebar"
import { MainContent } from "./main-content"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { AppState } from "../types"

export function DocumentManagementApp() {
  const [state, setState] = useState<AppState>(DocumentStore.getState())

  useEffect(() => {
    const unsubscribe = DocumentStore.subscribe(setState)
    return unsubscribe
  }, [])

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar state={state} />
        <MainContent state={state} />
      </div>
    </SidebarProvider>
  )
}
