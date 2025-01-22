import { useState } from 'react'

export function useOptimisticUpdate<T>() {
  const [optimisticData, setOptimisticData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const updateOptimistically = async <U>(
    updateFn: () => Promise<U>,
    optimisticUpdate: T,
    rollbackFn?: () => void
  ) => {
    setOptimisticData(optimisticUpdate)
    setError(null)

    try {
      const result = await updateFn()
      setOptimisticData(null)
      return result
    } catch (error) {
      setOptimisticData(null)
      setError(error as Error)
      if (rollbackFn) {
        rollbackFn()
      }
      throw error
    }
  }

  return {
    optimisticData,
    error,
    updateOptimistically
  }
}