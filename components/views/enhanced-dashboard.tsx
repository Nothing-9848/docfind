"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  Upload,
  Search,
  Settings,
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  Hash,
  Folder,
  Eye,
  Download,
} from "lucide-react"
import { DocumentUpload } from "../document-upload"
import type { AppState, Document } from "../../types"

interface DashboardProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function EnhancedDashboard({ state, updateState }: DashboardProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])

  useEffect(() => {
    // Update recent documents when state changes
    const recent = [...state.documents]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)
    setRecentDocuments(recent)
    console.log("Dashboard: Updated recent documents", recent.length)
  }, [state.documents])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄"
      case "image":
        return "🖼️"
      case "doc":
        return "📝"
      default:
        return "📄"
    }
  }

  const quickActions = [
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Add files with OCR processing",
      action: () => setShowUpload(true),
    },
    {
      icon: Search,
      title: "Search Documents",
      description: "Find documents quickly",
      action: () => updateState({ currentView: "search" }),
    },
    {
      icon: Folder,
      title: "Organize Folders",
      description: "Manage your structure",
      action: () => updateState({ currentView: "folders" }),
    },
    {
      icon: Settings,
      title: "Settings",
      description: "Configure OCR & storage",
      action: () => updateState({ currentView: "settings" }),
    },
  ]

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Good morning! 👋</h1>
            <p className="text-gray-600">Here's what's happening with your documents today.</p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700 h-9 px-4">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      <ScrollArea className="h-full">
        <div className="p-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Documents</span>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{state.documents.length}</div>
              <div className="text-xs text-gray-500">Total files</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Storage</span>
                <Folder className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatBytes(state.documents.reduce((acc, doc) => acc + doc.size, 0))}
              </div>
              <div className="text-xs text-gray-500">Used space</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Tags</span>
                <Hash className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{state.tags.length}</div>
              <div className="text-xs text-gray-500">Categories</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Recent</span>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {
                  state.documents.filter((doc) => {
                    const dayAgo = new Date()
                    dayAgo.setDate(dayAgo.getDate() - 1)
                    return new Date(doc.updatedAt) > dayAgo
                  }).length
                }
              </div>
              <div className="text-xs text-gray-500">Last 24h</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                >
                  <action.icon className="h-8 w-8 text-gray-400 group-hover:text-gray-600 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Documents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
              {recentDocuments.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateState({ currentView: "documents" })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  View all
                </Button>
              )}
            </div>

            {recentDocuments.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-500 mb-6">Upload your first document to get started with OCR processing</p>
                <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                    onClick={() => updateState({ currentView: "documents" })}
                  >
                    <div className="text-2xl">{getDocumentIcon(doc.type)}</div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{formatBytes(doc.size)}</span>
                        <span>•</span>
                        <span className="uppercase text-xs">{doc.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {doc.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{doc.tags.length - 2}
                        </Badge>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Tags */}
          {state.tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h2>
              <div className="flex flex-wrap gap-2">
                {state.tags
                  .sort((a, b) => b.documentCount - a.documentCount)
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        updateState({
                          searchQuery: `tag:${tag.name}`,
                          currentView: "search",
                        })
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                    >
                      <Hash className="h-3 w-3" />
                      {tag.name}
                      <span className="text-xs text-gray-500">({tag.documentCount})</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upload Documents</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
                  ×
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <DocumentUpload
                onUploadComplete={(doc) => {
                  console.log("Dashboard: Document uploaded:", doc)
                  // The store will automatically notify and update the state
                }}
                onClose={() => setShowUpload(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
