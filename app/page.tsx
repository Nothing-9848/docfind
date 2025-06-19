"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

const NotionLayout = dynamic(
  () => import("../components/notion-layout").then((mod) => ({ default: mod.NotionLayout })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading DocuFlow Pro...</p>
        </div>
      </div>
    ),
  },
)

export default function Page() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  return <NotionLayout />
}
