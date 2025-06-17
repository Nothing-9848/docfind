"use client"
import { FileText, ImageIcon, File, Tag, Eye, Download, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Document } from "../types/document"

interface DocumentCardProps {
  document: Document
  onView: (document: Document) => void
  onAddTag: (document: Document) => void
}

export function DocumentCard({ document, onView, onAddTag }: DocumentCardProps) {
  const getFileIcon = () => {
    switch (document.type) {
      case "image":
        return <ImageIcon className="w-5 h-5" />
      case "pdf":
        return <FileText className="w-5 h-5" />
      default:
        return <File className="w-5 h-5" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getFileIcon()}
            <div>
              <h3 className="font-medium text-sm truncate max-w-[200px]">{document.name}</h3>
              <p className="text-xs text-gray-500">
                {formatFileSize(document.size)} • {formatDate(document.uploadDate)}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(document)}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddTag(document)}>
                <Tag className="w-4 h-4 mr-2" />
                Add Tag
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {document.ocrText && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{document.ocrText.substring(0, 100)}...</p>
        )}
        <div className="flex flex-wrap gap-1">
          {document.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className={`text-xs ${getTagColor(tag)}`}>
              {tag}
            </Badge>
          ))}
          {document.tags.length === 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onAddTag(document)}>
              <Tag className="w-3 h-3 mr-1" />
              Add tag
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
