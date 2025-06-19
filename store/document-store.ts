import type { Document, Folder, AppState } from "../types"

export class DocumentStore {
  private static state: AppState = {
    documents: [
      {
        id: "1",
        name: "Business Plan 2024",
        originalName: "business-plan-2024.pdf",
        type: "pdf",
        size: 2048000,
        content: "Business plan document content...",
        ocrText: `BUSINESS PLAN 2024

EXECUTIVE SUMMARY
This comprehensive business plan outlines our strategic direction for the fiscal year 2024. Our company has identified key growth opportunities in emerging markets and technological innovation.

FINANCIAL PROJECTIONS
• Projected Revenue: $2.5M (25% increase)
• Operating Expenses: $1.8M
• Net Profit Margin: 28%
• ROI: 15.5%

MARKET ANALYSIS
The market research indicates strong demand for our products with a total addressable market of $50M. Key competitors include established players, but our innovative approach provides competitive advantages.

STRATEGIC OBJECTIVES
1. Expand into European markets
2. Launch three new product lines
3. Increase customer base by 40%
4. Implement advanced analytics platform

IMPLEMENTATION TIMELINE
Q1: Market research and product development
Q2: European market entry
Q3: Product launches and marketing campaigns
Q4: Performance evaluation and optimization

This document contains confidential and proprietary information.`,
        tags: ["business", "planning", "strategy", "pdf"],
        folderId: "folder-1",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        isProcessing: false,
        processingProgress: 100,
        url: "/placeholder.svg?height=842&width=595", // PDF placeholder
      },
      {
        id: "2",
        name: "Invoice Template",
        originalName: "invoice-template.png",
        type: "image",
        size: 512000,
        content: "Invoice template image",
        ocrText: `INVOICE #INV-2024-001

Date: January 10, 2024
Due Date: February 10, 2024

Bill To:
ABC Corporation
123 Business Avenue
Suite 100
New York, NY 10001

Description                    Qty    Rate      Amount
Professional Services           40    $125.00   $5,000.00
Consulting Hours               20    $150.00   $3,000.00
Software License                1    $500.00     $500.00
                                              __________
                                    Subtotal:  $8,500.00
                                    Tax (8%):    $680.00
                                    Total:     $9,180.00

Payment Terms: Net 30 days
Payment Methods: Check, Wire Transfer, ACH

Thank you for your business!`,
        tags: ["invoice", "template", "finance", "image"],
        folderId: "folder-2",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
        isProcessing: false,
        processingProgress: 100,
        url: "/placeholder.svg?height=600&width=800", // Image placeholder
      },
    ],
    folders: [
      {
        id: "root",
        name: "Root",
        parentId: null,
        children: ["folder-1", "folder-2", "folder-3"],
        documentIds: [],
        isWatched: false,
        createdAt: new Date("2024-01-01"),
        color: "gray",
        icon: "folder",
      },
      {
        id: "folder-1",
        name: "Business Documents",
        parentId: "root",
        children: [],
        documentIds: ["1"],
        isWatched: true,
        watchPath: "/business-docs",
        createdAt: new Date("2024-01-01"),
        color: "blue",
        icon: "briefcase",
      },
      {
        id: "folder-2",
        name: "Financial Records",
        parentId: "root",
        children: [],
        documentIds: ["2"],
        isWatched: true,
        watchPath: "/financial",
        createdAt: new Date("2024-01-01"),
        color: "green",
        icon: "dollar-sign",
      },
      {
        id: "folder-3",
        name: "Archive",
        parentId: "root",
        children: [],
        documentIds: [],
        isWatched: false,
        createdAt: new Date("2024-01-01"),
        color: "gray",
        icon: "archive",
      },
    ],
    tags: [
      { id: "1", name: "business", color: "blue", documentCount: 1 },
      { id: "2", name: "planning", color: "green", documentCount: 1 },
      { id: "3", name: "strategy", color: "purple", documentCount: 1 },
      { id: "4", name: "invoice", color: "yellow", documentCount: 1 },
      { id: "5", name: "template", color: "orange", documentCount: 1 },
      { id: "6", name: "finance", color: "red", documentCount: 2 },
    ],
    currentView: "dashboard",
    selectedFolder: null,
    searchQuery: "",
    isProcessing: false,
  }

  private static listeners: Array<(state: AppState) => void> = []

  static getState(): AppState {
    return { ...this.state }
  }

