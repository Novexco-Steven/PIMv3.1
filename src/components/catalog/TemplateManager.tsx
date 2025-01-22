import { useState, useEffect } from 'react';
import { Plus, Save, Copy, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Template {
  id: string;
  name: string;
  description: string;
  column_count: number;
  row_count: number;
  is_default: boolean;
  cells: TemplateCell[];
}

interface TemplateCell {
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

interface TemplateManagerProps {
  onApplyTemplate: (template: Template) => void;
  onSaveAsTemplate: () => void;
}

export function TemplateManager({
  onApplyTemplate,
  onSaveAsTemplate,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('catalog_templates')
          .select(
            `
            id,
            name,
            description,
            column_count,
            row_count,
            is_default,
            cells:catalog_template_cells(*)
          `
          )
          .order('name');

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSaveTemplate = async () => {
    try {
      const { error } = await supabase.from('catalog_templates').insert([
        {
          name: newTemplate.name,
          description: newTemplate.description,
          column_count: 2,
          row_count: 2,
        },
      ]);

      if (error) throw error;
      setShowSaveDialog(false);
      setNewTemplate({ name: '', description: '' });
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('catalog_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (loading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Templates</h3>
        <div className="flex space-x-2">
          <button
            onClick={onSaveAsTemplate}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
          >
            <Save className="h-4 w-4 mr-1" />
            Save as Template
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-500">{template.description}</p>
                <div className="mt-1 text-xs text-gray-400">
                  {template.column_count}x{template.row_count} grid
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onApplyTemplate(template)}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="Apply template"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {!template.is_default && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Save Template
            </h3>
            <div className="space-y-4">
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
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
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
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
