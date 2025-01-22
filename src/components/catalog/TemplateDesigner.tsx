import React, { useState } from 'react';
import { Grid, Plus, Minus, Save } from 'lucide-react';
import { CellPropertiesPanel } from './CellPropertiesPanel';

interface Cell {
  id: string;
  row_index: number;
  column_index: number;
  row_span: number;
  column_span: number;
  height?: number;
  width?: number;
  content_type: 'Product' | 'Custom';
  custom_content?: string;
}

interface TemplateDesignerProps {
  columnCount: number;
  rowCount: number;
  cells: Cell[];
  onUpdateGrid: (columns: number, rows: number) => void;
  onCellClick: (cell: Cell) => void;
  onCellUpdate: (cell: Cell) => void;
  onCellDelete: () => void;
}

export function TemplateDesigner({
  columnCount,
  rowCount,
  cells,
  onUpdateGrid,
  onCellClick,
  onCellUpdate,
  onCellDelete,
}: TemplateDesignerProps) {
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);

  const handleCellClick = (cell: Cell) => {
    setSelectedCell(cell);
    onCellClick(cell);
  };

  return (
    <div className="space-y-6">
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
                      onClick={() => onUpdateGrid(columnCount - 1, rowCount)}
                      disabled={columnCount <= 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">{columnCount}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateGrid(columnCount + 1, rowCount)}
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
                      onClick={() => onUpdateGrid(columnCount, rowCount - 1)}
                      disabled={rowCount <= 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center">{rowCount}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateGrid(columnCount, rowCount + 1)}
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

      {/* Grid Layout */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div
            className="bg-white border-2 border-gray-200 rounded-lg p-8"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rowCount}, minmax(100px, auto))`,
              gap: '1rem',
            }}
          >
            {Array.from({ length: rowCount }).map((_, rowIndex) =>
              Array.from({ length: columnCount }).map((_, columnIndex) => {
                const cell = cells.find(
                  (c) =>
                    c.row_index === rowIndex && c.column_index === columnIndex
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
                      gridRow: cell ? `span ${cell.row_span}` : undefined,
                      gridColumn: cell ? `span ${cell.column_span}` : undefined,
                      height: cell?.height,
                      width: cell?.width,
                    }}
                    onClick={() => cell && handleCellClick(cell)}
                  >
                    {cell ? (
                      <div className="h-full w-full p-4">
                        {cell.content_type === 'Product' ? (
                          <div className="text-sm text-gray-500">
                            Product Content
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {cell.custom_content || 'Custom Content'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                        Empty Cell
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="col-span-1">
          <CellPropertiesPanel
            cell={selectedCell}
            onUpdate={onCellUpdate}
            onDelete={onCellDelete}
          />
        </div>
      </div>
    </div>
  );
}
