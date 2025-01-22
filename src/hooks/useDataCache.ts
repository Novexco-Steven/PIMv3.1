import { useState, useEffect } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useDataCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      // Check cache
      const cached = localStorage.getItem(key)
      if (cached) {
        const { data, timestamp }: CacheItem<T> = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_DURATION) {
          setData(data)
          setLoading(false)
          return
        }
      }

      try {
        setLoading(true)
        const result = await fetchFn()
        
        // Update cache
        const cacheItem: CacheItem<T> = {
          data: result,
          timestamp: Date.now()
        }
        localStorage.setItem(key, JSON.stringify(cacheItem))
        
        setData(result)
        setError(null)
      } catch (error) {
        setError(error as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, dependencies)

  const invalidateCache = () => {
    localStorage.removeItem(key)
  }

  const updateCache = (newData: T) => {
    const cacheItem: CacheItem<T> = {
      data: newData,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(cacheItem))
    setData(newData)
  }

  return { 
    data, 
    loading, 
    error, 
    invalidateCache,
    updateCache
  }
}