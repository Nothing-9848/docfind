export interface Document {
  id: string
  name: string
  originalName: string
  type: "pdf" | "doc" | "image" | "text"
  size: number
  content: string
  ocrText: string
  tags: string[]
  folderId: string | null
  createdAt: Date
  updatedAt: Date
  isProcessing: boolean
  processingProgress: number
  url?: string
  language?: string // OCR language
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

export interface SearchIndex {
  id: string
  documentId: string
  term: string
  frequency: number
  position: number[]
  language: string
}

export interface AppState {
  documents: Document[]
  folders: Folder[]
  tags: Tag[]
  currentView: "dashboard" | "documents" | "folders" | "tags" | "search" | "settings"
  selectedFolder: string | null
  searchQuery: string
  isProcessing: boolean
  settings: {
    ocrLanguages: string[]
    defaultLanguage: string
    storageLocation: string
    autoBackup: boolean
  }
}

export interface OCRLanguage {
  code: string
  name: string
  nativeName: string
}
