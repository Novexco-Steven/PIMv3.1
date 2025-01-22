import { useState } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { supabase } from '../lib/supabase';

interface Page {
  id: string;
  catalog_id: string;
  page_number: number;
  column_count: number;
  row_count: number;
  section_id: string | null;
  catalog_category_id: string | null;
  cells: Cell[];
}

interface Cell {
  id: string;
  page_id: string;
  row_index: number;
  column_index: number;
  row_span: number;
  column_span: number;
  height?: number;
  width?: number;
  content_type: 'Product' | 'Custom';
  product_id?: string;
  custom_content?: string;
}

export function useCatalogPages(catalogId: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const { optimisticData, error, updateOptimistically } =
    useOptimisticUpdate<Page[]>();

  const createPage = async (
    page: Omit<Page, 'id' | 'catalog_id' | 'cells'>
  ) => {
    const newPage = {
      ...page,
      id: '',
      catalog_id: catalogId,
      cells: [],
    };
    const updatedPages = [...pages, newPage];

    await updateOptimistically(
      async () => {
        const { data, error } = await supabase
          .from('catalog_pages')
          .insert([
            {
              catalog_id: catalogId,
              page_number: page.page_number,
              column_count: page.column_count,
              row_count: page.row_count,
              section_id: page.section_id,
              catalog_category_id: page.catalog_category_id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const updatePage = async (pageId: string, updates: Partial<Page>) => {
    const updatedPages = pages.map((page) =>
      page.id === pageId ? { ...page, ...updates } : page
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_pages')
          .update(updates)
          .eq('id', pageId);

        if (error) throw error;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const deletePage = async (pageId: string) => {
    const pageToDelete = pages.find((p) => p.id === pageId);
    if (!pageToDelete) return;

    const updatedPages = pages
      .filter((p) => p.id !== pageId)
      .map((p) => ({
        ...p,
        page_number:
          p.page_number > pageToDelete.page_number
            ? p.page_number - 1
            : p.page_number,
      }));

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_pages')
          .delete()
          .eq('id', pageId);

        if (error) throw error;

        // Update page numbers for remaining pages
        const { error: updateError } = await supabase.rpc(
          'reorder_catalog_pages',
          {
            catalog_id: catalogId,
            deleted_page_number: pageToDelete.page_number,
          }
        );

        if (updateError) throw updateError;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const movePage = async (pageId: string, newPageNumber: number) => {
    const pageToMove = pages.find((p) => p.id === pageId);
    if (!pageToMove) return;

    const updatedPages = pages.map((page) => {
      if (page.id === pageId) {
        return { ...page, page_number: newPageNumber };
      }
      if (pageToMove.page_number < newPageNumber) {
        if (
          page.page_number > pageToMove.page_number &&
          page.page_number <= newPageNumber
        ) {
          return { ...page, page_number: page.page_number - 1 };
        }
      } else {
        if (
          page.page_number >= newPageNumber &&
          page.page_number < pageToMove.page_number
        ) {
          return { ...page, page_number: page.page_number + 1 };
        }
      }
      return page;
    });

    await updateOptimistically(
      async () => {
        const { error } = await supabase.rpc('move_catalog_page', {
          page_id: pageId,
          new_page_number: newPageNumber,
        });

        if (error) throw error;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const updateGrid = async (
    pageId: string,
    columnCount: number,
    rowCount: number
  ) => {
    const updatedPages = pages.map((page) =>
      page.id === pageId
        ? { ...page, column_count: columnCount, row_count: rowCount }
        : page
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_pages')
          .update({
            column_count: columnCount,
            row_count: rowCount,
          })
          .eq('id', pageId);

        if (error) throw error;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const addCell = async (
    pageId: string,
    cell: Omit<Cell, 'id' | 'page_id'>
  ) => {
    const newCell = { ...cell, id: '', page_id: pageId };
    const updatedPages = pages.map((page) =>
      page.id === pageId ? { ...page, cells: [...page.cells, newCell] } : page
    );

    await updateOptimistically(
      async () => {
        const { data, error } = await supabase
          .from('catalog_cells')
          .insert([
            {
              page_id: pageId,
              row_index: cell.row_index,
              column_index: cell.column_index,
              row_span: cell.row_span,
              column_span: cell.column_span,
              height: cell.height,
              width: cell.width,
              content_type: cell.content_type,
              product_id: cell.product_id,
              custom_content: cell.custom_content,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const updateCell = async (
    pageId: string,
    cellId: string,
    updates: Partial<Cell>
  ) => {
    const updatedPages = pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            cells: page.cells.map((cell) =>
              cell.id === cellId ? { ...cell, ...updates } : cell
            ),
          }
        : page
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_cells')
          .update(updates)
          .eq('id', cellId);

        if (error) throw error;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const deleteCell = async (pageId: string, cellId: string) => {
    const updatedPages = pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            cells: page.cells.filter((cell) => cell.id !== cellId),
          }
        : page
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_cells')
          .delete()
          .eq('id', cellId);

        if (error) throw error;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  return {
    pages,
    error,
    setPages,
    createPage,
    updatePage,
    deletePage,
    movePage,
    updateGrid,
    addCell,
    updateCell,
    deleteCell,
  };
}
