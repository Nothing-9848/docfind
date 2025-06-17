"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tags, Search, FileText } from "lucide-react"
import type { AppState } from "../../types"

interface TagsViewProps {
  state: AppState
}

export function TagsView({ state }: TagsViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filteredTags = state.tags.filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const documentsWithSelectedTag = selectedTag ? state.documents.filter((doc) => doc.tags.includes(selectedTag)) : []

  const getTagColor = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      red: "bg-red-100 text-red-800 border-red-200",
      pink: "bg-pink-100 text-pink-800 border-pink-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    }
    return colorMap[color as keyof typeof colorMap] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tags</h1>
          <p className="text-gray-600">Organize and browse documents by tags</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tags List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  All Tags ({state.tags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredTags.map((tag) => (
                    <Button
                      key={tag.id}
                      variant={selectedTag === tag.name ? "default" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${tag.color}-500`} />
                        <span>{tag.name}</span>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {tag.documentCount}
                      </Badge>
                    </Button>
                  ))}
                </div>

                {filteredTags.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Tags className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No tags found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documents with Selected Tag */}
          <div className="lg:col-span-2">
            {selectedTag ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full bg-${state.tags.find((t) => t.name === selectedTag)?.color || "gray"}-500`}
                    />
                    Documents tagged with "{selectedTag}"
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documentsWithSelectedTag.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{doc.name}</h3>
                            <p className="text-sm text-gray-500">
                              {doc.createdAt.toLocaleDateString()} • {(doc.size / 1024).toFixed(0)} KB
                            </p>
                            {doc.ocrText && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                {doc.ocrText.substring(0, 100)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant={tag === selectedTag ? "default" : "secondary"}
                              className={`text-xs ${tag === selectedTag ? "" : getTagColor(state.tags.find((t) => t.name === tag)?.color || "gray")}`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {documentsWithSelectedTag.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No documents found with this tag</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center text-gray-500">
                    <Tags className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Select a tag</h3>
                    <p>Choose a tag from the left to view associated documents</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
