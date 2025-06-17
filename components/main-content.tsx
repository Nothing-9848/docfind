"use client"

import { Dashboard } from "./views/dashboard"
import { DocumentsView } from "./views/documents-view"
import { FoldersView } from "./views/folders-view"
import { TagsView } from "./views/tags-view"
import { SearchView } from "./views/search-view"
import { SettingsView } from "./views/settings-view"
import type { AppState } from "../types"

interface MainContentProps {
  state: AppState
}

export function MainContent({ state }: MainContentProps) {
  const renderContent = () => {
    switch (state.currentView) {
      case "dashboard":
        return <Dashboard state={state} />
      case "documents":
        return <DocumentsView state={state} />
      case "folders":
        return <FoldersView state={state} />
      case "tags":
        return <TagsView state={state} />
      case "search":
        return <SearchView state={state} />
      case "settings":
        return <SettingsView state={state} />
      default:
        return <Dashboard state={state} />
    }
  }

  return <div className="flex-1 overflow-hidden">{renderContent()}</div>
}
