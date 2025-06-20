"use client"

import { useState } from "react"
import {
  Home,
  FileText,
  Search,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  Hash,
  Folder,
  Upload,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AppState } from "../types"

interface SidebarProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function Sidebar({ state, updateState }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))
  const [searchFocused, setSearchFocused] = useState(false)

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
    if (!folder || folder.id === "root") return null

    const isExpanded = expandedFolders.has(folderId)
    const hasChildren = folder.children.length > 0
    const documentCount = folder.documentIds.length
    const isSelected = state.selectedFolder === folderId

    return (
      <div key={folderId}>
        <div
          className={`group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 transition-colors text-sm ${
            isSelected ? "bg-gray-100" : ""
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => {
            updateState({ selectedFolder: folderId, currentView: "folders" })
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folderId)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="flex-1 truncate text-gray-700">{folder.name}</span>

          {documentCount > 0 && (
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {documentCount}
            </span>
          )}

          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 rounded">
            <MoreHorizontal className="h-3 w-3 text-gray-400" />
          </button>
        </div>

        {isExpanded && hasChildren && <div>{folder.children.map((childId) => renderFolder(childId, level + 1))}</div>}
      </div>
    )
  }

  const navigationItems = [
    {
      icon: Home,
      label: "Dashboard",
      id: "dashboard",
      count: null,
    },
    {
      icon: FileText,
      label: "All Documents",
      id: "documents",
      count: state.documents.length,
    },
    {
      icon: Search,
      label: "Search",
      id: "search",
      count: null,
    },
  ]

  return (
    <div className="w-64 h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">DocuFlow Pro</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search..."
            className={`pl-8 h-7 text-xs border-gray-200 transition-all ${
              searchFocused ? "bg-white shadow-sm" : "bg-gray-50"
            }`}
            value={state.searchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onChange={(e) => {
              updateState({ searchQuery: e.target.value })
              if (e.target.value) {
                updateState({ currentView: "search" })
              }
            }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Navigation */}
          <div className="space-y-0.5 mb-4">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => updateState({ currentView: item.id as any })}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  state.currentView === item.id
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== null && <span className="text-xs text-gray-400">{item.count}</span>}
              </button>
            ))}
          </div>

          {/* Upload Button */}
          <Button
            onClick={() => updateState({ currentView: "documents" })}
            className="w-full mb-4 h-8 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload
          </Button>

          {/* Folders */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Folders</span>
              <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded">
                <Plus className="h-3 w-3 text-gray-400" />
              </button>
            </div>
            <div className="space-y-0.5">
              {state.folders.filter((f) => f.parentId === "root").map((folder) => renderFolder(folder.id))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
            </div>
            <div className="space-y-0.5">
              {state.tags
                .sort((a, b) => b.documentCount - a.documentCount)
                .slice(0, 8)
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      updateState({
                        searchQuery: `tag:${tag.name}`,
                        currentView: "search",
                      })
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Hash className="h-3 w-3 flex-shrink-0 text-gray-400" />
                    <span className="flex-1 text-left truncate">{tag.name}</span>
                    <span className="text-xs text-gray-400">{tag.documentCount}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <button
          onClick={() => updateState({ currentView: "settings" })}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </button>
      </div>
    </div>
  )
}
