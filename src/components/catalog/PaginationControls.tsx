import React from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, MoveUp, MoveDown } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onAddPage: () => void
  onDeletePage: () => void
  onMovePage: (direction: 'up' | 'down') => void
  canDeletePage: boolean
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  onDeletePage,
  onMovePage,
  canDeletePage
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="border-r border-gray-200 pr-2 mr-2">
          <button
            type="button"
            onClick={() => onMovePage('up')}
            disabled={currentPage === 1}
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            title="Move page up"
          >
            <MoveUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMovePage('down')}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 ml-1"
            title="Move page down"
          >
            <MoveDown className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onDeletePage}
          disabled={!canDeletePage}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Page
        </button>
        <button
          type="button"
          onClick={onAddPage}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Page
        </button>
      </div>
    </div>
  )
}