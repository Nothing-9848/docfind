"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Document } from "../types/document"
import { DocumentStore } from "../store/document-store"

interface TagManagerProps {
  document: Document | null
  onClose: () => void
  onTagsUpdated: () => void
}

export function TagManager({ document, onClose, onTagsUpdated }: TagManagerProps) {
  const [newTag, setNewTag] = useState("")
  const availableTags = DocumentStore.getTags()

  if (!document) return null

  const handleAddTag = () => {
    if (newTag.trim() && !document.tags.includes(newTag.trim())) {
      const updatedTags = [...document.tags, newTag.trim()]
      DocumentStore.updateDocument(document.id, { tags: updatedTags })
      setNewTag("")
      onTagsUpdated()
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = document.tags.filter((tag) => tag !== tagToRemove)
    DocumentStore.updateDocument(document.id, { tags: updatedTags })
    onTagsUpdated()
  }

  const handleAddExistingTag = (tag: string) => {
    if (!document.tags.includes(tag)) {
      const updatedTags = [...document.tags, tag]
      DocumentStore.updateDocument(document.id, { tags: updatedTags })
      onTagsUpdated()
    }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Manage Tags</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Current Tags</h3>
            <div className="flex flex-wrap gap-1">
              {document.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className={`${getTagColor(tag)} cursor-pointer`}
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
              {document.tags.length === 0 && <p className="text-sm text-gray-500">No tags assigned</p>}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Add New Tag</h3>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag name"
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Available Tags</h3>
            <div className="flex flex-wrap gap-1">
              {availableTags
                .filter((tag) => !document.tags.includes(tag.name))
                .map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleAddExistingTag(tag.name)}
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
