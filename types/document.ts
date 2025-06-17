export interface Document {
  id: string
  name: string
  type: "pdf" | "image" | "text"
  size: number
  uploadDate: Date
  tags: string[]
  ocrText?: string
  thumbnail?: string
  url: string
  status: "processing" | "completed" | "failed"
}

export interface Tag {
  id: string
  name: string
  color: string
  count: number
}
