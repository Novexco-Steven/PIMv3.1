import { useState } from 'react'

export function useOptimisticList<T extends { id: string }>(initialItems: T[] = []) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [optimisticItems, setOptimisticItems] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)

  const addOptimistically = async (
    item: T,
    addFn: () => Promise<void>
  ) => {
    setOptimisticItems(prev => [...prev, item])
    setError(null)

    try {
      await addFn()
      setItems(prev => [...prev, item])
    } catch (error) {
      setError(error as Error)
      setOptimisticItems(prev => prev.filter(i => i.id !== item.id))
      throw error
    } finally {
      setOptimisticItems(prev => prev.filter(i => i.id !== item.id))
    }
  }

  const updateOptimistically = async (
    updatedItem: T,
    updateFn: () => Promise<void>
  ) => {
    const originalItem = items.find(i => i.id === updatedItem.id)
    if (!originalItem) return

    setOptimisticItems(prev => [...prev, updatedItem])
    setError(null)

    try {
      await updateFn()
      setItems(prev => prev.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      ))
    } catch (error) {
      setError(error as Error)
      setOptimisticItems(prev => prev.filter(i => i.id !== updatedItem.id))
      throw error
    } finally {
      setOptimisticItems(prev => prev.filter(i => i.id !== updatedItem.id))
    }
  }

  const removeOptimistically = async (
    itemId: string,
    removeFn: () => Promise<void>
  ) => {
    const itemToRemove = items.find(i => i.id === itemId)
    if (!itemToRemove) return

    setItems(prev => prev.filter(item => item.id !== itemId))
    setError(null)

    try {
      await removeFn()
    } catch (error) {
      setError(error as Error)
      setItems(prev => [...prev, itemToRemove])
      throw error
    }
  }

  const displayItems = [
    ...items,
    ...optimisticItems
  ].reduce((acc, item) => {
    const index = acc.findIndex(i => i.id === item.id)
    if (index === -1) {
      acc.push(item)
    } else {
      acc[index] = item
    }
    return acc
  }, [] as T[])

  return {
    items: displayItems,
    error,
    addOptimistically,
    updateOptimistically,
    removeOptimistically,
    setItems
  }
}