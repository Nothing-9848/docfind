"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DocumentStore } from "../../store/document-store"
import { OCRService } from "../../services/ocr-service"
import type { AppState, Document } from "../../types"

interface DocumentsViewProps {
  state: AppState
}

export function DocumentsView({ state }: DocumentsViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string>("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [processingFiles, setProcessingFiles] = useState<Map<string, number>>(new Map())
  const [newTags, setNewTags] = useState<string>("")

  const filteredDocuments = state.documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.ocrText.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFolder = selectedFolder === "all" || doc.folderId === selectedFolder
    const matchesTag = selectedTag === "all" || doc.tags.includes(selectedTag)
    return matchesSearch && matchesFolder && matchesTag
  })

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return

      const fileArray = Array.from(files)
      setUploadFiles(fileArray)

      for (const file of fileArray) {
        const fileId = `${file.name}-${Date.now()}`
        setProcessingFiles((prev) => new Map(prev.set(fileId, 0)))

        try {
          const ocrText = await OCRService.extractText(file, (progress) => {
            setProcessingFiles((prev) => new Map(prev.set(fileId, progress)))
          })

          const tags = newTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)

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
            tags: [...tags, "uploaded", new Date().getFullYear().toString()],
            folderId: selectedFolder || null,
            isProcessing: false,
            processingProgress: 100,
          }

          DocumentStore.addDocument(newDoc)
          setProcessingFiles((prev) => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })
        } catch (error) {
          console.error("Failed to process file:", error)
          setProcessingFiles((prev) => {
            const newMap = new Map(prev)
            newMap.delete(fileId)
            return newMap
          })
        }
      }

      setUploadFiles([])
      setNewTags("")
    },
    [selectedFolder, newTags],
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage your document library with OCR processing</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        {/* Upload Area */}
        {showUpload && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="folder-select">Target Folder</Label>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select folder (optional)" />
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
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</p>
                  <p className="text-sm text-gray-500 mb-4">Supports PDF, DOC, DOCX, PNG, JPG, GIF (Max 10MB each)</p>
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
                  <div className="space-y-2">
                    <h4 className="font-medium">Processing Files</h4>
                    {Array.from(processingFiles.entries()).map(([fileId, progress]) => (
                      <div key={fileId} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing OCR...
                          </span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
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
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
              <Button onClick={() => setShowUpload(true)}>
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
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(doc)}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(doc.size)} • {doc.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
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
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{doc.ocrText.substring(0, 150)}...</p>
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
                        <span className="text-blue-600">Processing OCR...</span>
                        <span>{doc.processingProgress}%</span>
                      </div>
                      <Progress value={doc.processingProgress} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
