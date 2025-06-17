export interface Document {
  id: string
  name: string
  originalName: string
  type: "pdf" | "image" | "text" | "doc"
  size: number
  content: string
  ocrText: string
  tags: string[]
  folderId: string | null
  createdAt: Date
  updatedAt: Date
  thumbnail?: string
  isProcessing: boolean
  processingProgress: number
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  children: string[]
  documentIds: string[]
  isWatched: boolean
  watchPath?: string
  createdAt: Date
  color: string
  icon: string
}

export interface Tag {
  id: string
  name: string
  color: string
  documentCount: number
}

export interface SearchResult {
  document: Document
  matches: {
    field: "name" | "content" | "ocrText" | "tags"
    text: string
    highlight: string
  }[]
}

export interface AppState {
  documents: Document[]
  folders: Folder[]
  tags: Tag[]
  currentView: "dashboard" | "documents" | "folders" | "tags" | "search" | "settings"
  selectedFolder: string | null
  searchQuery: string
  isProcessing: boolean
}
