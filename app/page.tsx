"use client"

import dynamic from "next/dynamic"

// Dynamically import the component to avoid SSR issues
const DocumentManagementApp = dynamic(
  () => import("@/components/document-management-app").then((mod) => ({ default: mod.DocumentManagementApp })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Document Management System...</p>
        </div>
      </div>
    ),
  },
)

export default function Home() {
  return <DocumentManagementApp />
}
