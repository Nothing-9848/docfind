import { EmbeddedDatabase } from "../services/embedded-database"
import { PDFService } from "../services/pdf-service"

export interface Document {
  id: string
  title: string
  content: string
  ocrText: string
  createdAt: Date
  updatedAt: Date
}

class DocumentStore {
  private static instance: DocumentStore

  private constructor() {}

  public static getInstance(): DocumentStore {
    if (!DocumentStore.instance) {
      DocumentStore.instance = new DocumentStore()
    }

    return DocumentStore.instance
  }

  async createDocument(title: string, content: string): Promise<Document> {
    const db = EmbeddedDatabase.getInstance()
    const document: Document = {
      id: crypto.randomUUID(),
      title: title,
      content: content,
      ocrText: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.saveDocument(document)
    await db.indexDocument(document)

    return document
  }

  async updateDocument(id: string, title: string, content: string): Promise<Document | null> {
    const db = EmbeddedDatabase.getInstance()
    let document = await db.getDocument(id)

    if (!document) {
      return null
    }

    document = {
      ...document,
      title: title,
      content: content,
      updatedAt: new Date(),
    }

    await db.saveDocument(document)
    await db.indexDocument(document)

    return document
  }

  async getDocument(id: string): Promise<Document | null> {
    const db = EmbeddedDatabase.getInstance()
    return await db.getDocument(id)
  }

  async deleteDocument(id: string): Promise<boolean> {
    const db = EmbeddedDatabase.getInstance()
    await db.deleteDocument(id)
    return true
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const db = EmbeddedDatabase.getInstance()
    return await db.searchDocuments(query)
  }

  async getAllDocuments(): Promise<Document[]> {
    const db = EmbeddedDatabase.getInstance()
    return await db.getAllDocuments()
  }

  async uploadDocument(file: File): Promise<void> {
    const db = EmbeddedDatabase.getInstance()
    const document: Document = {
      id: crypto.randomUUID(),
      title: file.name,
      content: "",
      ocrText: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Store the file blob
    await db.saveBlob(document.id, file)

    // Extract text from PDF if applicable
    if (file.type === "application/pdf") {
      try {
        const extractedText = await PDFService.extractTextFromPDF(file)
        document.content = extractedText
        document.ocrText = extractedText
      } catch (error) {
        console.error("Failed to extract PDF text:", error)
      }
    }

    // Save document and index it
    await db.saveDocument(document)
    await db.indexDocument(document)
  }

  async getDocumentBlob(documentId: string): Promise<Blob | null> {
    const db = EmbeddedDatabase.getInstance()
    return await db.getBlob(documentId)
  }
}

export const documentStore = DocumentStore.getInstance()
