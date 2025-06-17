"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tags, Search, FileText } from "lucide-react"

interface TagsViewProps {
  documents: any[]
}

export function TagsView({ documents }: TagsViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all tags with their document counts
  const tagCounts = documents.reduce(
    (acc, doc) => {
      doc.tags.forEach((tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>,
  )

  const filteredTags = Object.entries(tagCounts).filter(([tag]) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

  const documentsWithSelectedTag = selectedTag ? documents.filter((doc) => doc.tags.includes(selectedTag)) : []

  return (
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
                All Tags
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
                {filteredTags.map(([tag, count]) => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    <span>{tag}</span>
                    <Badge variant="secondary" className="ml-2">
                      {count}
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
                <CardTitle>Documents tagged with "{selectedTag}"</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentsWithSelectedTag.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.title}</h3>
                          <p className="text-sm text-gray-500">
                            {doc.createdAt.toLocaleDateString()} • {doc.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.tags.map((tag: string) => (
                          <Badge key={tag} variant={tag === selectedTag ? "default" : "secondary"} className="text-xs">
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
  )
}
