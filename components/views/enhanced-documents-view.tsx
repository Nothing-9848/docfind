"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Upload, Search, Grid, List, Eye, Download, Trash2, Calendar, HardDrive } from "lucide-react"
import { DocumentUpload } from "../document-upload"
import { DocumentViewerModal } from "../document-viewer-modal"
import type { AppState, Document } from "../../types"

interface DocumentsViewProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function EnhancedDocumentsView({ state, updateState }: DocumentsViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [filterType, setFilterType] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const filteredDocuments = state.documents
    .filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.ocrText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType = filterType === "all" || doc.type === filterType

      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "size":
          return b.size - a.size
        case "type":
          return a.type.localeCompare(b.type)
        case "createdAt":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄"
      case "image":
        return "🖼️"
      case "doc":
        return "📝"
      case "text":
        return "📃"
      default:
        return "📄"
    }
  }

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getFileIcon(document.type)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{document.name}</h3>
              <p className="text-sm text-gray-500">{document.type.toUpperCase()}</p>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedDocument(document)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <HardDrive className="h-3 w-3" />
            <span>{formatBytes(document.size)}</span>
            <Calendar className="h-3 w-3 ml-2" />
            <span>{document.createdAt.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {document.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {document.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{document.tags.length - 3}
            </Badge>
          )}
        </div>

        <p className="text-xs text-gray-600 line-clamp-2">{document.ocrText.substring(0, 100)}...</p>
      </CardContent>
    </Card>
  )

  const DocumentRow = ({ document }: { document: Document }) => (
    <div className="group flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="text-xl">{getFileIcon(document.type)}</div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{document.name}</h3>
        <p className="text-sm text-gray-500">{document.ocrText.substring(0, 80)}...</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="uppercase font-mono">{document.type}</span>
        <span>{formatBytes(document.size)}</span>
        <span>{document.createdAt.toLocaleDateString()}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {document.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(document)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage and organize your document library</p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="doc">Documents</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            Showing {filteredDocuments.length} of {state.documents.length} documents
          </p>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="text-blue-600">
              Clear search
            </Button>
          )}
        </div>

        {/* Documents Grid/List */}
        {filteredDocuments.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((document) => (
                <DocumentRow key={document.id} document={document} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? "Try adjusting your search terms or filters" : "Upload your first document to get started"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Upload Documents</h2>
                <Button variant="ghost" onClick={() => setShowUpload(false)}>
                  ×
                </Button>
              </div>
              <DocumentUpload
                onUpload={(document) => {
                  // Handle document upload
                  setShowUpload(false)
                }}
              />
            </div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {selectedDocument && (
          <DocumentViewerModal document={selectedDocument} onClose={() => setSelectedDocument(null)} />
        )}
      </div>
    </ScrollArea>
  )
}
