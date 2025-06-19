import type { Document, Folder, Tag, SearchIndex } from "../types"

interface DatabaseSchema {
  documents: Document
  folders: Folder
  tags: Tag
  searchIndex: SearchIndex
  settings: { key: string; value: any }
}

export class DatabaseService {
  private static db: IDBDatabase | null = null
  private static dbName = "DocuFlowDB"
  private static dbVersion = 1
  private static isInitialized = false

  static async initialize(): Promise<void> {
    if (this.isInitialized) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log("Database initialized successfully")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Documents store
        if (!db.objectStoreNames.contains("documents")) {
          const documentsStore = db.createObjectStore("documents", { keyPath: "id" })
          documentsStore.createIndex("name", "name", { unique: false })
          documentsStore.createIndex("type", "type", { unique: false })
          documentsStore.createIndex("folderId", "folderId", { unique: false })
          documentsStore.createIndex("tags", "tags", { unique: false, multiEntry: true })
          documentsStore.createIndex("createdAt", "createdAt", { unique: false })
        }

        // Folders store
        if (!db.objectStoreNames.contains("folders")) {
          const foldersStore = db.createObjectStore("folders", { keyPath: "id" })
          foldersStore.createIndex("name", "name", { unique: false })
          foldersStore.createIndex("parentId", "parentId", { unique: false })
        }

        // Tags store
        if (!db.objectStoreNames.contains("tags")) {
          const tagsStore = db.createObjectStore("tags", { keyPath: "id" })
          tagsStore.createIndex("name", "name", { unique: true })
        }

        // Search index store
        if (!db.objectStoreNames.contains("searchIndex")) {
          const searchStore = db.createObjectStore("searchIndex", { keyPath: "id" })
          searchStore.createIndex("documentId", "documentId", { unique: false })
          searchStore.createIndex("term", "term", { unique: false })
          searchStore.createIndex("language", "language", { unique: false })
        }

        // Settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }
      }
    })
  }

  // Document operations
  static async saveDocument(document: Document): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["documents"], "readwrite")
      const store = transaction.objectStore("documents")
      const request = store.put(document)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  static async getDocuments(): Promise<Document[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["documents"], "readonly")
      const store = transaction.objectStore("documents")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  static async deleteDocument(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["documents", "searchIndex"], "readwrite")
      const documentsStore = transaction.objectStore("documents")
      const searchStore = transaction.objectStore("searchIndex")

      // Delete document
      documentsStore.delete(id)

      // Delete search index entries
      const searchIndex = searchStore.index("documentId")
      const searchRequest = searchIndex.openCursor(IDBKeyRange.only(id))
      searchRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // Search index operations
  static async saveSearchIndex(index: SearchIndex): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchIndex"], "readwrite")
      const store = transaction.objectStore("searchIndex")
      const request = store.put(index)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  static async searchDocuments(query: string, language?: string): Promise<string[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchIndex"], "readonly")
      const store = transaction.objectStore("searchIndex")
      const termIndex = store.index("term")

      const documentIds = new Set<string>()
      const terms = query.toLowerCase().split(/\s+/)

      let completedTerms = 0
      const totalTerms = terms.length

      if (totalTerms === 0) {
        resolve([])
        return
      }

      terms.forEach((term) => {
        const request = termIndex.openCursor(IDBKeyRange.bound(term, term + "\uffff"))
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            const index = cursor.value as SearchIndex
            if (!language || index.language === language) {
              if (index.term.includes(term)) {
                documentIds.add(index.documentId)
              }
            }
            cursor.continue()
          } else {
            completedTerms++
            if (completedTerms === totalTerms) {
              resolve(Array.from(documentIds))
            }
          }
        }
        request.onerror = () => reject(request.error)
      })
    })
  }

  // Settings operations
  static async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key, value })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  static async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result?.value)
      request.onerror = () => reject(request.error)
    })
  }

  // Export/Import functionality
  static async exportData(): Promise<string> {
    const [documents, folders, tags] = await Promise.all([this.getDocuments(), this.getFolders(), this.getTags()])

    const exportData = {
      version: this.dbVersion,
      timestamp: new Date().toISOString(),
      documents,
      folders,
      tags,
    }

    return JSON.stringify(exportData, null, 2)
  }

  static async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData)

    // Clear existing data
    await this.clearAllData()

    // Import new data
    const transaction = this.db!.transaction(["documents", "folders", "tags"], "readwrite")

    // Import documents
    const documentsStore = transaction.objectStore("documents")
    data.documents?.forEach((doc: Document) => {
      documentsStore.add(doc)
    })

    // Import folders
    const foldersStore = transaction.objectStore("folders")
    data.folders?.forEach((folder: Folder) => {
      foldersStore.add(folder)
    })

    // Import tags
    const tagsStore = transaction.objectStore("tags")
    data.tags?.forEach((tag: Tag) => {
      tagsStore.add(tag)
    })

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  private static async clearAllData(): Promise<void> {
    const transaction = this.db!.transaction(["documents", "folders", "tags", "searchIndex"], "readwrite")

    transaction.objectStore("documents").clear()
    transaction.objectStore("folders").clear()
    transaction.objectStore("tags").clear()
    transaction.objectStore("searchIndex").clear()

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // Folder operations
  static async getFolders(): Promise<Folder[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["folders"], "readonly")
      const store = transaction.objectStore("folders")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  static async saveFolder(folder: Folder): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["folders"], "readwrite")
      const store = transaction.objectStore("folders")
      const request = store.put(folder)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Tag operations
  static async getTags(): Promise<Tag[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tags"], "readonly")
      const store = transaction.objectStore("tags")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  static async saveTag(tag: Tag): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tags"], "readwrite")
      const store = transaction.objectStore("tags")
      const request = store.put(tag)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}
