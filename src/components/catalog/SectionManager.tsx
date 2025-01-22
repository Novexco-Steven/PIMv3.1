import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, GripVertical, Edit, Trash2 } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  description: string;
  order: number;
  pages: { id: string; page_number: number }[];
}

interface SectionManagerProps {
  sections: Section[];
  onAddSection: () => void;
  onEditSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onReorderSections: (newOrder: { id: string; order: number }[]) => void;
}

export function SectionManager({
  sections,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onReorderSections,
}: SectionManagerProps) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = items.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    onReorderSections(newOrder);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Sections</h3>
        <button
          onClick={onAddSection}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Section
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            {...provided.dragHandleProps}
                            className="mr-3 text-gray-400 cursor-move"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {section.name}
                            </h4>
                            {section.description && (
                              <p className="text-sm text-gray-500">
                                {section.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {section.pages.length} pages
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEditSection(section.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteSection(section.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
