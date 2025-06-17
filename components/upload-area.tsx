"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, ImageIcon, X, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface UploadAreaProps {
  documents: any[]
  setDocuments: (docs: any[]) => void
}

export function UploadArea({ documents, setDocuments }: UploadAreaProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  // Simulate OCR processing
  const performOCR = async (file: File): Promise<string> => {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock OCR results based on file type
    if (file.type.includes("image")) {
      return `OCR extracted text from ${file.name}:\n\nThis is sample text extracted from the image. In a real implementation, this would use an OCR service like Tesseract.js or a cloud OCR API to extract actual text from images.`
    } else if (file.type.includes("pdf")) {
      return `Text extracted from PDF ${file.name}:\n\nThis is sample content from a PDF document. In a real implementation, this would use PDF parsing libraries to extract text content.`
    } else {
      return `Content from ${file.name}:\n\nThis is sample text content. In a real implementation, this would process the actual file content.`
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles)
    setIsProcessing(true)

    try {
      // Process first file for demo
      if (acceptedFiles.length > 0) {
        const text = await performOCR(acceptedFiles[0])
        setExtractedText(text)

        // Auto-generate tags based on filename and content
        const autoTags = [
          acceptedFiles[0].type.includes("image") ? "image" : "document",
          "uploaded",
          new Date().getFullYear().toString(),
        ]
        setTags(autoTags)
      }
    } catch (error) {
      console.error("OCR processing failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  })

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSave = () => {
    if (uploadedFiles.length > 0) {
      const newDoc = {
        id: Date.now().toString(),
        title: uploadedFiles[0].name,
        content: extractedText,
        tags: tags,
        createdAt: new Date(),
        size: `${(uploadedFiles[0].size / 1024 / 1024).toFixed(1)} MB`,
        type: uploadedFiles[0].type.split("/")[1],
      }

      setDocuments([newDoc, ...documents])

      // Reset form
      setUploadedFiles([])
      setExtractedText("")
      setTags([])
      setNewTag("")
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
        <p className="text-gray-600">Upload and process documents with automatic OCR text extraction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">Drag & drop files here, or click to select</p>
                  <p className="text-sm text-gray-500">Supports PDF, DOC, DOCX, PNG, JPG, GIF</p>
                </div>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Uploaded Files:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OCR Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              OCR Text Extraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Processing document...</span>
              </div>
            ) : extractedText ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="extracted-text">Extracted Text</Label>
                  <textarea
                    id="extracted-text"
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
                    placeholder="Extracted text will appear here..."
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="tags"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                  Save Document
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Upload a document to see OCR results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
