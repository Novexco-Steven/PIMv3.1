import { History, X } from 'lucide-react'

interface SearchHistoryItem {
  id: string
  query: string
  filters: Record<string, string | number | boolean>
  timestamp: Date
}

interface SearchHistoryProps {
  history: SearchHistoryItem[]
  onApplySearch: (query: string, filters: Record<string, string | number | boolean>) => void
  onClearHistory: () => void
  onRemoveHistoryItem: (id: string) => void
}

export function SearchHistory({
  history,
  onApplySearch,
  onClearHistory,
  onRemoveHistoryItem
}: SearchHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Search History</span>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
          >
            <button
              type="button"
              onClick={() => onApplySearch(item.query, item.filters)}
              className="flex-1 text-left"
            >
              <span className="text-sm text-gray-900">{item.query || '(no query)'}</span>
              <span className="text-xs text-gray-500 block">
                {new Date(item.timestamp).toLocaleString()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRemoveHistoryItem(item.id)}
              className="text-gray-400 hover:text-red-600 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {history.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-2">
            No search history
          </p>
        )}
      </div>
    </div>
  )
}