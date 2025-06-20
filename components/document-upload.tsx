"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Upload, FileText, ImageIcon, File, CheckCircle, AlertCircle, X } from "lucide-react"
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
  onClose?: () => void
}

interface ProcessingFile {
  id: string
  name: string
  progress: number
  status: "uploading" | "processing" | "completed" | "error"
  error?: string
}

export function DocumentUpload({ onUploadComplete, selectedFolderId, onClose }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([])

  // Auto-close when all files are processed
  useEffect(() => {
    if (
      processingFiles.length > 0 &&
      processingFiles.every((file) => file.status === "completed" || file.status === "error")
    ) {
      const timer = setTimeout(() => {
        if (onClose) {
          onClose()
        }
      }, 2000) // Auto-close after 2 seconds when all files are done

      return () => clearTimeout(timer)
    }
  }, [processingFiles, onClose])

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

  const processFile = async (file: File) => {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Validate file
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (file.size > maxSize) {
      console.error(`File ${file.name} is too large (${file.size} bytes, max ${maxSize})`)
      return
    }

    if (!allowedTypes.includes(file.type)) {
      console.error(`File ${file.name} has unsupported type: ${file.type}`)
      return
    }

    // Add to processing files immediately
    const processingFile: ProcessingFile = {
      id: fileId,
      name: file.name,
      progress: 0,
      status: "uploading",
    }

    setProcessingFiles((prev) => [...prev, processingFile])
    console.log(`Starting upload process for: ${file.name}`)

    try {
      // Start processing immediately - no waiting
      updateFileProgress(fileId, { status: "uploading", progress: 10 })

      // Small delay to show upload status
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Start OCR processing
      updateFileProgress(fileId, { status: "processing", progress: 20 })
      console.log(`Starting OCR processing for: ${file.name}`)

      const ocrResult = await EnhancedOCRService.processDocument(
        file,
        "eng", // Default language
        (progress) => {
          const adjustedProgress = 20 + progress * 0.7 // 20% + 70% for OCR
          updateFileProgress(fileId, { progress: adjustedProgress })
        },
      )

      updateFileProgress(fileId, { progress: 95, status: "processing" })
      console.log(`OCR completed for: ${file.name}`, ocrResult)

      // Determine document type
      const getDocumentType = (file: File): Document["type"] => {
        if (file.type.startsWith("image/")) return "image"
        if (file.type === "application/pdf") return "pdf"
        if (file.type.includes("document") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) return "doc"
        return "text"
      }

      // Generate auto-tags based on content and filename
      const generateAutoTags = (filename: string, ocrText: string): string[] => {
        const tags: string[] = []
        const lowerName = filename.toLowerCase()
        const lowerText = ocrText.toLowerCase()

        // File type tags
        if (file.type.startsWith("image/")) tags.push("image")
        if (file.type === "application/pdf") tags.push("pdf")

        // Content-based tags
        if (lowerName.includes("invoice") || lowerText.includes("invoice")) tags.push("invoice", "finance")
        if (lowerName.includes("contract") || lowerText.includes("contract")) tags.push("contract", "legal")
        if (lowerName.includes("report") || lowerText.includes("report")) tags.push("report")
        if (lowerName.includes("receipt") || lowerText.includes("receipt")) tags.push("receipt", "finance")
        if (lowerText.includes("business plan")) tags.push("business", "planning")

        // Always add upload date and uploaded tag
        tags.push("uploaded", new Date().getFullYear().toString())

        return [...new Set(tags)] // Remove duplicates
      }

      // Create document object
      const autoTags = generateAutoTags(file.name, ocrResult.text)
      const newDocument = {
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        originalName: file.name,
        type: getDocumentType(file),
        size: file.size,
        content: ocrResult.text.substring(0, 500), // Preview
        ocrText: ocrResult.text,
        tags: [...autoTags, ...(ocrResult.suggestedTags || [])],
        folderId: selectedFolderId || null,
        isProcessing: false,
        processingProgress: 100,
        url: URL.createObjectURL(file),
        language: ocrResult.language || "eng",
      }

      console.log("Creating document:", newDocument)

      // Add to document store
      const addedDocument = DocumentStore.addDocument(newDocument)
      console.log("Document added to store:", addedDocument.id)

      // Mark as completed
      updateFileProgress(fileId, { status: "completed", progress: 100 })

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(addedDocument)
      }

      console.log(`Upload completed successfully for: ${file.name}`)
    } catch (error) {
      console.error("Error processing file:", error)
      updateFileProgress(fileId, {
        status: "error",
        progress: 0,
        error: error instanceof Error ? error.message : "Processing failed",
      })
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      console.log(`Dropped ${files.length} files, starting immediate processing`)

      // Process all files immediately
      files.forEach(processFile)
    },
    [selectedFolderId],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      console.log(`Selected ${files.length} files, starting immediate processing`)

      // Process all files immediately
      files.forEach(processFile)

      // Clear input
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

  const getStatusText = (status: ProcessingFile["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Processing OCR..."
      case "completed":
        return "Completed!"
      case "error":
        return "Failed"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      {/* Close button */}
      {onClose && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

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
            {isDragging ? "Drop files here!" : "Upload Documents"}
          </h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            Files will be processed automatically with OCR. Supports PDF, images, and documents up to 10MB.
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload-auto"
          />
          <Button asChild size="lg" className="min-w-[140px]">
            <label htmlFor="file-upload-auto" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
          <p className="text-xs text-gray-400 mt-3">Processing starts immediately - no waiting required!</p>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Processing Files ({processingFiles.length})
              </h3>
              {processingFiles.every((f) => f.status === "completed") && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  All Complete!
                </Badge>
              )}
            </div>
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
                            {getStatusText(file.status)}
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

            {processingFiles.every((f) => f.status === "completed" || f.status === "error") && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 text-center">
                  ✅ Upload complete! Your documents are now available in the library.
                  {onClose && " This dialog will close automatically."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
