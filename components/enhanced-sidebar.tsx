"use client"

import { useState } from "react"
import {
  Home,
  FileText,
  Folder,
  Tags,
  Search,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  Database,
  HardDrive,
  Cloud,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { AppState } from "../types"

interface SidebarProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function Sidebar({ state, updateState }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folderId: string, level = 0) => {
    const folder = state.folders.find((f) => f.id === folderId)
    if (!folder) return null

    const isExpanded = expandedFolders.has(folderId)
    const hasChildren = folder.children.length > 0
    const documentCount = folder.documentIds.length

    return (
      <div key={folderId}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
            state.selectedFolder === folderId ? "bg-blue-50 text-blue-700" : ""
          }`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => {
            updateState({ selectedFolder: folderId, currentView: "folders" })
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folderId)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          <Folder className={`h-4 w-4 text-${folder.color}-500`} />
          <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
          {documentCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {documentCount}
            </Badge>
          )}
          {folder.isWatched && <div className="w-2 h-2 bg-green-500 rounded-full" title="Watched folder" />}
        </div>

        {isExpanded && hasChildren && <div>{folder.children.map((childId) => renderFolder(childId, level + 1))}</div>}
      </div>
    )
  }

  const getStorageIcon = () => {
    const storageLocation = state.settings?.storageLocation || "browser"
    switch (storageLocation) {
      case "local":
        return <HardDrive className="h-4 w-4" />
      case "cloud":
        return <Cloud className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">DocuFlow Pro</h1>
            <p className="text-xs text-gray-500">Document Management</p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Quick search..."
            className="pl-9 h-8 text-sm"
            value={state.searchQuery}
            onChange={(e) => {
              updateState({ searchQuery: e.target.value })
              if (e.target.value) {
                updateState({ currentView: "search" })
              }
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-1">
          {/* Main Navigation */}
          <div className="space-y-1">
            <Button
              variant={state.currentView === "dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-sm"
              onClick={() => updateState({ currentView: "dashboard" })}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            <Button
              variant={state.currentView === "documents" ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-sm"
              onClick={() => updateState({ currentView: "documents" })}
            >
              <FileText className="h-4 w-4 mr-2" />
              All Documents
              <Badge variant="outline" className="ml-auto text-xs">
                {state.documents.length}
              </Badge>
            </Button>

            <Button
              variant={state.currentView === "search" ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-sm"
              onClick={() => updateState({ currentView: "search" })}
            >
              <Search className="h-4 w-4 mr-2" />
              Advanced Search
            </Button>

            <Button
              variant={state.currentView === "tags" ? "secondary" : "ghost"}
              className="w-full justify-start h-8 text-sm"
              onClick={() => updateState({ currentView: "tags" })}
            >
              <Tags className="h-4 w-4 mr-2" />
              Tags
              <Badge variant="outline" className="ml-auto text-xs">
                {state.tags.length}
              </Badge>
            </Button>
          </div>

          {/* Folders Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folders</h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-0.5">
              {state.folders.filter((f) => f.parentId === "root").map((folder) => renderFolder(folder.id))}
            </div>
          </div>

          {/* Recent Tags */}
          <div className="pt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Popular Tags</h3>
            <div className="flex flex-wrap gap-1">
              {state.tags
                .sort((a, b) => b.documentCount - a.documentCount)
                .slice(0, 6)
                .map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      updateState({
                        searchQuery: `tag:${tag.name}`,
                        currentView: "search",
                      })
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {getStorageIcon()}
            <span>Storage: {state.settings?.storageLocation || "Browser"}</span>
          </div>
          {state.isProcessing && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start h-8 text-sm"
          onClick={() => updateState({ currentView: "settings" })}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}
