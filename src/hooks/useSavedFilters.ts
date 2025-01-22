import { useState, useEffect } from 'react'

interface SavedFilter {
  id: string
  name: string
  filters: Record<string, any>
}

const FILTERS_KEY = 'saved_filters'

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem(FILTERS_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(savedFilters))
  }, [savedFilters])

  const saveFilter = (name: string, filters: Record<string, any>) => {
    setSavedFilters(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name,
        filters
      }
    ])
  }

  const deleteFilter = (id: string) => {
    setSavedFilters(prev => prev.filter(filter => filter.id !== id))
  }

  return {
    savedFilters,
    saveFilter,
    deleteFilter
  }
}