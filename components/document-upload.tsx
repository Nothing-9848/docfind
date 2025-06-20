"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, FileText, ImageIcon, File, CheckCircle, AlertCircle, X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EnhancedOCRService } from "../services/enhanced-ocr-service"
import { DocumentStore } from "../store/document-store"
import type { Document } from "../types"

interface DocumentUploadProps {
  onUploadComplete?: (document: Document) => void
  selectedFolderId?: string | null
}

interface StagedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  preview?: string
}

interface ProcessingFile extends StagedFile {
  progress: number
  status: "waiting" | "processing" | "completed" | "error"
  error?: string
  ocrResult?: { text: string; language: string; suggestedTags: string[] }
}

export function DocumentUpload({ onUploadComplete, selectedFolderId }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([])
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const addFilesToStaging = (files: File[]) => {
    const newStagedFiles: StagedFile[] = files.map((file) => ({
      id: `staged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))

    setStagedFiles((prev) => [...prev, ...newStagedFiles])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported format`)
        return false
      }

      if (file.size > maxSize) {
        alert(`File ${file.name} is too large (max 10MB)`)
        return false
      }

      return true
    })

    if (files.length > 0) {
      addFilesToStaging(files)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => {
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!validTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported format`)
        return false
      }

      if (file.size > maxSize) {
        alert(`File ${file.name} is too large (max 10MB)`)
        return false
      }

      return true
    })

    if (files.length > 0) {
      addFilesToStaging(files)
    }

    // Clear the input
    e.target.value = ""
  }, [])

  const removeStagedFile = (fileId: string) => {
    setStagedFiles((prev) => prev.filter((file) => file.id !== fileId))
  }

  const clearAllStaged = () => {
    setStagedFiles([])
  }

  const updateProcessingFile = (fileId: string, updates: Partial<ProcessingFile>) => {
    setProcessingFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, ...updates } : file)))
  }

  const processAllFiles = async () => {
    if (stagedFiles.length === 0) return

    setIsProcessing(true)

    // Move staged files to processing
    const filesToProcess: ProcessingFile[] = stagedFiles.map((staged) => ({
      ...staged,
      progress: 0,
      status: "waiting" as const,
    }))

    setProcessingFiles(filesToProcess)
    setStagedFiles([]) // Clear staged files

    // Process each file
    for (const file of filesToProcess) {
      try {
        updateProcessingFile(file.id, { status: "processing", progress: 10 })

        const ocrResult = await EnhancedOCRService.processDocument(
          file.file,
          "eng", // Default language
          (progress) => {
            updateProcessingFile(file.id, { progress: 10 + progress * 0.8 }) // 10% + 80% for OCR
          },
        )

        updateProcessingFile(file.id, {
          progress: 90,
          ocrResult,
        })

        // Determine document type
        const getDocumentType = (file: File): Document["type"] => {
          if (file.type.startsWith("image/")) return "image"
          if (file.type === "application/pdf") return "pdf"
          if (file.type.includes("document") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) return "doc"
          return "text"
        }

        // Create document object
        const newDocument = {
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          originalName: file.name,
          type: getDocumentType(file.file),
          size: file.size,
          content: file.ocrResult?.text.substring(0, 500),
          ocrText: file.ocrResult?.text,
          tags: file.ocrResult?.suggestedTags || [],
          folderId: selectedFolderId || "root",
          isProcessing: false,
          processingProgress: 100,
          url: URL.createObjectURL(file.file),
          language: file.ocrResult?.language || "eng",
        }

        // Add to document store
        const addedDocument = DocumentStore.addDocument(newDocument)

        updateProcessingFile(file.id, {
          progress: 100,
          status: "completed",
        })

        // Call completion callback
        if (onUploadComplete) {
          onUploadComplete(addedDocument)
        }

        console.log("Document processed and added:", addedDocument)
      } catch (error) {
        console.error("Error processing file:", error)
        updateProcessingFile(file.id, {
          status: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        })
      }
    }

    setIsProcessing(false)

    // Clear processing files after 3 seconds
    setTimeout(() => {
      setProcessingFiles([])
    }, 3000)
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-green-600" />
    } else if (type === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-600" />
    } else {
      return <File className="w-5 h-5 text-blue-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: ProcessingFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case "processing":
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
    }
  }

  const getStatusColor = (status: ProcessingFile["status"]) => {
    switch (status) {
      case "waiting":
        return "bg-gray-500"
      case "processing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragging ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? "bg-blue-100" : "bg-gray-100"}`}>
            <Upload className={`w-8 h-8 transition-colors ${isDragging ? "text-blue-600" : "text-gray-400"}`} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isDragging ? "Drop files here" : "Upload Documents"}
          </h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            Drag and drop files here, or click to browse. Files will be staged for review before processing.
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button asChild size="lg" className="min-w-[140px]">
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
          <p className="text-xs text-gray-400 mt-3">Supported: PDF, Images, DOC, DOCX, TXT • Max: 10MB per file</p>
        </CardContent>
      </Card>

      {/* Staged Files */}
      {stagedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Staged Files ({stagedFiles.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearAllStaged}>
                  Clear All
                </Button>
                <Button onClick={processAllFiles} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Proceed with Upload
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-60">
              <div className="space-y-3">
                {stagedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.type.split("/")[1].toUpperCase()} • {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeStagedFile(file.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Ready to process:</strong> {stagedFiles.length} file(s) will be processed with OCR and added to
                your document library. Click "Proceed with Upload" to start.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Files */}
      {processingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {isProcessing ? "Processing Files" : "Processing Complete"} ({processingFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processingFiles.map((file) => (
                <div key={file.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className={`text-xs text-white ${getStatusColor(file.status)}`}>
                            {file.status}
                          </Badge>
                          {file.error && <span className="text-xs text-red-600">{file.error}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">{file.progress}%</span>
                      {getStatusIcon(file.status)}
                    </div>
                  </div>
                  <Progress
                    value={file.progress}
                    className={`h-2 ${file.status === "error" ? "[&>div]:bg-red-500" : ""}`}
                  />
                  {file.ocrResult && file.status === "completed" && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <p className="text-green-800">
                        <strong>OCR Complete:</strong> Extracted {file.ocrResult.text.length} characters
                        {file.ocrResult.suggestedTags.length > 0 && (
                          <span> • Tags: {file.ocrResult.suggestedTags.join(", ")}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
