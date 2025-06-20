"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, FileText, ImageIcon, File, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { EnhancedOCRService } from "../services/enhanced-ocr-service"
import { DocumentStore } from "../store/document-store"
import type { Document } from "../types"

interface DocumentUploadProps {
  onUploadComplete?: (document: Document) => void
  selectedFolderId?: string | null
}

interface ProcessingFile {
  id: string
  name: string
  progress: number
  status: "uploading" | "processing" | "completed" | "error"
  error?: string
}

export function DocumentUpload({ onUploadComplete, selectedFolderId }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const updateFileProgress = (fileId: string, updates: Partial<ProcessingFile>) => {
    setProcessingFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, ...updates } : file)))
  }

  const removeProcessingFile = (fileId: string) => {
    setTimeout(() => {
      setProcessingFiles((prev) => prev.filter((file) => file.id !== fileId))
    }, 2000) // Remove after 2 seconds to show completion
  }

  const processFile = async (file: File) => {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Add to processing files
    const processingFile: ProcessingFile = {
      id: fileId,
      name: file.name,
      progress: 0,
      status: "uploading",
    }

    setProcessingFiles((prev) => [...prev, processingFile])

    try {
      // Simulate upload progress
      updateFileProgress(fileId, { status: "uploading", progress: 20 })
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Start OCR processing
      updateFileProgress(fileId, { status: "processing", progress: 40 })

      const ocrResult = await EnhancedOCRService.processDocument(
        file,
        "eng", // Default language, can be made configurable
        (progress) => {
          updateFileProgress(fileId, { progress: 40 + progress * 0.6 }) // 40% + 60% for OCR
        },
      )

      updateFileProgress(fileId, { progress: 100, status: "completed" })

      // Determine document type
      const getDocumentType = (file: File): Document["type"] => {
        if (file.type.startsWith("image/")) return "image"
        if (file.type === "application/pdf") return "pdf"
        if (file.type.includes("document") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) return "doc"
        return "text"
      }

      // Create document object with proper structure
      const newDocument = {
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for display name
        originalName: file.name,
        type: getDocumentType(file),
        size: file.size,
        content: ocrResult.text.substring(0, 500), // First 500 chars as preview
        ocrText: ocrResult.text,
        tags: ocrResult.suggestedTags || [],
        folderId: selectedFolderId || "root",
        isProcessing: false,
        processingProgress: 100,
        url: URL.createObjectURL(file),
        language: ocrResult.language || "eng",
      }

      console.log("Adding document to store:", newDocument)

      // Add to document store
      const addedDocument = DocumentStore.addDocument(newDocument)

      console.log("Document added successfully:", addedDocument)

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(addedDocument)
      }

      // Remove from processing files after showing success
      removeProcessingFile(fileId)
    } catch (error) {
      console.error("Error processing file:", error)
      updateFileProgress(fileId, {
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      })
      removeProcessingFile(fileId)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      files.forEach(processFile)
    },
    [selectedFolderId],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      files.forEach(processFile)
      // Clear the input so the same file can be selected again
      e.target.value = ""
    },
    [selectedFolderId],
  )

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension || "")) {
      return <ImageIcon className="w-4 h-4 text-green-600" />
    } else if (extension === "pdf") {
      return <FileText className="w-4 h-4 text-red-600" />
    } else {
      return <File className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusIcon = (status: ProcessingFile["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: ProcessingFile["status"]) => {
    switch (status) {
      case "uploading":
        return "bg-blue-500"
      case "processing":
        return "bg-yellow-500"
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
            Drag and drop files here, or click to browse. Supports PDF, images, and text documents with OCR processing.
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
          <p className="text-xs text-gray-400 mt-3">Maximum file size: 10MB per file</p>
        </CardContent>
      </Card>

      {processingFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Processing Files ({processingFiles.length})
            </h3>
            <div className="space-y-4">
              {processingFiles.map((file) => (
                <div key={file.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(file.name)}
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
                  <Progress value={file.progress} className={`h-2 ${file.status === "error" ? "bg-red-100" : ""}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
