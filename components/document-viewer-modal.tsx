"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, FileText, ImageIcon, File, Eye, Download, TagIcon } from "lucide-react"
import { PDFViewer } from "./pdf-viewer"
import type { Document } from "../types"

interface DocumentViewerModalProps {
  document: Document | null
  onClose: () => void
}

export function DocumentViewerModal({ document, onClose }: DocumentViewerModalProps) {
  const [activeTab, setActiveTab] = useState("preview")

  if (!document) return null

  const getFileIcon = () => {
    switch (document.type) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-green-600" />
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      default:
        return <File className="h-5 w-5 text-blue-600" />
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
      uploaded: "bg-indigo-100 text-indigo-800",
      contract: "bg-pink-100 text-pink-800",
      legal: "bg-cyan-100 text-cyan-800",
    }
    return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[95vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div>
              <CardTitle className="text-lg">{document.name}</CardTitle>
              <p className="text-sm text-gray-500">
                {formatFileSize(document.size)} • {document.createdAt.toLocaleDateString()} •{" "}
                {document.type.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="ocr" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                OCR Text
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Details
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="preview" className="h-full m-6 mt-4">
                {document.type === "pdf" ? (
                  <PDFViewer fileUrl={document.url || ""} fileName={document.name} />
                ) : document.type === "image" ? (
                  <div className="h-full border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img
                      src={document.url || "/placeholder.svg?height=400&width=600"}
                      alt={document.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <Card className="h-full">
                    <CardContent className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        {getFileIcon()}
                        <p className="mt-2">Preview not available for this file type</p>
                        <p className="text-sm">Use the OCR Text tab to view extracted content</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="ocr" className="h-full m-6 mt-4">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Extracted Text Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] w-full">
                      <div className="prose prose-sm max-w-none">
                        {document.ocrText ? (
                          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{document.ocrText}</pre>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No text content extracted</p>
                            <p className="text-sm">OCR processing may not have been completed</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details" className="h-full m-6 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Document Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Original Name</label>
                        <p className="text-sm">{document.originalName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">File Size</label>
                        <p className="text-sm">{formatFileSize(document.size)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">File Type</label>
                        <p className="text-sm">{document.type.toUpperCase()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="text-sm">{document.createdAt.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Modified</label>
                        <p className="text-sm">{document.updatedAt.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Processing Status</label>
                        <Badge variant={document.isProcessing ? "default" : "secondary"}>
                          {document.isProcessing ? "Processing..." : "Completed"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tags & Organization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {document.tags.length > 0 ? (
                            document.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className={getTagColor(tag)}>
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No tags assigned</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Folder</label>
                        <p className="text-sm">{document.folderId || "Root folder"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">OCR Text Length</label>
                        <p className="text-sm">
                          {document.ocrText ? `${document.ocrText.length} characters` : "No text extracted"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
