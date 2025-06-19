"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, Clock, Languages, Tag, Calendar, Zap, TrendingUp, Eye, Download } from "lucide-react"
import { EnhancedOCRService } from "../../services/enhanced-ocr-service"
import type { AppState, Document } from "../../types"

interface SearchViewProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function SearchView({ state, updateState }: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState(state.searchQuery || "")
  const [searchResults, setSearchResults] = useState<Document[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all")
  const [searchType, setSearchType] = useState<"all" | "content" | "tags" | "filename">("all")

  const supportedLanguages = EnhancedOCRService.getSupportedLanguages()

  useEffect(() => {
    if (state.searchQuery) {
      setSearchQuery(state.searchQuery)
      performSearch(state.searchQuery)
    }
  }, [state.searchQuery])

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)

    try {
      // Add to search history
      if (!searchHistory.includes(query)) {
        setSearchHistory((prev) => [query, ...prev.slice(0, 9)])
      }

      // Parse advanced search operators
      const { cleanQuery, filters } = parseSearchQuery(query)

      // Get document IDs from indexed search
      const documentIds = await EnhancedOCRService.searchDocuments(
        cleanQuery,
        selectedLanguage === "all" ? undefined : selectedLanguage,
      )

      // Filter documents based on search results and additional filters
      const results = state.documents.filter((doc) => {
        // If we have indexed results, prioritize them
        if (documentIds.length > 0 && !documentIds.includes(doc.id)) {
          return false
        }

        // Apply search type filter
        const matchesSearchType = () => {
          switch (searchType) {
            case "content":
              return (
                doc.ocrText.toLowerCase().includes(cleanQuery.toLowerCase()) ||
                doc.content.toLowerCase().includes(cleanQuery.toLowerCase())
              )
            case "tags":
              return doc.tags.some((tag) => tag.toLowerCase().includes(cleanQuery.toLowerCase()))
            case "filename":
              return (
                doc.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
                doc.originalName.toLowerCase().includes(cleanQuery.toLowerCase())
              )
            default:
              return (
                doc.name.toLowerCase().includes(cleanQuery.toLowerCase()) ||
                doc.ocrText.toLowerCase().includes(cleanQuery.toLowerCase()) ||
                doc.content.toLowerCase().includes(cleanQuery.toLowerCase()) ||
                doc.tags.some((tag) => tag.toLowerCase().includes(cleanQuery.toLowerCase()))
              )
          }
        }

        if (!matchesSearchType()) return false

        // Apply additional filters
        if (filters.tag && !doc.tags.includes(filters.tag)) return false
        if (filters.type && doc.type !== filters.type) return false
        if (filters.folder) {
          const folder = state.folders.find((f) => f.name.toLowerCase() === filters.folder.toLowerCase())
          if (!folder || doc.folderId !== folder.id) return false
        }

        return true
      })

      // Sort by relevance (prioritize indexed results order)
      if (documentIds.length > 0) {
        results.sort((a, b) => {
          const aIndex = documentIds.indexOf(a.id)
          const bIndex = documentIds.indexOf(b.id)
          if (aIndex === -1 && bIndex === -1) return 0
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
      }

      setSearchResults(results)
    } catch (error) {
      console.error("Search failed:", error)
      // Fallback to simple search
      const results = state.documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query.toLowerCase()) ||
          doc.ocrText.toLowerCase().includes(query.toLowerCase()) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
      )
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const parseSearchQuery = (query: string) => {
    const filters: { tag?: string; type?: string; folder?: string } = {}
    let cleanQuery = query

    // Extract tag: operator
    const tagMatch = query.match(/tag:(\w+)/i)
    if (tagMatch) {
      filters.tag = tagMatch[1]
      cleanQuery = cleanQuery.replace(/tag:\w+/gi, "").trim()
    }

    // Extract type: operator
    const typeMatch = query.match(/type:(pdf|doc|image|text)/i)
    if (typeMatch) {
      filters.type = typeMatch[1].toLowerCase() as any
      cleanQuery = cleanQuery.replace(/type:\w+/gi, "").trim()
    }

    // Extract folder: operator
    const folderMatch = query.match(/folder:(\w+)/i)
    if (folderMatch) {
      filters.folder = folderMatch[1]
      cleanQuery = cleanQuery.replace(/folder:\w+/gi, "").trim()
    }

    return { cleanQuery, filters }
  }

  const handleSearch = () => {
    updateState({ searchQuery })
    performSearch(searchQuery)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (doc: Document) => {
    switch (doc.type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "image":
        return <FileText className="h-5 w-5 text-green-500" />
      default:
        return <FileText className="h-5 w-5 text-blue-500" />
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
  }

  const quickSearches = [
    { label: "Recent PDFs", query: "type:pdf", icon: FileText },
    { label: "Business Documents", query: "tag:business", icon: Tag },
    { label: "This Month", query: "date:2024", icon: Calendar },
    { label: "Large Files", query: "size:>1MB", icon: TrendingUp },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
          <p className="text-gray-600">Search across all documents, OCR text, and metadata with powerful operators</p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents... (try: tag:business, type:pdf, folder:contracts)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 text-lg"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching} className="h-12 px-8">
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-4">
                <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fields</SelectItem>
                    <SelectItem value="content">Content Only</SelectItem>
                    <SelectItem value="tags">Tags Only</SelectItem>
                    <SelectItem value="filename">Filename Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Operators Help */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Search Operators:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>
                    <code className="bg-blue-100 px-1 rounded">tag:business</code> - Find documents with specific tag
                  </div>
                  <div>
                    <code className="bg-blue-100 px-1 rounded">type:pdf</code> - Filter by file type
                  </div>
                  <div>
                    <code className="bg-blue-100 px-1 rounded">folder:contracts</code> - Search in specific folder
                  </div>
                  <div>
                    <code className="bg-blue-100 px-1 rounded">"exact phrase"</code> - Search for exact phrase
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Search Results */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Search Results</span>
                  {searchResults.length > 0 && (
                    <Badge variant="secondary">{searchResults.length} documents found</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!searchQuery ? (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Start searching</h3>
                    <p className="text-gray-500">Enter a search term to find documents across your library</p>
                  </div>
                ) : searchResults.length === 0 && !isSearching ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500">Try adjusting your search terms or using different operators</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchResults.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getFileIcon(doc)}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 mb-1">{doc.name}</h3>
                              <p className="text-sm text-gray-500 mb-2">
                                {formatFileSize(doc.size)} • {doc.updatedAt.toLocaleDateString()}
                                {doc.language && (
                                  <>
                                    {" • "}
                                    <Languages className="h-3 w-3 inline mr-1" />
                                    {supportedLanguages.find((l) => l.code === doc.language)?.nativeName}
                                  </>
                                )}
                              </p>
                              {doc.ocrText && (
                                <div className="bg-gray-100 rounded p-2 mb-2">
                                  <p
                                    className="text-sm text-gray-700 line-clamp-2"
                                    dangerouslySetInnerHTML={{
                                      __html: highlightText(doc.ocrText.substring(0, 200) + "...", searchQuery),
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {doc.tags.slice(0, 4).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {doc.tags.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{doc.tags.length - 4}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quickSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => {
                        setSearchQuery(search.query)
                        updateState({ searchQuery: search.query })
                        performSearch(search.query)
                      }}
                    >
                      <search.icon className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">{search.label}</p>
                        <p className="text-xs text-gray-500">{search.query}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent Searches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {searchHistory.slice(0, 5).map((query, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          setSearchQuery(query)
                          updateState({ searchQuery: query })
                          performSearch(query)
                        }}
                      >
                        <Clock className="h-3 w-3 mr-2" />
                        {query}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Search Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total Documents:</span>
                    <span className="font-medium">{state.documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indexed Terms:</span>
                    <span className="font-medium">~{state.documents.length * 50}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Languages:</span>
                    <span className="font-medium">{state.settings.ocrLanguages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Search Results:</span>
                    <span className="font-medium">{searchResults.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
