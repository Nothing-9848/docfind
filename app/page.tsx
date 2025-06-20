"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { DatabaseService } from "../services/database-service"
import { EnhancedOCRService } from "../services/enhanced-ocr-service"
import { NotionLayout } from "../components/notion-layout"

// Dynamic import to prevent SSR issues
const DocumentManagementApp = dynamic(
  () => import("../components/enhanced-document-management-app").then((mod) => mod.DocumentManagementApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
  },
)

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Initialize services
    Promise.all([DatabaseService.initialize(), EnhancedOCRService.initialize()]).catch(console.error)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DocuFlow Pro...</p>
        </div>
      </div>
    )
  }

  return <NotionLayout />
}
