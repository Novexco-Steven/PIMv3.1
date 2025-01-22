import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';

interface Page {
  id: string;
  page_number: number;
  section_id: string | null;
}

interface Section {
  id: string;
  name: string;
  pages: Page[];
}

interface PageReorderProps {
  sections: Section[];
  onReorder: (
    sectionId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => void;
}

export function PageReorder({ sections, onReorder }: PageReorderProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sectionId = result.source.droppableId;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    onReorder(sectionId, sourceIndex, destinationIndex);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {sections.map((section) => (
        <div key={section.id} className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {section.name}
          </h3>
          <Droppable droppableId={section.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {section.pages.map((page, index) => (
                  <Draggable key={page.id} draggableId={page.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white border border-gray-200 rounded-lg p-3 flex items-center"
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="mr-3 text-gray-400"
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <span className="text-sm">Page {page.page_number}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      ))}
    </DragDropContext>
  );
}
