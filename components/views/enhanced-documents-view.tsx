"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  FileText,
  Search,
  Grid,
  List,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  Tag,
  ImageIcon,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
  Languages,
  SortAsc,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EnhancedOCRService } from "../../services/enhanced-ocr-service"
import { DocumentStore } from "../../store/document-store"
import { DocumentViewerModal } from "../document-viewer-modal"
import type { AppState, Document } from "../../types"

interface DocumentsViewProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function DocumentsView({ state, updateState }: DocumentsViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string>("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["eng"])
  const [showUpload, setShowUpload] = useState(false)
  const [processingFiles, setProcessingFiles] = useState<Map<string, { progress: number; status: string }>>(new Map())
  const [newTags, setNewTags] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    EnhancedOCRService.initialize().catch(console.error)
  }, [])

  const filteredDocuments = state.documents
    .filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.ocrText.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFolder = selectedFolder === "all" || doc.folderId === selectedFolder
      const matchesTag = selectedTag === "all" || doc.tags.includes(selectedTag)
      return matchesSearch && matchesFolder && matchesTag
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "date":
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
          break
        case "size":
          comparison = a.size - b.size
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return

      const fileArray = Array.from(files)
      const validFiles = fileArray.filter((file) => {
        const validTypes = [
          "image/png",
          "image/jpeg",
          "image/jpg",
          "image/gif",
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

      if (validFiles.length === 0) return

      for (const file of validFiles) {
        const fileId = `${file.name}-${Date.now()}-${Math.random()}`

        setProcessingFiles((prev) => new Map(prev.set(fileId, { progress: 0, status: "Starting OCR..." })))

        try {
          const { text: ocrText, language } = await EnhancedOCRService.extractText(
            file,
            selectedLanguages,
            (progress) => {
              setProcessingFiles(
                (prev) =>
                  new Map(
                    prev.set(fileId, {
                      progress,
                      status: progress < 100 ? `Processing OCR... ${progress}%` : "Finalizing...",
                    }),
                  ),
              )
            },
          )

          const tags = newTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)

          const autoTags = []
          if (file.type.startsWith("image/")) autoTags.push("image")
          if (file.type === "application/pdf") autoTags.push("pdf")
          if (file.name.toLowerCase().includes("invoice")) autoTags.push("invoice", "finance")
          if (file.name.toLowerCase().includes("contract")) autoTags.push("contract", "legal")
          if (file.name.toLowerCase().includes("report")) autoTags.push("report", "analysis")

          const allTags = [...new Set([...tags, ...autoTags, "uploaded", new Date().getFullYear().toString()])]

          const newDoc = {
            name: file.name.replace(/\.[^/.]+$/, ""),
            originalName: file.name,
            type: file.type.startsWith("image/")
              ? ("image" as const)
              : file.type === "application/pdf"
                ? ("pdf" as const)
                : file.name.endsWith(".doc") || file.name.endsWith(".docx")
                  ? ("doc" as const)
                  : ("text" as const),
            size: file.size,
            content: `Uploaded file: ${file.name}`,
            ocrText,
            tags: allTags,
            folderId: selectedFolder === "all" ? null : selectedFolder,
            isProcessing: false,
            processingProgress: 100,
            language,
          }

          setProcessingFiles((prev) => new Map(prev.set(fileId, { progress: 100, status: "Completed!" })))

          const addedDoc = DocumentStore.addDocument(newDoc)

          // Index the document for search
          await EnhancedOCRService.indexDocument(addedDoc.id, ocrText, language)

          setTimeout(() => {
            setProcessingFiles((prev) => {
              const newMap = new Map(prev)
              newMap.delete(fileId)
              return newMap
            })
          }, 2000)
        } catch (error) {
          console.error("Failed to process file:", error)
          setProcessingFiles((prev) => new Map(prev.set(fileId, { progress: 0, status: "Failed to process" })))

          setTimeout(() => {
            setProcessingFiles((prev) => {
              const newMap = new Map(prev)
              newMap.delete(fileId)
              return newMap
            })
          }, 3000)
        }
      }

      setNewTags("")
    },
    [selectedFolder, newTags, selectedLanguages],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files)
      }
    },
    [handleFileUpload],
  )

  const getFileIcon = (doc: Document) => {
    switch (doc.type) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-green-600" />
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      default:
        return <File className="h-5 w-5 text-blue-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const supportedLanguages = EnhancedOCRService.getSupportedLanguages()

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage your document library with advanced OCR processing</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        {/* Upload Area */}
        {showUpload && (
          <Card className="mb-8 border-2 border-dashed border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Documents with Multi-Language OCR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="folder-select">Target Folder</Label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select folder (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Root Folder</SelectItem>
                        {state.folders
                          .filter((f) => f.id !== "root")
                          .map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags-input">Tags (comma-separated)</Label>
                    <Input
                      id="tags-input"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="business, important, contract"
                    />
                  </div>
                  <div>
                    <Label>OCR Languages</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {supportedLanguages.slice(0, 3).map((lang) => (
                        <div key={lang.code} className="flex items-center space-x-2">
                          <Checkbox
                            id={lang.code}
                            checked={selectedLanguages.includes(lang.code)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLanguages([...selectedLanguages, lang.code])
                              } else {
                                setSelectedLanguages(selectedLanguages.filter((l) => l !== lang.code))
                              }
                            }}
                          />
                          <Label htmlFor={lang.code} className="text-sm">
                            {lang.nativeName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {dragActive ? "Drop files here!" : "Drop files here or click to upload"}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Supports PDF, DOC, DOCX, PNG, JPG, GIF (Max 10MB each)</p>
                  <p className="text-xs text-blue-600 mb-4">
                    <Languages className="h-3 w-3 inline mr-1" />
                    Multi-language OCR:{" "}
                    {selectedLanguages
                      .map((code) => supportedLanguages.find((l) => l.code === code)?.nativeName)
                      .join(", ")}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.txt"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Choose Files
                    </label>
                  </Button>
                </div>

                {processingFiles.size > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing Files with OCR
                    </h4>
                    {Array.from(processingFiles.entries()).map(([fileId, { progress, status }]) => (
                      <div key={fileId} className="space-y-2 p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {progress === 100 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : progress === 0 && status.includes("Failed") ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {status}
                          </span>
                          <span
                            className={
                              progress === 100
                                ? "text-green-600 font-medium"
                                : progress === 0 && status.includes("Failed")
                                  ? "text-red-600 font-medium"
                                  : "text-blue-600"
                            }
                          >
                            {progress}%
                          </span>
                        </div>
                        <Progress
                          value={progress}
                          className={`h-2 ${
                            progress === 100
                              ? "[&>div]:bg-green-500"
                              : progress === 0 && status.includes("Failed")
                                ? "[&>div]:bg-red-500"
                                : "[&>div]:bg-blue-500"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents, OCR text, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {state.folders
                  .filter((f) => f.id !== "root")
                  .map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {state.tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.name}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: "name" | "date" | "size") => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
              <SortAsc className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
            </Button>
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedFolder !== "all" || selectedTag !== "all" || searchTerm) && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Active filters:</span>
            {selectedFolder !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Folder: {state.folders.find((f) => f.id === selectedFolder)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedFolder("all")} />
              </Badge>
            )}
            {selectedTag !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Tag: {selectedTag}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTag("all")} />
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
              </Badge>
            )}
          </div>
        )}

        {/* Documents Grid/List */}
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 text-center mb-6">
                {searchTerm || selectedFolder !== "all" || selectedTag !== "all"
                  ? "Try adjusting your search criteria or upload new documents."
                  : "Upload your first document to get started with OCR processing."}
              </p>
              <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(doc)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(doc.size)} • {doc.updatedAt.toLocaleDateString()}
                        </p>
                        {doc.language && (
                          <p className="text-xs text-blue-600 mt-1">
                            <Languages className="h-3 w-3 inline mr-1" />
                            {supportedLanguages.find((l) => l.code === doc.language)?.nativeName || doc.language}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingDocument(doc)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Tag className="h-4 w-4 mr-2" />
                          Edit Tags
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => DocumentStore.deleteDocument(doc.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {doc.ocrText && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 border">
                      <p className="text-sm text-gray-600 line-clamp-3">{doc.ocrText.substring(0, 150)}...</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{doc.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {doc.isProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-600 flex items-center">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Processing OCR...
                        </span>
                        <span>{doc.processingProgress}%</span>
                      </div>
                      <Progress value={doc.processingProgress} className="h-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Document Viewer Modal */}
        <DocumentViewerModal document={viewingDocument} onClose={() => setViewingDocument(null)} />
      </div>
    </ScrollArea>
  )
}
