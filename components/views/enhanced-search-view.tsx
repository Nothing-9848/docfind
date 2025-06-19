"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, FileType, Tag, FolderOpen, X, Eye, Download, Clock, TrendingUp } from "lucide-react"
import { DocumentViewerModal } from "../document-viewer-modal"
import type { AppState, Document } from "../../types"

interface SearchViewProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function EnhancedSearchView({ state, updateState }: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState(state.searchQuery || "")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: "", to: "" })
  const [sizeRange, setSizeRange] = useState<{ min: string; max: string }>({ min: "", max: "" })
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([
    "business plan",
    "invoice 2024",
    "contract agreement",
    "financial report",
  ])

  const documentTypes = ["pdf", "image", "doc", "text"]

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const parseSearchQuery = (query: string) => {
    const operators = {
      tag: [] as string[],
      type: [] as string[],
      folder: [] as string[],
      text: [] as string[],
    }

    const parts = query.split(/\s+/)
    const currentText: string[] = []

    parts.forEach((part) => {
      if (part.startsWith("tag:")) {
        operators.tag.push(part.substring(4))
      } else if (part.startsWith("type:")) {
        operators.type.push(part.substring(5))
      } else if (part.startsWith("folder:")) {
        operators.folder.push(part.substring(7))
      } else {
        currentText.push(part)
      }
    })

    operators.text = currentText

    return operators
  }

  const searchDocuments = () => {
    const operators = parseSearchQuery(searchQuery)

    return state.documents.filter((doc) => {
      // Text search
      const textMatch =
        operators.text.length === 0 ||
        operators.text.some(
          (term) =>
            doc.name.toLowerCase().includes(term.toLowerCase()) ||
            doc.ocrText.toLowerCase().includes(term.toLowerCase()) ||
            doc.content.toLowerCase().includes(term.toLowerCase()),
        )

      // Tag filter
      const tagMatch =
        operators.tag.length === 0 ||
        operators.tag.some((tag) => doc.tags.includes(tag)) ||
        selectedTags.length === 0 ||
        selectedTags.some((tag) => doc.tags.includes(tag))

      // Type filter
      const typeMatch =
        operators.type.length === 0 ||
        operators.type.includes(doc.type) ||
        selectedTypes.length === 0 ||
        selectedTypes.includes(doc.type)

      // Folder filter
      const folderMatch =
        operators.folder.length === 0 || selectedFolders.length === 0 || selectedFolders.includes(doc.folderId || "")

      // Date range filter
      const dateMatch =
        !dateRange.from ||
        !dateRange.to ||
        (new Date(doc.createdAt) >= new Date(dateRange.from) && new Date(doc.createdAt) <= new Date(dateRange.to))

      // Size range filter
      const sizeMatch =
        (!sizeRange.min || doc.size >= Number.parseInt(sizeRange.min)) &&
        (!sizeRange.max || doc.size <= Number.parseInt(sizeRange.max))

      return textMatch && tagMatch && typeMatch && folderMatch && dateMatch && sizeMatch
    })
  }

  const searchResults = searchDocuments()

  const handleSearch = () => {
    updateState({ searchQuery })
    if (searchQuery && !searchHistory.includes(searchQuery)) {
      setSearchHistory([searchQuery, ...searchHistory.slice(0, 9)])
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTypes([])
    setSelectedTags([])
    setSelectedFolders([])
    setDateRange({ from: "", to: "" })
    setSizeRange({ min: "", max: "" })
    updateState({ searchQuery: "" })
  }

  const addSearchOperator = (operator: string, value: string) => {
    const newQuery = searchQuery ? `${searchQuery} ${operator}:${value}` : `${operator}:${value}`
    setSearchQuery(newQuery)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
          <p className="text-gray-600">Find documents using powerful search operators and filters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Query</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Enter search terms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    Search
                  </Button>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Search Operators Help */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <strong>Search operators:</strong>
                  </p>
                  <p>
                    • <code>tag:business</code> - Find by tag
                  </p>
                  <p>
                    • <code>type:pdf</code> - Find by file type
                  </p>
                  <p>
                    • <code>folder:documents</code> - Find by folder
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Document Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  Document Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documentTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTypes([...selectedTypes, type])
                          } else {
                            setSelectedTypes(selectedTypes.filter((t) => t !== type))
                          }
                        }}
                      />
                      <Label htmlFor={type} className="text-sm font-medium capitalize">
                        {type}
                      </Label>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {state.documents.filter((d) => d.type === type).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {state.tags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 px-2 w-full"
                        onClick={() => addSearchOperator("tag", tag.name)}
                      >
                        <div className={`w-2 h-2 rounded-full bg-${tag.color}-500 mr-2`} />
                        <span className="text-sm truncate">{tag.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {tag.documentCount}
                        </Badge>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Folders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Folders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.folders
                    .filter((f) => f.id !== "root")
                    .map((folder) => (
                      <Button
                        key={folder.id}
                        variant="ghost"
                        size="sm"
                        className="justify-start h-8 px-2 w-full"
                        onClick={() => addSearchOperator("folder", folder.name)}
                      >
                        <FolderOpen className="h-3 w-3 mr-2" />
                        <span className="text-sm truncate">{folder.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {folder.documentIds.length}
                        </Badge>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(query)}
                      className="text-xs"
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Search Results</span>
                  <Badge variant="secondary">
                    {searchResults.length} document{searchResults.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="text-2xl">
                            {document.type === "pdf" ? "📄" : document.type === "image" ? "🖼️" : "📝"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">{document.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {document.ocrText.substring(0, 150)}...
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{document.type.toUpperCase()}</span>
                              <span>{formatBytes(document.size)}</span>
                              <span>{document.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap gap-1">
                            {document.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-4">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDocument(document)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-6">
                      Try adjusting your search terms or filters to find what you're looking for.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Search Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Search Operators</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>
                        • Use <code className="bg-gray-100 px-1 rounded">tag:name</code> to search by tag
                      </li>
                      <li>
                        • Use <code className="bg-gray-100 px-1 rounded">type:pdf</code> to filter by file type
                      </li>
                      <li>
                        • Use <code className="bg-gray-100 px-1 rounded">folder:name</code> to search in specific
                        folders
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Advanced Tips</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Combine multiple operators for precise results</li>
                      <li>• Use quotation marks for exact phrase matching</li>
                      <li>• Search includes document content and OCR text</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Document Viewer Modal */}
        {selectedDocument && (
          <DocumentViewerModal document={selectedDocument} onClose={() => setSelectedDocument(null)} />
        )}
      </div>
    </ScrollArea>
  )
}
