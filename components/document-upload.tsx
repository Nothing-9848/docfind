"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileText, ImageIcon, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { EnhancedOCRService } from "../services/enhanced-ocr-service"
import { DocumentStore } from "../store/document-store"
import type { Document } from "../types/document"

interface DocumentUploadProps {
  onUploadComplete: (document: Document) => void
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [processingFiles, setProcessingFiles] = useState<string[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9)
    setProcessingFiles((prev) => [...prev, fileId])

    // Simulate upload progress
    // for (let i = 0; i <= 100; i += 10) {
    //   setUploadProgress((prev) => ({ ...prev, [fileId]: i }))
    //   await new Promise((resolve) => setTimeout(resolve, 100))
    // }

    try {
      // Process OCR with progress tracking
      const ocrResult = await EnhancedOCRService.processDocument(
        file,
        "eng", // Default to English, can be made configurable
        (progress) => {
          setUploadProgress((prev) => ({ ...prev, [fileId]: progress }))
        },
      )

      // Create document object
      const document: Document = {
        id: fileId,
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "text",
        size: file.size,
        uploadDate: new Date(),
        tags: [],
        ocrText: ocrResult.text,
        url: URL.createObjectURL(file),
        status: "completed",
      }

      DocumentStore.addDocument(document)
      onUploadComplete(document)
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setProcessingFiles((prev) => prev.filter((id) => id !== fileId))
      setUploadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[fileId]
        return newProgress
      })
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    files.forEach(processFile)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(processFile)
  }, [])

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "bmp"].includes(extension || "")) {
      return <ImageIcon className="w-4 h-4" />
    } else if (extension === "pdf") {
      return <FileText className="w-4 h-4" />
    } else {
      return <File className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</p>
          <p className="text-sm text-gray-500 mb-4">Supports PDF, images, and text files</p>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.gif,.txt,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </CardContent>
      </Card>

      {processingFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Processing Files</h3>
          {processingFiles.map((fileId) => (
            <div key={fileId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{uploadProgress[fileId] || 0}%</span>
              </div>
              <Progress value={uploadProgress[fileId] || 0} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
