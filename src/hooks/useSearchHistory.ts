import { useState, useEffect } from 'react'

interface SearchHistoryItem {
  id: string
  query: string
  filters: Record<string, any>
  timestamp: Date
}

const HISTORY_KEY = 'search_history'
const MAX_HISTORY_ITEMS = 10

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const addToHistory = (query: string, filters: Record<string, any>) => {
    setHistory(prev => {
      const newItem = {
        id: Date.now().toString(),
        query,
        filters,
        timestamp: new Date()
      }

      const filtered = prev.filter(item => 
        item.query !== query || 
        JSON.stringify(item.filters) !== JSON.stringify(filters)
      )

      return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    })
  }

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}