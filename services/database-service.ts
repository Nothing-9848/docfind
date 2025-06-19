import type { Document, Folder, Tag, SearchIndex, AppState } from "../types"

interface DatabaseSchema {
  documents: Document[]
  folders: Folder[]
  tags: Tag[]
  searchIndex: SearchIndex[]
  settings: AppState["settings"]
}

export class DatabaseService {
  private static dbName = "DocuFlowProDB"
  private static version = 1
  private static db: IDBDatabase | null = null
  private static isInitialized = false

  static async initialize(): Promise<void> {
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
          documentsStore.createIndex("folderId", "folderId", { unique: false })
          documentsStore.createIndex("tags", "tags", { unique: false, multiEntry: true })
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
          searchStore.createIndex("documentId", "documentId", { unique: false })
          searchStore.createIndex("term", "term", { unique: false })
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

  static async saveSettings(settings: AppState["settings"]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite")
      const store = transaction.objectStore("settings")
      const request = store.put({ key: "appSettings", ...settings })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  static async getSettings(): Promise<AppState["settings"] | null> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly")
      const store = transaction.objectStore("settings")
      const request = store.get("appSettings")

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          const { key, ...settings } = result
          resolve(settings)
        } else {
          resolve(null)
        }
      }
    })
  }

  static async exportData(): Promise<DatabaseSchema> {
    const [documents, folders, tags, searchIndex, settings] = await Promise.all([
      this.getDocuments(),
      this.getFolders(),
      this.getTags(),
      this.getSearchIndex(),
      this.getSettings(),
    ])

    return {
      documents,
      folders,
      tags,
      searchIndex,
      settings: settings || {
        ocrLanguages: ["eng", "hin", "tel"],
        defaultLanguage: "eng",
        storageLocation: "browser",
        autoBackup: true,
      },
    }
  }

  static async importData(data: Partial<DatabaseSchema>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const transaction = this.db.transaction(["documents", "folders", "tags", "searchIndex", "settings"], "readwrite")

    try {
      if (data.documents) {
        const docStore = transaction.objectStore("documents")
        for (const doc of data.documents) {
          await new Promise<void>((resolve, reject) => {
            const request = docStore.put(doc)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }

      if (data.folders) {
        const folderStore = transaction.objectStore("folders")
        for (const folder of data.folders) {
          await new Promise<void>((resolve, reject) => {
            const request = folderStore.put(folder)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }

      if (data.tags) {
        const tagStore = transaction.objectStore("tags")
        for (const tag of data.tags) {
          await new Promise<void>((resolve, reject) => {
            const request = tagStore.put(tag)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }

      if (data.searchIndex) {
        const searchStore = transaction.objectStore("searchIndex")
        for (const index of data.searchIndex) {
          await new Promise<void>((resolve, reject) => {
            const request = searchStore.put(index)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        }
      }

      if (data.settings) {
        const settingsStore = transaction.objectStore("settings")
        await new Promise<void>((resolve, reject) => {
          const request = settingsStore.put({ key: "appSettings", ...data.settings })
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    } catch (error) {
      transaction.abort()
      throw error
    }
  }

  private static async getSearchIndex(): Promise<SearchIndex[]> {
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["searchIndex"], "readonly")
      const store = transaction.objectStore("searchIndex")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  static async clearDatabase(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const transaction = this.db.transaction(["documents", "folders", "tags", "searchIndex", "settings"], "readwrite")

    const stores = ["documents", "folders", "tags", "searchIndex", "settings"]

    return new Promise((resolve, reject) => {
      let completed = 0

      stores.forEach((storeName) => {
        const store = transaction.objectStore(storeName)
        const request = store.clear()

        request.onsuccess = () => {
          completed++
          if (completed === stores.length) {
            resolve()
          }
        }

        request.onerror = () => reject(request.error)
      })
    })
  }

  static async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    }
    return { used: 0, quota: 0 }
  }
}
