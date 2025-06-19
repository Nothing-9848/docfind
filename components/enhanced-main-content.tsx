"use client"

import { EnhancedDashboard } from "./views/enhanced-dashboard"
import { EnhancedDocumentsView } from "./views/enhanced-documents-view"
import { EnhancedSearchView } from "./views/enhanced-search-view"
import { SettingsView } from "./views/enhanced-settings-view"
import { TagsView } from "./views/tags-view"
import { FoldersView } from "./views/folders-view"
import type { AppState } from "../types"

interface MainContentProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function MainContent({ state, updateState }: MainContentProps) {
  const renderCurrentView = () => {
    switch (state.currentView) {
      case "dashboard":
        return <EnhancedDashboard state={state} updateState={updateState} />
      case "documents":
        return <EnhancedDocumentsView state={state} updateState={updateState} />
      case "folders":
        return <FoldersView state={state} updateState={updateState} />
      case "tags":
        return <TagsView state={state} updateState={updateState} />
      case "search":
        return <EnhancedSearchView state={state} updateState={updateState} />
      case "settings":
      case "languages":
      case "database":
      case "storage":
        return <SettingsView state={state} updateState={updateState} activeTab={state.currentView} />
      default:
        return <EnhancedDashboard state={state} updateState={updateState} />
    }
  }

  return <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">{renderCurrentView()}</div>
}
