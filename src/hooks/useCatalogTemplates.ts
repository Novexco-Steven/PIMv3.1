import { useState } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { supabase } from '../lib/supabase';

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

export function useCatalogTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const { optimisticData, error, updateOptimistically } =
    useOptimisticUpdate<Template[]>();

  const createTemplate = async (template: Omit<Template, 'id'>) => {
    const newTemplate = { ...template, id: '' };
    const updatedTemplates = [...templates, newTemplate];

    await updateOptimistically(
      async () => {
        // Create template
        const { data: templateData, error: templateError } = await supabase
          .from('catalog_templates')
          .insert([
            {
              name: template.name,
              description: template.description,
              column_count: template.column_count,
              row_count: template.row_count,
              is_default: template.is_default,
            },
          ])
          .select()
          .single();

        if (templateError) throw templateError;

        // Create cells
        if (template.cells.length > 0) {
          const { error: cellsError } = await supabase
            .from('catalog_template_cells')
            .insert(
              template.cells.map((cell) => ({
                template_id: templateData.id,
                row_index: cell.row_index,
                column_index: cell.column_index,
                row_span: cell.row_span,
                column_span: cell.column_span,
                height: cell.height,
                width: cell.width,
                content_type: cell.content_type,
                custom_content: cell.custom_content,
              }))
            );

          if (cellsError) throw cellsError;
        }

        return templateData;
      },
      updatedTemplates,
      () => setTemplates(templates)
    );

    setTemplates(updatedTemplates);
  };

  const updateTemplate = async (
    templateId: string,
    updates: Partial<Template>
  ) => {
    const updatedTemplates = templates.map((template) =>
      template.id === templateId ? { ...template, ...updates } : template
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_templates')
          .update(updates)
          .eq('id', templateId);

        if (error) throw error;
      },
      updatedTemplates,
      () => setTemplates(templates)
    );

    setTemplates(updatedTemplates);
  };

  const deleteTemplate = async (templateId: string) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId);

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_templates')
          .delete()
          .eq('id', templateId);

        if (error) throw error;
      },
      updatedTemplates,
      () => setTemplates(templates)
    );

    setTemplates(updatedTemplates);
  };

  const applyTemplate = async (templateId: string, pageId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    try {
      // First, delete existing cells
      const { error: deleteError } = await supabase
        .from('catalog_cells')
        .delete()
        .eq('page_id', pageId);

      if (deleteError) throw deleteError;

      // Update page grid
      const { error: pageError } = await supabase
        .from('catalog_pages')
        .update({
          column_count: template.column_count,
          row_count: template.row_count,
        })
        .eq('id', pageId);

      if (pageError) throw pageError;

      // Create new cells from template
      if (template.cells.length > 0) {
        const { error: cellsError } = await supabase
          .from('catalog_cells')
          .insert(
            template.cells.map((cell) => ({
              page_id: pageId,
              row_index: cell.row_index,
              column_index: cell.column_index,
              row_span: cell.row_span,
              column_span: cell.column_span,
              height: cell.height,
              width: cell.width,
              content_type: cell.content_type,
              custom_content: cell.custom_content,
            }))
          );

        if (cellsError) throw cellsError;
      }
    } catch (error) {
      console.error('Error applying template:', error);
      throw error;
    }
  };

  return {
    templates,
    error,
    setTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  };
}
