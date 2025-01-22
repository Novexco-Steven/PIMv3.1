import { useState } from 'react'
import { Search, ChevronRight, ChevronLeft } from 'lucide-react'

interface Item {
  id: string
  name: string
  parentId?: string | null
  type: 'category' | 'product'
  sku?: string
  children: Item[]
}

interface DualListSelectorProps {
  title: string
  items: Item[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  onlyCategories?: boolean
}

export function DualListSelector({ 
  title, 
  items, 
  selectedIds, 
  onChange,
  onlyCategories = false
}: DualListSelectorProps) {
  const [searchLeft, setSearchLeft] = useState('')
  const [searchRight, setSearchRight] = useState('')

  // Build hierarchical structure
  const buildHierarchy = (items: Item[]) => {
    const itemMap = new Map<string, Item & { children: (Item & { children: Item[] })[] }>()
    const rootItems: (Item & { children: (Item & { children: Item[] })[] })[] = []

    // First pass: Create map of all items
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] })
    })

    // Second pass: Build tree structure
    items.forEach(item => {
      const node = itemMap.get(item.id)!
      if (item.parentId && itemMap.has(item.parentId)) {
        itemMap.get(item.parentId)!.children.push(node)
      } else {
        rootItems.push(node)
      }
    })

    return rootItems
  }

  const renderItem = (item: Item & { children: (Item & { children: Item[] })[] }, selected: boolean) => {
    const isCategory = item.type === 'category'
    const hasChildren = item.children.length > 0
    const isSelectable = onlyCategories ? isCategory : !isCategory

    return (
      <div key={item.id} className="pl-4">
        <div 
          className={`flex items-center py-1 ${
            isSelectable ? 'cursor-pointer hover:bg-gray-100 rounded-md' : 'cursor-default'
          } ${isCategory ? 'font-medium' : ''} ${selected && isSelectable ? 'bg-gray-50' : ''}`}
          onDoubleClick={() => {
            if (isSelectable) {
              if (selected) {
                handleMoveLeft(item.id)
              } else {
                handleMoveRight(item.id)
              }
            }
          }}
        >
          {item.name}
          {item.sku && <span className="ml-2 text-sm text-gray-500">({item.sku})</span>}
        </div>
        {hasChildren && (
          <div className="ml-4">
            {item.children.map(child => renderItem(child, selected))}
          </div>
        )}
      </div>
    )
  }

  const filteredAvailableItems = items.filter(item => 
    !selectedIds.includes(item.id) &&
    (item.name.toLowerCase().includes(searchLeft.toLowerCase()) ||
     (item.sku && item.sku.toLowerCase().includes(searchLeft.toLowerCase())))
  )

  const filteredSelectedItems = items.filter(item =>
    selectedIds.includes(item.id) &&
    (item.name.toLowerCase().includes(searchRight.toLowerCase()) ||
     (item.sku && item.sku.toLowerCase().includes(searchRight.toLowerCase())))
  )

  const handleMoveRight = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item && (onlyCategories ? item.type === 'category' : item.type === 'product')) {
      onChange([...selectedIds, itemId])
    }
  }

  const handleMoveLeft = (itemId: string) => {
    onChange(selectedIds.filter(id => id !== itemId))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <div className="flex space-x-4">
        {/* Available Items */}
        <div className="flex-1 border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search available..."
                value={searchLeft}
                onChange={(e) => setSearchLeft(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <div className="p-4 h-96 overflow-y-auto">
            {buildHierarchy(filteredAvailableItems).map(item => (
              <div key={item.id} onClick={() => handleMoveRight(item.id)}>
                {renderItem(item, false)}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col justify-center space-y-4">
          <button
            type="button"
            onClick={() => {
              const nextItem = filteredAvailableItems.find(item => 
                onlyCategories ? item.type === 'category' : item.type === 'product'
              )
              if (nextItem) handleMoveRight(nextItem.id)
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => {
              const nextItem = filteredSelectedItems[0]
              if (nextItem) handleMoveLeft(nextItem.id)
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Selected Items */}
        <div className="flex-1 border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search selected..."
                value={searchRight}
                onChange={(e) => setSearchRight(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
          <div className="p-4 h-96 overflow-y-auto">
            {buildHierarchy(filteredSelectedItems).map(item => (
              <div key={item.id} onClick={() => handleMoveLeft(item.id)}>
                {renderItem(item, true)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}