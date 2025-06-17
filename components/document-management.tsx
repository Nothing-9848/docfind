"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { MainContent } from "./main-content"
import { SidebarProvider } from "@/components/ui/sidebar"

export function DocumentManagement() {
  const [selectedView, setSelectedView] = useState("dashboard")
  const [documents, setDocuments] = useState([
    {
      id: "1",
      title: "Project Proposal.pdf",
      content: "This is a sample project proposal document...",
      tags: ["business", "proposal", "important"],
      createdAt: new Date("2024-01-15"),
      size: "2.4 MB",
      type: "pdf",
    },
    {
      id: "2",
      title: "Meeting Notes.docx",
      content: "Meeting notes from the quarterly review...",
      tags: ["meeting", "notes", "quarterly"],
      createdAt: new Date("2024-01-10"),
      size: "1.2 MB",
      type: "docx",
    },
    {
      id: "3",
      title: "Invoice_2024.png",
      content: "Invoice for services rendered in January 2024...",
      tags: ["invoice", "finance", "2024"],
      createdAt: new Date("2024-01-08"),
      size: "856 KB",
      type: "png",
    },
  ])

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar selectedView={selectedView} onViewChange={setSelectedView} documents={documents} />
        <MainContent selectedView={selectedView} documents={documents} setDocuments={setDocuments} />
      </div>
    </SidebarProvider>
  )
}
