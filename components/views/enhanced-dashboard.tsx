"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  FolderOpen,
  Tags,
  Upload,
  TrendingUp,
  Clock,
  HardDrive,
  Languages,
  Search,
  Eye,
  MoreHorizontal,
  Activity,
  Database,
  Zap,
} from "lucide-react"
import type { AppState, Document } from "../../types"
import { DatabaseService } from "../../services/database-service"

interface DashboardProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function Dashboard({ state, updateState }: DashboardProps) {
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0 })
  const [recentActivity, setRecentActivity] = useState<Document[]>([])

  useEffect(() => {
    // Load storage usage
    DatabaseService.getStorageUsage().then(setStorageUsage).catch(console.error)

    // Get recent documents
    const recent = [...state.documents].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5)
    setRecentActivity(recent)
  }, [state.documents])

  const totalDocuments = state.documents.length
  const totalFolders = state.folders.length - 1 // Exclude root folder
  const totalTags = state.tags.length
  const processingDocuments = state.documents.filter((doc) => doc.isProcessing).length

  const storagePercentage = storageUsage.quota > 0 ? (storageUsage.used / storageUsage.quota) * 100 : 0

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getDocumentIcon = (doc: Document) => {
    switch (doc.type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />
      case "image":
        return <FileText className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-blue-500" />
    }
  }

  const quickActions = [
    {
      title: "Upload Documents",
      description: "Add new documents with OCR processing",
      icon: Upload,
      action: () => updateState({ currentView: "documents" }),
      color: "bg-blue-500",
    },
    {
      title: "Advanced Search",
      description: "Search across all documents and OCR text",
      icon: Search,
      action: () => updateState({ currentView: "search" }),
      color: "bg-green-500",
    },
    {
      title: "Manage Folders",
      description: "Organize your document structure",
      icon: FolderOpen,
      action: () => updateState({ currentView: "folders" }),
      color: "bg-purple-500",
    },
    {
      title: "OCR Settings",
      description: "Configure language and processing options",
      icon: Languages,
      action: () => updateState({ currentView: "settings" }),
      color: "bg-orange-500",
    },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600">Welcome back! Here's your document overview.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              {processingDocuments} Processing
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Database className="h-3 w-3 mr-1" />
              {state.settings.storageLocation}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-3xl font-bold text-gray-900">{totalDocuments}</p>
                  <p className="text-sm text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Folders</p>
                  <p className="text-3xl font-bold text-gray-900">{totalFolders}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    <FolderOpen className="h-3 w-3 inline mr-1" />
                    {state.folders.filter((f) => f.isWatched).length} watched
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tags</p>
                  <p className="text-3xl font-bold text-gray-900">{totalTags}</p>
                  <p className="text-sm text-purple-600 mt-1">
                    <Tags className="h-3 w-3 inline mr-1" />
                    Organized content
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tags className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">OCR Languages</p>
                  <p className="text-3xl font-bold text-gray-900">{state.settings.ocrLanguages.length}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    <Languages className="h-3 w-3 inline mr-1" />
                    Multi-language support
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Languages className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Used: {formatBytes(storageUsage.used)}</span>
                <span>Available: {formatBytes(storageUsage.quota - storageUsage.used)}</span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Storage Location: {state.settings.storageLocation}</span>
                <span>{storagePercentage.toFixed(1)}% used</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="h-auto p-4 justify-start hover:bg-gray-50"
                    onClick={action.action}
                  >
                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-4`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                    <p className="text-sm">Upload some documents to get started</p>
                  </div>
                ) : (
                  recentActivity.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {getDocumentIcon(doc)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {doc.updatedAt.toLocaleDateString()} • {doc.tags.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // View document logic
                            updateState({ currentView: "documents" })
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tags className="h-5 w-5 mr-2" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {state.tags.slice(0, 12).map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    updateState({
                      searchQuery: `tag:${tag.name}`,
                      currentView: "search",
                    })
                  }}
                >
                  <div className={`w-2 h-2 rounded-full bg-${tag.color}-500 mr-2`} />
                  {tag.name}
                  <Badge variant="secondary" className="ml-2 h-4 text-xs">
                    {tag.documentCount}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
