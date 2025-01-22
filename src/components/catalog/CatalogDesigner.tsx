import React, { useState } from 'react';
import { Grid, Plus, Minus, Save } from 'lucide-react';
import { PaginationControls } from './PaginationControls';
import { PreviewMode } from './PreviewMode';

interface Page {
  id: string;
  pageNumber: number;
  columnCount: number;
  rowCount: number;
  cells: Cell[];
}

interface Cell {
  id: string;
  rowIndex: number;
  columnIndex: number;
  rowSpan: number;
  columnSpan: number;
  height?: number;
  width?: number;
  contentType: 'Product' | 'Custom';
  productId?: string;
  customContent?: string;
}

interface CatalogDesignerProps {
  pages: Page[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  onMovePage: (direction: 'up' | 'down') => void;
  onUpdateGrid: (columns: number, rows: number) => void;
  onCellClick: (cell: Cell) => void;
  onCellDrop: (data: any, rowIndex: number, columnIndex: number) => void;
}

export function CatalogDesigner({
  pages,
  currentPage,
  onPageChange,
  onAddPage,
  onDeletePage,
  onMovePage,
  onUpdateGrid,
  onCellClick,
  onCellDrop,
}: CatalogDesignerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const currentPageData = pages.find((p) => p.pageNumber === currentPage);

  if (!currentPageData) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (
    e: React.DragEvent,
    rowIndex: number,
    columnIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onCellDrop(data, rowIndex, columnIndex);
    } catch (error) {
      console.error('Error parsing drop data:', error);
    }
  };

  const handleDeletePage = () => {
    if (pages.length > 1) {
      onDeletePage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Grid Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Grid className="h-5 w-5 text-gray-400" />
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Columns:
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateGrid(
                          currentPageData.columnCount - 1,
                          currentPageData.rowCount
                        )
                      }
                      disabled={currentPageData.columnCount <= 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">
                      {currentPageData.columnCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateGrid(
                          currentPageData.columnCount + 1,
                          currentPageData.rowCount
                        )
                      }
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Rows:
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateGrid(
                          currentPageData.columnCount,
                          currentPageData.rowCount - 1
                        )
                      }
                      disabled={currentPageData.rowCount <= 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">
                      {currentPageData.rowCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateGrid(
                          currentPageData.columnCount,
                          currentPageData.rowCount + 1
                        )
                      }
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={pages.length}
        onPageChange={onPageChange}
        onAddPage={onAddPage}
        onDeletePage={handleDeletePage}
        onMovePage={onMovePage}
        canDeletePage={pages.length > 1}
      />

      {/* Grid Layout */}
      <div
        className="bg-white border-2 border-gray-200 rounded-lg p-8"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${currentPageData.columnCount}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${currentPageData.rowCount}, minmax(100px, auto))`,
          gap: '1rem',
        }}
      >
        {Array.from({ length: currentPageData.rowCount }).map((_, rowIndex) =>
          Array.from({ length: currentPageData.columnCount }).map(
            (_, columnIndex) => {
              const cell = currentPageData.cells.find(
                (c) => c.rowIndex === rowIndex && c.columnIndex === columnIndex
              );

              return (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  className={`
                  border-2 border-dashed border-gray-300 rounded-lg
                  ${cell ? 'bg-gray-50' : 'bg-white'}
                  hover:border-indigo-300 transition-colors
                  cursor-pointer
                `}
                  style={{
                    gridRow: cell ? `span ${cell.rowSpan}` : undefined,
                    gridColumn: cell ? `span ${cell.columnSpan}` : undefined,
                    height: cell?.height,
                    width: cell?.width,
                  }}
                  onClick={() => cell && onCellClick(cell)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex, columnIndex)}
                >
                  {cell ? (
                    <div className="h-full w-full p-4">
                      {cell.contentType === 'Product' ? (
                        <div className="text-sm text-gray-500">
                          Product Content
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {cell.customContent || 'Custom Content'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                      Drop content here
                    </div>
                  )}
                </div>
              );
            }
          )
        )}
      </div>

      {/* Preview Mode */}
      {showPreview && (
        <PreviewMode
          pages={pages}
          currentPage={currentPage}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
