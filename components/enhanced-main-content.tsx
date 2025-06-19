"use client"

import { Dashboard } from "./views/enhanced-dashboard"
import { DocumentsView } from "./views/enhanced-documents-view"
import { FoldersView } from "./views/folders-view"
import { TagsView } from "./views/tags-view"
import { SearchView } from "./views/enhanced-search-view"
import { SettingsView } from "./views/enhanced-settings-view"
import type { AppState } from "../types"

interface EnhancedMainContentProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function MainContent({ state, updateState }: EnhancedMainContentProps) {
  const renderContent = () => {
    switch (state.currentView) {
      case "dashboard":
        return <Dashboard state={state} updateState={updateState} />
      case "documents":
        return <DocumentsView state={state} updateState={updateState} />
      case "folders":
        return <FoldersView state={state} updateState={updateState} />
      case "tags":
        return <TagsView state={state} updateState={updateState} />
      case "search":
        return <SearchView state={state} updateState={updateState} />
      case "settings":
      case "database":
      case "languages":
      case "storage":
        return <SettingsView state={state} updateState={updateState} activeTab={state.currentView} />
      default:
        return <Dashboard state={state} updateState={updateState} />
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      <div className="flex-1 overflow-auto">
        <div className="h-full">{renderContent()}</div>
      </div>
    </div>
  )
}
