import type { Document, Folder, Tag, SearchIndex, AppState } from "../types"

interface DatabaseSchema {
  documents: Document[]
  folders: Folder[]
  tags: Tag[]
  searchIndex: SearchIndex[]
  settings: AppState["settings"]
}

export class DatabaseService {
  private static dbName = "DocuFlowDB"
  private static version = 1
  private static db: IDBDatabase | null = null
  private static isInitialized = false

  static async init(): Promise<void> {
    if (this.isInitialized && this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.isInitialized = true
        console.log("Database initialized successfully")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains("documents")) {
          const documentsStore = db.createObjectStore("documents", { keyPath: "id" })
          documentsStore.createIndex("name", "name", { unique: false })
          documentsStore.createIndex("type", "type", { unique: false })
          documentsStore.createIndex("tags", "tags", { unique: false, multiEntry: true })
          documentsStore.createIndex("folderId", "folderId", { unique: false })
          documentsStore.createIndex("createdAt", "createdAt", { unique: false })
        }

        if (!db.objectStoreNames.contains("folders")) {
          const foldersStore = db.createObjectStore("folders", { keyPath: "id" })
          foldersStore.createIndex("parentId", "parentId", { unique: false })
        }

        if (!db.objectStoreNames.contains("tags")) {
          db.createObjectStore("tags", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("searchIndex")) {
          const searchStore = db.createObjectStore("searchIndex", { keyPath: "id" })
          searchStore.createIndex("term", "term", { unique: false })
          searchStore.createIndex("documentId", "documentId", { unique: false })
          searchStore.createIndex("language", "language", { unique: false })
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" })
        }
      }
    })
  }

  static async saveDocument(document: Document): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["documents"], "readwrite")
      const store = transaction.objectStore("documents")
      const request = store.put(document)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  static async getDocuments(): Promise<Document[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["documents"], "readonly")
      const store = transaction.objectStore("documents")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  static async deleteDocument(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["documents", "searchIndex"], "readwrite")

      // Delete document
      const docStore = transaction.objectStore("documents")
      const docRequest = docStore.delete(id)

      // Delete related search indexes
      const searchStore = transaction.objectStore("searchIndex")
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

  static async saveFolder(folder: Folder): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["folders"], "readwrite")
      const store = transaction.objectStore("folders")
      const request = store.put(folder)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  static async getFolders(): Promise<Folder[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["folders"], "readonly")
      const store = transaction.objectStore("folders")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  static async saveTag(tag: Tag): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tags"], "readwrite")
      const store = transaction.objectStore("tags")
      const request = store.put(tag)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  static async getTags(): Promise<Tag[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["tags"], "readonly")
      const store = transaction.objectStore("tags")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  static async saveSearchIndex(searchIndex: SearchIndex): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchIndex"], "readwrite")
      const store = transaction.objectStore("searchIndex")
      const request = store.put(searchIndex)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  static async searchDocuments(query: string, language?: string): Promise<string[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchIndex"], "readonly")
      const store = transaction.objectStore("searchIndex")
      const termIndex = store.index("term")

      const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean)
      const documentScores = new Map<string, number>()

      let completedSearches = 0
      const totalSearches = searchTerms.length

      if (totalSearches === 0) {
        resolve([])
        return
      }

      searchTerms.forEach((term) => {
        const request = termIndex.openCursor(IDBKeyRange.only(term))

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            const index: SearchIndex = cursor.value
            if (!language || index.language === language) {
              const currentScore = documentScores.get(index.documentId) || 0
              documentScores.set(index.documentId, currentScore + index.frequency)
            }
            cursor.continue()
          } else {
            completedSearches++
            if (completedSearches === totalSearches) {
              // Sort by score and return document IDs
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

  static async saveSettings(settings: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key: "appSettings", value: settings })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  static async getSettings(): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get("appSettings")

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result?.value || null)
      }
    })
  }

  static async getStorageUsage(): Promise<{ used: number; quota: number }> {
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

    // Fallback for browsers that don't support storage estimation
    return { used: 0, quota: 0 }
  }

  static async exportData(): Promise<any> {
    if (!this.db) await this.init()

    const documents = await this.getAllFromStore("documents")
    const folders = await this.getAllFromStore("folders")
    const settings = await this.getSettings()

    return {
      documents,
      folders,
      settings,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }
  }

  static async importData(data: any): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(["documents", "folders", "settings"], "readwrite")

    // Clear existing data
    await this.clearStore("documents")
    await this.clearStore("folders")

    // Import new data
    if (data.documents) {
      const documentsStore = transaction.objectStore("documents")
      for (const doc of data.documents) {
        documentsStore.add(doc)
      }
    }

    if (data.folders) {
      const foldersStore = transaction.objectStore("folders")
      for (const folder of data.folders) {
        foldersStore.add(folder)
      }
    }

    if (data.settings) {
      await this.saveSettings(data.settings)
    }
  }

  static async clearDatabase(): Promise<void> {
    if (!this.db) await this.init()

    await this.clearStore("documents")
    await this.clearStore("folders")
    await this.clearStore("settings")
    await this.clearStore("searchIndex")
  }

  private static async getAllFromStore(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  private static async clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // Search indexing methods
  static async indexDocument(document: any): Promise<void> {
    if (!this.db) await this.init()

    const words = this.extractWords(document.ocrText + " " + document.content)
    const transaction = this.db!.transaction(["searchIndex"], "readwrite")
    const store = transaction.objectStore("searchIndex")

    // Clear existing index for this document
    const deleteRequest = store.index("documentId").openCursor(IDBKeyRange.only(document.id))
    deleteRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    // Add new index entries
    words.forEach((word, index) => {
      const indexEntry = {
        id: `${document.id}_${index}`,
        documentId: document.id,
        term: word.toLowerCase(),
        frequency: 1,
        position: [index],
        language: document.language || "eng",
      }
      store.add(indexEntry)
    })
  }

  static async searchIndex(query: string): Promise<string[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchIndex"], "readonly")
      const store = transaction.objectStore("searchIndex")
      const index = store.index("term")
      const request = index.getAll(IDBKeyRange.bound(query.toLowerCase(), query.toLowerCase() + "\uffff"))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result
        const documentIds = [...new Set(results.map((r) => r.documentId))]
        resolve(documentIds)
      }
    })
  }

  private static extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  }
}
