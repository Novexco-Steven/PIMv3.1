import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  children: Category[];
}

interface CategoryTreeProps {
  categories: Category[];
  onAddCategory: (parentId: string | null) => void;
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onSelectCategory: (id: string) => void;
  selectedCategoryId?: string;
}

export function CategoryTree({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onSelectCategory,
  selectedCategoryId,
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderCategory = (category: Category, depth = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = category.id === selectedCategoryId;

    return (
      <div key={category.id} className="space-y-1">
        <div
          className={`
            flex items-center justify-between py-2 px-3 rounded-md cursor-pointer
            ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}
          `}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
        >
          <div
            className="flex items-center flex-1"
            onClick={() => onSelectCategory(category.id)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className="mr-2 text-gray-400 hover:text-gray-600"
            >
              {category.children.length > 0 ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                <FolderTree className="h-4 w-4" />
              )}
            </button>
            <span
              className={`text-sm ${
                isSelected ? 'font-medium text-indigo-600' : 'text-gray-900'
              }`}
            >
              {category.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddCategory(category.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory(category.id);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category.id);
              }}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && category.children.length > 0 && (
          <div className="space-y-1">
            {category.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        <button
          type="button"
          onClick={() => onAddCategory(null)}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Root Category
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4">
          {categories.length > 0 ? (
            <div className="space-y-1">
              {categories.map((category) => renderCategory(category))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 py-4">
              No categories yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
