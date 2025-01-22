import { useState } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { supabase } from '../lib/supabase';

interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  metadata: Record<string, any>;
  children: CatalogCategory[];
}

interface CategoryPath {
  id: string;
  name: string;
  parent_id: string | null;
  depth: number;
}

export function useCatalogCategories() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const { optimisticData, error, updateOptimistically } =
    useOptimisticUpdate<CatalogCategory[]>();

  const createCategory = async (
    category: Omit<CatalogCategory, 'id' | 'children'>
  ) => {
    const newCategory = { ...category, id: '', children: [] };
    const updatedCategories = [...categories, newCategory];

    await updateOptimistically(
      async () => {
        // Create category
        const { data: categoryData, error: categoryError } = await supabase
          .from('catalog_categories')
          .insert([
            {
              name: category.name,
              description: category.description,
              parent_id: category.parent_id,
            },
          ])
          .select()
          .single();

        if (categoryError) throw categoryError;

        // Add metadata if provided
        if (category.metadata && Object.keys(category.metadata).length > 0) {
          const { error: metadataError } = await supabase
            .from('catalog_category_metadata')
            .insert(
              Object.entries(category.metadata).map(([key, value]) => ({
                category_id: categoryData.id,
                key,
                value: JSON.stringify(value),
              }))
            );

          if (metadataError) throw metadataError;
        }

        return categoryData;
      },
      updatedCategories,
      () => setCategories(categories)
    );

    setCategories(updatedCategories);
  };

  const updateCategory = async (
    categoryId: string,
    updates: Partial<CatalogCategory>
  ) => {
    const updatedCategories = categories.map((category) =>
      category.id === categoryId ? { ...category, ...updates } : category
    );

    await updateOptimistically(
      async () => {
        // Update basic category info
        const { error: categoryError } = await supabase
          .from('catalog_categories')
          .update({
            name: updates.name,
            description: updates.description,
            parent_id: updates.parent_id,
          })
          .eq('id', categoryId);

        if (categoryError) throw categoryError;

        // Update metadata if provided
        if (updates.metadata) {
          // First, delete existing metadata
          const { error: deleteError } = await supabase
            .from('catalog_category_metadata')
            .delete()
            .eq('category_id', categoryId);

          if (deleteError) throw deleteError;

          // Then insert new metadata
          if (Object.keys(updates.metadata).length > 0) {
            const { error: metadataError } = await supabase
              .from('catalog_category_metadata')
              .insert(
                Object.entries(updates.metadata).map(([key, value]) => ({
                  category_id: categoryId,
                  key,
                  value: JSON.stringify(value),
                }))
              );

            if (metadataError) throw metadataError;
          }
        }
      },
      updatedCategories,
      () => setCategories(categories)
    );

    setCategories(updatedCategories);
  };

  const deleteCategory = async (categoryId: string) => {
    const updatedCategories = categories.filter((c) => c.id !== categoryId);

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;
      },
      updatedCategories,
      () => setCategories(categories)
    );

    setCategories(updatedCategories);
  };

  const moveCategory = async (
    categoryId: string,
    newParentId: string | null
  ) => {
    const updatedCategories = categories.map((category) =>
      category.id === categoryId
        ? { ...category, parent_id: newParentId }
        : category
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_categories')
          .update({ parent_id: newParentId })
          .eq('id', categoryId);

        if (error) throw error;
      },
      updatedCategories,
      () => setCategories(categories)
    );

    setCategories(updatedCategories);
  };

  const getCategoryPath = async (
    categoryId: string
  ): Promise<CategoryPath[]> => {
    try {
      const { data, error } = await supabase
        .from('catalog_category_hierarchy')
        .select(
          `
          ancestor:catalog_categories!ancestor_id (
            id,
            name,
            parent_id
          ),
          depth
        `
        )
        .eq('descendant_id', categoryId)
        .order('depth');

      if (error) throw error;

      return data.map((item) => ({
        id: item.ancestor.id,
        name: item.ancestor.name,
        parent_id: item.ancestor.parent_id,
        depth: item.depth,
      }));
    } catch (error) {
      console.error('Error getting category path:', error);
      return [];
    }
  };

  const getDescendants = async (
    categoryId: string
  ): Promise<CategoryPath[]> => {
    try {
      const { data, error } = await supabase
        .from('catalog_category_hierarchy')
        .select(
          `
          descendant:catalog_categories!descendant_id (
            id,
            name,
            parent_id
          ),
          depth
        `
        )
        .eq('ancestor_id', categoryId)
        .order('depth');

      if (error) throw error;

      return data.map((item) => ({
        id: item.descendant.id,
        name: item.descendant.name,
        parent_id: item.descendant.parent_id,
        depth: item.depth,
      }));
    } catch (error) {
      console.error('Error getting category descendants:', error);
      return [];
    }
  };

  const buildCategoryTree = (
    flatCategories: CatalogCategory[]
  ): CatalogCategory[] => {
    const categoryMap = new Map<string, CatalogCategory>();
    const rootCategories: CatalogCategory[] = [];

    // First pass: create category map
    flatCategories.forEach((category) => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build tree structure
    flatCategories.forEach((category) => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  };

  return {
    categories,
    error,
    setCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    getCategoryPath,
    getDescendants,
    buildCategoryTree,
  };
}
