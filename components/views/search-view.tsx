"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, FileText, Clock } from "lucide-react"
import { DocumentStore } from "../../store/document-store"
import type { AppState, Document } from "../../types"

interface SearchViewProps {
  state: AppState
}

export function SearchView({ state }: SearchViewProps) {
  const [searchQuery, setSearchQuery] = useState(state.searchQuery || "")
  const [searchResults, setSearchResults] = useState<Document[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      const timer = setTimeout(() => {
        const results = DocumentStore.searchDocuments(searchQuery)
        setSearchResults(results)
        setIsSearching(false)

        // Add to search history
        if (!searchHistory.includes(searchQuery)) {
          setSearchHistory((prev) => [searchQuery, ...prev.slice(0, 4)])
        }
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery, searchHistory])

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const getSearchSuggestions = () => {
    const allTags = state.tags.map((tag) => `tag:${tag.name}`)
    const allFolders = state.folders.filter((f) => f.id !== "root").map((folder) => `folder:${folder.name}`)
    return [...allTags, ...allFolders, "type:pdf", "type:image", "type:doc"]
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">Search across all documents, OCR text, and metadata</p>
        </div>

        {/* Search Input */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search documents, OCR text, tags... (e.g., 'business plan', 'tag:finance', 'type:pdf')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 text-lg h-12"
              />
            </div>

            {/* Search Suggestions */}
            {!searchQuery && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Try searching for:</p>
                <div className="flex flex-wrap gap-2">
                  {getSearchSuggestions()
                    .slice(0, 6)
                    .map((suggestion) => (
                      <Button key={suggestion} variant="outline" size="sm" onClick={() => setSearchQuery(suggestion)}>
                        {suggestion}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && !searchQuery && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recent searches:
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery(query)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchQuery && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Search Results
                  {!isSearching && (
                    <span className="text-gray-500 font-normal ml-2">({searchResults.length} found)</span>
                  )}
                </span>
                {isSearching && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Searching...
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isSearching && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500">Try different keywords or check your spelling</p>
                </div>
              )}

              <div className="space-y-4">
                {searchResults.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{highlightText(doc.name, searchQuery)}</h3>
                          <p className="text-sm text-gray-500">
                            {doc.createdAt.toLocaleDateString()} • {(doc.size / 1024).toFixed(0)} KB •{" "}
                            {doc.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {highlightText(tag, searchQuery.replace("tag:", ""))}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* OCR Text Preview */}
                    {doc.ocrText && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {highlightText(doc.ocrText.substring(0, 300), searchQuery)}
                          {doc.ocrText.length > 300 && "..."}
                        </p>
                      </div>
                    )}

                    {/* Match Information */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        {doc.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            Found in filename
                          </span>
                        )}
                        {doc.ocrText.toLowerCase().includes(searchQuery.toLowerCase()) && (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            Found in OCR text
                          </span>
                        )}
                        {doc.tags.some((tag) =>
                          tag.toLowerCase().includes(searchQuery.replace("tag:", "").toLowerCase()),
                        ) && (
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            Found in tags
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        Open Document
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
