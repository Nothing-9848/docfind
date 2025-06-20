import type { Document, Folder, Tag, AppState } from "../types"

interface DatabaseRecord {
  id: string
  type: "document" | "folder" | "tag" | "searchIndex" | "settings"
  data: any
  createdAt: number
  updatedAt: number
}

export class EmbeddedDatabase {
  private static instance: EmbeddedDatabase
  private db: IDBDatabase | null = null
  private isInitialized = false
  private readonly dbName = "DocuFlowEmbedded"
  private readonly version = 2

  static getInstance(): EmbeddedDatabase {
    if (!this.instance) {
      this.instance = new EmbeddedDatabase()
    }
    return this.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error("Database initialization failed:", request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log("Embedded database initialized successfully")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create main data store
        if (!db.objectStoreNames.contains("records")) {
          const store = db.createObjectStore("records", { keyPath: "id" })
          store.createIndex("type", "type", { unique: false })
          store.createIndex("createdAt", "createdAt", { unique: false })
          store.createIndex("updatedAt", "updatedAt", { unique: false })
        }

        // Create blob store for file data
        if (!db.objectStoreNames.contains("blobs")) {
          db.createObjectStore("blobs", { keyPath: "id" })
        }

        // Create search index store
        if (!db.objectStoreNames.contains("searchTerms")) {
          const searchStore = db.createObjectStore("searchTerms", { keyPath: "id" })
          searchStore.createIndex("term", "term", { unique: false })
          searchStore.createIndex("documentId", "documentId", { unique: false })
        }
      }
    })
  }

  // Document operations
  async saveDocument(document: Document): Promise<void> {
    await this.ensureInitialized()

    const record: DatabaseRecord = {
      id: document.id,
      type: "document",
      data: document,
      createdAt: document.createdAt.getTime(),
      updatedAt: document.updatedAt.getTime(),
    }

    return this.saveRecord(record)
  }

  async getDocuments(): Promise<Document[]> {
    await this.ensureInitialized()
    const records = await this.getRecordsByType("document")
    return records.map((r) => r.data)
  }

  async getDocument(id: string): Promise<Document | null> {
    await this.ensureInitialized()
    const record = await this.getRecord(id)
    return record?.type === "document" ? record.data : null
  }

  async deleteDocument(id: string): Promise<void> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records", "blobs", "searchTerms"], "readwrite")

      // Delete document record
      transaction.objectStore("records").delete(id)

      // Delete associated blob
      transaction.objectStore("blobs").delete(id)

      // Delete search terms
      const searchStore = transaction.objectStore("searchTerms")
      const searchIndex = searchStore.index("documentId")
      const searchRequest = searchIndex.openCursor(IDBKeyRange.only(id))

      searchRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()
    })
  }

  // Folder operations
  async saveFolder(folder: Folder): Promise<void> {
    await this.ensureInitialized()

    const record: DatabaseRecord = {
      id: folder.id,
      type: "folder",
      data: folder,
      createdAt: folder.createdAt.getTime(),
      updatedAt: Date.now(),
    }

    return this.saveRecord(record)
  }

  async getFolders(): Promise<Folder[]> {
    await this.ensureInitialized()
    const records = await this.getRecordsByType("folder")
    return records.map((r) => r.data)
  }

  // Tag operations
  async saveTag(tag: Tag): Promise<void> {
    await this.ensureInitialized()

    const record: DatabaseRecord = {
      id: tag.id,
      type: "tag",
      data: tag,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    return this.saveRecord(record)
  }

  async getTags(): Promise<Tag[]> {
    await this.ensureInitialized()
    const records = await this.getRecordsByType("tag")
    return records.map((r) => r.data)
  }

  // Settings operations
  async saveSettings(settings: AppState["settings"]): Promise<void> {
    await this.ensureInitialized()

    const record: DatabaseRecord = {
      id: "app-settings",
      type: "settings",
      data: settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    return this.saveRecord(record)
  }

  async getSettings(): Promise<AppState["settings"] | null> {
    await this.ensureInitialized()
    const record = await this.getRecord("app-settings")
    return record?.type === "settings" ? record.data : null
  }

  // Blob storage for files
  async saveBlob(id: string, blob: Blob): Promise<void> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["blobs"], "readwrite")
      const store = transaction.objectStore("blobs")
      const request = store.put({ id, blob, createdAt: Date.now() })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getBlob(id: string): Promise<Blob | null> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["blobs"], "readonly")
      const store = transaction.objectStore("blobs")
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result?.blob || null)
      }
    })
  }

  // Search indexing
  async indexDocument(document: Document): Promise<void> {
    await this.ensureInitialized()

    // Clear existing index for this document
    await this.clearDocumentIndex(document.id)

    // Extract and index terms
    const text = `${document.name} ${document.content} ${document.ocrText}`.toLowerCase()
    const terms = this.extractSearchTerms(text)

    const transaction = this.db!.transaction(["searchTerms"], "readwrite")
    const store = transaction.objectStore("searchTerms")

    terms.forEach((term, index) => {
      const searchRecord = {
        id: `${document.id}_${index}`,
        term: term,
        documentId: document.id,
        frequency: 1,
        position: index,
      }
      store.add(searchRecord)
    })
  }

  async searchDocuments(query: string): Promise<string[]> {
    await this.ensureInitialized()

    const terms = this.extractSearchTerms(query.toLowerCase())
    const documentScores = new Map<string, number>()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchTerms"], "readonly")
      const store = transaction.objectStore("searchTerms")
      const index = store.index("term")

      let completedSearches = 0

      if (terms.length === 0) {
        resolve([])
        return
      }

      terms.forEach((term) => {
        const request = index.openCursor(IDBKeyRange.only(term))

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            const record = cursor.value
            const currentScore = documentScores.get(record.documentId) || 0
            documentScores.set(record.documentId, currentScore + 1)
            cursor.continue()
          } else {
            completedSearches++
            if (completedSearches === terms.length) {
              const sortedResults = Array.from(documentScores.entries())
                .sort(([, a], [, b]) => b - a)
                .map(([docId]) => docId)
              resolve(sortedResults)
            }
          }
        }

        request.onerror = () => reject(request.error)
      })
    })
  }

  // Storage management
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
        }
      } catch (error) {
        console.error("Failed to get storage estimate:", error)
      }
    }
    return { used: 0, quota: 0 }
  }

  async exportData(): Promise<any> {
    await this.ensureInitialized()

    const documents = await this.getDocuments()
    const folders = await this.getFolders()
    const tags = await this.getTags()
    const settings = await this.getSettings()

    return {
      documents,
      folders,
      tags,
      settings,
      exportDate: new Date().toISOString(),
      version: "2.0",
    }
  }

  async importData(data: any): Promise<void> {
    await this.ensureInitialized()

    // Clear existing data
    await this.clearAllData()

    // Import documents
    if (data.documents) {
      for (const doc of data.documents) {
        await this.saveDocument(doc)
      }
    }

    // Import folders
    if (data.folders) {
      for (const folder of data.folders) {
        await this.saveFolder(folder)
      }
    }

    // Import tags
    if (data.tags) {
      for (const tag of data.tags) {
        await this.saveTag(tag)
      }
    }

    // Import settings
    if (data.settings) {
      await this.saveSettings(data.settings)
    }
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records", "blobs", "searchTerms"], "readwrite")

      transaction.objectStore("records").clear()
      transaction.objectStore("blobs").clear()
      transaction.objectStore("searchTerms").clear()

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()
    })
  }

  // Private helper methods
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  private async saveRecord(record: DatabaseRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readwrite")
      const store = transaction.objectStore("records")
      const request = store.put(record)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async getRecord(id: string): Promise<DatabaseRecord | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readonly")
      const store = transaction.objectStore("records")
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  private async getRecordsByType(type: string): Promise<DatabaseRecord[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["records"], "readonly")
      const store = transaction.objectStore("records")
      const index = store.index("type")
      const request = index.getAll(type)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  private async clearDocumentIndex(documentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchTerms"], "readwrite")
      const store = transaction.objectStore("searchTerms")
      const index = store.index("documentId")
      const request = index.openCursor(IDBKeyRange.only(documentId))

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  private extractSearchTerms(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2)
      .slice(0, 1000) // Limit terms to prevent excessive indexing
  }
}
