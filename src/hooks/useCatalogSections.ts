import { useState } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { supabase } from '../lib/supabase';

interface Section {
  id: string;
  catalog_id: string;
  name: string;
  description: string;
  order: number;
  pages: Page[];
}

interface Page {
  id: string;
  page_number: number;
}

export function useCatalogSections(catalogId: string) {
  const [sections, setSections] = useState<Section[]>([]);
  const { optimisticData, error, updateOptimistically } =
    useOptimisticUpdate<Section[]>();

  const createSection = async (
    section: Omit<Section, 'id' | 'catalog_id' | 'pages'>
  ) => {
    const newSection = {
      ...section,
      id: '',
      catalog_id: catalogId,
      pages: [],
    };
    const updatedSections = [...sections, newSection];

    await updateOptimistically(
      async () => {
        const { data, error } = await supabase
          .from('catalog_sections')
          .insert([
            {
              catalog_id: catalogId,
              name: section.name,
              description: section.description,
              order: section.order,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      updatedSections,
      () => setSections(sections)
    );

    setSections(updatedSections);
  };

  const updateSection = async (
    sectionId: string,
    updates: Partial<Section>
  ) => {
    const updatedSections = sections.map((section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_sections')
          .update(updates)
          .eq('id', sectionId);

        if (error) throw error;
      },
      updatedSections,
      () => setSections(sections)
    );

    setSections(updatedSections);
  };

  const deleteSection = async (sectionId: string) => {
    const updatedSections = sections.filter((s) => s.id !== sectionId);

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_sections')
          .delete()
          .eq('id', sectionId);

        if (error) throw error;
      },
      updatedSections,
      () => setSections(sections)
    );

    setSections(updatedSections);
  };

  const reorderSections = async (newOrder: { id: string; order: number }[]) => {
    const updatedSections = sections.map((section) => {
      const orderItem = newOrder.find((o) => o.id === section.id);
      return orderItem ? { ...section, order: orderItem.order } : section;
    });

    await updateOptimistically(
      async () => {
        // Use a transaction to update all sections at once
        const { error } = await supabase.rpc('reorder_catalog_sections', {
          section_orders: newOrder,
        });

        if (error) throw error;
      },
      updatedSections,
      () => setSections(sections)
    );

    setSections(updatedSections);
  };

  const movePageToSection = async (
    pageId: string,
    sectionId: string | null
  ) => {
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          pages: [
            ...section.pages,
            { id: pageId, page_number: section.pages.length + 1 },
          ],
        };
      }
      return {
        ...section,
        pages: section.pages.filter((p) => p.id !== pageId),
      };
    });

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_pages')
          .update({ section_id: sectionId })
          .eq('id', pageId);

        if (error) throw error;
      },
      updatedSections,
      () => setSections(sections)
    );

    setSections(updatedSections);
  };

  return {
    sections,
    error,
    setSections,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    movePageToSection,
  };
}
