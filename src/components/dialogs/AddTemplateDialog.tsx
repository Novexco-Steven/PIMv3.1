import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    description: string;
    column_count: number;
    row_count: number;
    is_default: boolean;
  }) => void;
  initialData?: {
    name: string;
    description: string;
    column_count: number;
    row_count: number;
    is_default: boolean;
  };
}

export function AddTemplateDialog({
  isOpen,
  onClose,
  onAdd,
  initialData,
}: AddTemplateDialogProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      description: '',
      column_count: 2,
      row_count: 2,
      is_default: false,
    }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">
            {initialData ? 'Edit Template' : 'Add Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="column_count"
                className="block text-sm font-medium text-gray-700"
              >
                Columns
              </label>
              <input
                type="number"
                id="column_count"
                min="1"
                required
                value={formData.column_count}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    column_count: parseInt(e.target.value),
                  }))
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="row_count"
                className="block text-sm font-medium text-gray-700"
              >
                Rows
              </label>
              <input
                type="number"
                id="row_count"
                min="1"
                required
                value={formData.row_count}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    row_count: parseInt(e.target.value),
                  }))
                }
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_default: e.target.checked,
                }))
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_default"
              className="ml-2 block text-sm text-gray-900"
            >
              Set as default template
            </label>
          </div>

          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
            >
              {initialData ? 'Save Changes' : 'Add Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
