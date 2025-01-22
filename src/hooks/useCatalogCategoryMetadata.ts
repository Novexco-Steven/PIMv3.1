import { useState } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { supabase } from '../lib/supabase';

interface CategoryMetadata {
  id: string;
  category_id: string;
  key: string;
  value: any;
}

export function useCatalogCategoryMetadata(categoryId: string) {
  const [metadata, setMetadata] = useState<Record<string, CategoryMetadata>>({});
  const { error, updateOptimistically } =
    useOptimisticUpdate<Record<string, CategoryMetadata>>();

  const setMetadataValue = async (key: string, value: CategoryMetadata) => {
    const updatedMetadata = { ...metadata, [key]: value };

    await updateOptimistically(
      async () => {
        // Check if key exists
        const { data: existing } = await supabase
          .from('catalog_category_metadata')
          .select('id')
          .eq('category_id', categoryId)
          .eq('key', key)
          .single();

        if (existing) {
          // Update existing metadata
          const { error } = await supabase
            .from('catalog_category_metadata')
            .update({ value: JSON.stringify(value) })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Insert new metadata
          const { error } = await supabase
            .from('catalog_category_metadata')
            .insert([
              {
                category_id: categoryId,
                key,
                value: JSON.stringify(value),
              },
            ]);

          if (error) throw error;
        }
      },
      updatedMetadata,
      () => setMetadata(metadata)
    );

    setMetadata(updatedMetadata);
  };

  const removeMetadataValue = async (key: string) => {
    const { [key]: _, ...updatedMetadata } = metadata;

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_category_metadata')
          .delete()
          .eq('category_id', categoryId)
          .eq('key', key);

        if (error) throw error;
      },
      updatedMetadata,
      () => setMetadata(metadata)
    );

    setMetadata(updatedMetadata);
  };

  const clearMetadata = async () => {
    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_category_metadata')
          .delete()
          .eq('category_id', categoryId);

        if (error) throw error;
      },
      {},
      () => setMetadata(metadata)
    );

    setMetadata({});
  };

  return {
    metadata,
    error,
    setMetadata,
    setMetadataValue,
    removeMetadataValue,
    clearMetadata,
  };
}
