import { useState } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { supabase } from '../lib/supabase';

interface PageContent {
  id: string;
  page_id: string;
  content_type: 'Product' | 'Custom';
  product_id?: string;
  custom_content?: string;
  position: {
    row_index: number;
    column_index: number;
    row_span: number;
    column_span: number;
    height?: number;
    width?: number;
  };
}

export function useCatalogPageContent(pageId: string) {
  const [content, setContent] = useState<PageContent[]>([]);
  const { optimisticData, error, updateOptimistically } =
    useOptimisticUpdate<PageContent[]>();

  const addContent = async (
    newContent: Omit<PageContent, 'id' | 'page_id'>
  ) => {
    const contentItem = { ...newContent, id: '', page_id: pageId };
    const updatedContent = [...content, contentItem];

    await updateOptimistically(
      async () => {
        const { data, error } = await supabase
          .from('catalog_cells')
          .insert([
            {
              page_id: pageId,
              content_type: newContent.content_type,
              product_id: newContent.product_id,
              custom_content: newContent.custom_content,
              row_index: newContent.position.row_index,
              column_index: newContent.position.column_index,
              row_span: newContent.position.row_span,
              column_span: newContent.position.column_span,
              height: newContent.position.height,
              width: newContent.position.width,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      updatedContent,
      () => setContent(content)
    );

    setContent(updatedContent);
  };

  const updateContent = async (
    contentId: string,
    updates: Partial<PageContent>
  ) => {
    const updatedContent = content.map((item) =>
      item.id === contentId ? { ...item, ...updates } : item
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_cells')
          .update({
            content_type: updates.content_type,
            product_id: updates.product_id,
            custom_content: updates.custom_content,
            row_index: updates.position?.row_index,
            column_index: updates.position?.column_index,
            row_span: updates.position?.row_span,
            column_span: updates.position?.column_span,
            height: updates.position?.height,
            width: updates.position?.width,
          })
          .eq('id', contentId);

        if (error) throw error;
      },
      updatedContent,
      () => setContent(content)
    );

    setContent(updatedContent);
  };

  const removeContent = async (contentId: string) => {
    const updatedContent = content.filter((item) => item.id !== contentId);

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_cells')
          .delete()
          .eq('id', contentId);

        if (error) throw error;
      },
      updatedContent,
      () => setContent(content)
    );

    setContent(updatedContent);
  };

  const moveContent = async (
    contentId: string,
    newPosition: PageContent['position']
  ) => {
    const updatedContent = content.map((item) =>
      item.id === contentId ? { ...item, position: newPosition } : item
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_cells')
          .update({
            row_index: newPosition.row_index,
            column_index: newPosition.column_index,
            row_span: newPosition.row_span,
            column_span: newPosition.column_span,
            height: newPosition.height,
            width: newPosition.width,
          })
          .eq('id', contentId);

        if (error) throw error;
      },
      updatedContent,
      () => setContent(content)
    );

    setContent(updatedContent);
  };

  const resizeContent = async (
    contentId: string,
    dimensions: { height?: number; width?: number }
  ) => {
    const updatedContent = content.map((item) =>
      item.id === contentId
        ? {
            ...item,
            position: {
              ...item.position,
              ...dimensions,
            },
          }
        : item
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_cells')
          .update(dimensions)
          .eq('id', contentId);

        if (error) throw error;
      },
      updatedContent,
      () => setContent(content)
    );

    setContent(updatedContent);
  };

  return {
    content,
    error,
    setContent,
    addContent,
    updateContent,
    removeContent,
    moveContent,
    resizeContent,
  };
}
