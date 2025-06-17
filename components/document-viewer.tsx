"use client"

import { X, FileText, ImageIcon, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Document } from "../types/document"

interface DocumentViewerProps {
  document: Document | null
  onClose: () => void
}

export function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  if (!document) return null

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
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            {getFileIcon()}
            <CardTitle className="text-lg">{document.name}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-4 h-full">
                {document.type === "image" ? (
                  <img
                    src={document.url || "/placeholder.svg"}
                    alt={document.name}
                    className="max-w-full max-h-full object-contain mx-auto"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {getFileIcon()}
                    <span className="ml-2">Preview not available</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className={getTagColor(tag)}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">OCR Text</h3>
                <ScrollArea className="h-64 w-full rounded border p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{document.ocrText || "No text extracted"}</p>
                </ScrollArea>
              </div>
              <div>
                <h3 className="font-medium mb-2">Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Size: {Math.round(document.size / 1024)} KB</p>
                  <p>Type: {document.type.toUpperCase()}</p>
                  <p>Uploaded: {document.uploadDate.toLocaleDateString()}</p>
                  <p>Status: {document.status}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