  static subscribe(listener: (state: AppState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private static notify() {
    this.listeners.forEach((listener) => listener(this.getState()))
  }

  static addDocument(document: Omit<Document, "id" | "createdAt" | "updatedAt">) {
    const newDoc: Document = {
      ...document,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.state.documents.unshift(newDoc)

    // Update folder
    if (document.folderId) {
      const folder = this.state.folders.find((f) => f.id === document.folderId)
      if (folder) {
        folder.documentIds.push(newDoc.id)
      }
    }

    // Update tags
    document.tags.forEach((tagName) => {
      const existingTag = this.state.tags.find((t) => t.name === tagName)
      if (existingTag) {
        existingTag.documentCount++
      } else {
        this.state.tags.push({
          id: Date.now().toString() + Math.random(),
          name: tagName,
          color: this.getRandomColor(),
          documentCount: 1,
        })
      }
    })

    this.notify()
    return newDoc
  }

  static updateDocument(id: string, updates: Partial<Document>) {
    const index = this.state.documents.findIndex((d) => d.id === id)
    if (index !== -1) {
      this.state.documents[index] = {
        ...this.state.documents[index],
        ...updates,
        updatedAt: new Date(),
      }
      this.notify()
    }
  }

  static deleteDocument(id: string) {
    const doc = this.state.documents.find((d) => d.id === id)
    if (doc) {
      // Remove from folder
      if (doc.folderId) {
        const folder = this.state.folders.find((f) => f.id === doc.folderId)
        if (folder) {
          folder.documentIds = folder.documentIds.filter((docId) => docId !== id)
        }
      }

      // Update tag counts
      doc.tags.forEach((tagName) => {
        const tag = this.state.tags.find((t) => t.name === tagName)
        if (tag) {
          tag.documentCount--
          if (tag.documentCount === 0) {
            this.state.tags = this.state.tags.filter((t) => t.id !== tag.id)
          }
        }
      })

      this.state.documents = this.state.documents.filter((d) => d.id !== id)
      this.notify()
    }
  }

  static addFolder(folder: Omit<Folder, "id" | "createdAt">) {
    const newFolder: Folder = {
      ...folder,
      id: Date.now().toString(),
      createdAt: new Date(),
    }

    this.state.folders.push(newFolder)

    // Update parent folder
    if (folder.parentId) {
      const parent = this.state.folders.find((f) => f.id === folder.parentId)
      if (parent) {
        parent.children.push(newFolder.id)
      }
    }

    this.notify()
    return newFolder
  }

  static updateFolder(id: string, updates: Partial<Folder>) {
    const index = this.state.folders.findIndex((f) => f.id === id)
    if (index !== -1) {
      this.state.folders[index] = { ...this.state.folders[index], ...updates }
      this.notify()
    }
  }

  static deleteFolder(id: string) {
    const folder = this.state.folders.find((f) => f.id === id)
    if (folder) {
      // Move documents to parent or root
      const targetFolderId = folder.parentId || "root"
      folder.documentIds.forEach((docId) => {
        this.updateDocument(docId, { folderId: targetFolderId })
      })

      // Move child folders to parent
      folder.children.forEach((childId) => {
        this.updateFolder(childId, { parentId: folder.parentId })
      })

      // Remove from parent
      if (folder.parentId) {
        const parent = this.state.folders.find((f) => f.id === folder.parentId)
        if (parent) {
          parent.children = parent.children.filter((id) => id !== folder.id)
        }
      }

      this.state.folders = this.state.folders.filter((f) => f.id !== id)
      this.notify()
    }
  }

  static setCurrentView(view: AppState["currentView"]) {
    this.state.currentView = view
    this.notify()
  }

  static setSelectedFolder(folderId: string | null) {
    this.state.selectedFolder = folderId
    this.notify()
  }

  static setSearchQuery(query: string) {
    this.state.searchQuery = query
    this.notify()
  }

  static searchDocuments(query: string): Document[] {
    if (!query.trim()) return this.state.documents

    const lowercaseQuery = query.toLowerCase()
    return this.state.documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(lowercaseQuery) ||
        doc.ocrText.toLowerCase().includes(lowercaseQuery) ||
        doc.content.toLowerCase().includes(lowercaseQuery) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
    )
  }

  static getDocumentsByFolder(folderId: string): Document[] {
    return this.state.documents.filter((doc) => doc.folderId === folderId)
  }

  static getDocumentsByTag(tagName: string): Document[] {
    return this.state.documents.filter((doc) => doc.tags.includes(tagName))
  }

  private static getRandomColor(): string {
    const colors = ["blue", "green", "purple", "yellow", "orange", "red", "pink", "indigo"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Simulate folder watching
  static simulateFolderWatch(folderId: string) {
    const folder = this.state.folders.find((f) => f.id === folderId)
    if (folder && folder.isWatched) {
      // Simulate finding new files in watched folder
      setTimeout(() => {
        const mockFile = {
          name: `Auto-imported-${Date.now()}`,
          originalName: `document-${Date.now()}.pdf`,
          type: "pdf" as const,
          size: Math.floor(Math.random() * 1000000),
          content: "Auto-imported document content",
          ocrText: "This document was automatically imported from a watched folder and processed with OCR.",
          tags: ["auto-import", "watched-folder"],
          folderId: folderId,
          isProcessing: false,
          processingProgress: 100,
        }

        this.addDocument(mockFile)
      }, 5000) // Simulate delay
    }
  }
}
