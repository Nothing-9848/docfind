"use client"

import { useState, useEffect } from "react"
import { Search, Upload, FileText, Tag, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { DocumentUpload } from "./components/document-upload"
import { DocumentCard } from "./components/document-card"
import { DocumentViewer } from "./components/document-viewer"
import { TagManager } from "./components/tag-manager"
import { DocumentStore } from "./store/document-store"
import type { Document, Tag as TagType } from "./types/document"

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)
  const [managingTags, setManagingTags] = useState<Document | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    setDocuments(DocumentStore.getDocuments())
    setTags(DocumentStore.getTags())
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      setDocuments(DocumentStore.searchDocuments(query))
    } else {
      setDocuments(DocumentStore.getDocuments())
    }
  }

  const handleTagFilter = (tagName: string | null) => {
    setSelectedTag(tagName)
    if (tagName) {
      setDocuments(DocumentStore.getDocumentsByTag(tagName))
    } else {
      setDocuments(DocumentStore.getDocuments())
    }
  }

  const handleUploadComplete = (document: Document) => {
    setDocuments(DocumentStore.getDocuments())
    setTags(DocumentStore.getTags())
  }

  const handleTagsUpdated = () => {
    setDocuments(DocumentStore.getDocuments())
    setTags(DocumentStore.getTags())
  }

  const getTagColor = (tag: string) => {
    const colors = {
      business: "bg-blue-100 text-blue-800",
      planning: "bg-green-100 text-green-800",
      important: "bg-red-100 text-red-800",
      invoice: "bg-yellow-100 text-yellow-800",
      finance: "bg-purple-100 text-purple-800",
      meeting: "bg-orange-100 text-orange-800",
      notes: "bg-gray-100 text-gray-800",
    }
    return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const filteredDocuments = selectedTag ? documents.filter((doc) => doc.tags.includes(selectedTag)) : documents

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6" />
              <h1 className="text-xl font-bold">DocuManager</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowUpload(!showUpload)} className="w-full">
                  <Upload className="w-4 h-4" />
                  Upload Documents
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleTagFilter(null)} isActive={selectedTag === null}>
                  <FileText className="w-4 h-4" />
                  All Documents ({documents.length})
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="px-4 py-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div className="space-y-1">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start h-8 ${selectedTag === tag.name ? "bg-gray-100" : ""}`}
                    onClick={() => handleTagFilter(tag.name)}
                  >
                    <Tag className="w-3 h-3 mr-2" />
                    <span className="flex-1 text-left">{tag.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {tag.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {showUpload && (
              <div className="mb-6">
                <DocumentUpload onUploadComplete={handleUploadComplete} />
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedTag ? `Documents tagged with "${selectedTag}"` : "All Documents"}
                </h2>
                <p className="text-gray-500">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
                </p>
              </div>

              {filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-500 text-center mb-4">
                      {searchQuery
                        ? "Try adjusting your search terms or upload new documents."
                        : "Upload your first document to get started with OCR and tagging."}
                    </p>
                    <Button onClick={() => setShowUpload(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "space-y-4"
                  }
                >
                  {filteredDocuments.map((document) => (
                    <DocumentCard
                      key={document.id}
                      document={document}
                      onView={setViewingDocument}
                      onAddTag={setManagingTags}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>

      <DocumentViewer document={viewingDocument} onClose={() => setViewingDocument(null)} />

      <TagManager document={managingTags} onClose={() => setManagingTags(null)} onTagsUpdated={handleTagsUpdated} />
    </SidebarProvider>
  )
}
