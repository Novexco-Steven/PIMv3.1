import { useState } from 'react';
import { useOptimisticUpdate } from './useOptimisticUpdate';
import { supabase } from '../lib/supabase';

interface Page {
  id: string;
  pageNumber: number;
  columnCount: number;
  rowCount: number;
  catalog_category_id: string | null;
  cells: Cell[];
}

interface Cell {
  id: string;
  rowIndex: number;
  columnIndex: number;
  rowSpan: number;
  columnSpan: number;
  height?: number;
  width?: number;
  contentType: 'Product' | 'Custom';
  productId?: string;
  customContent?: string;
}

export function useCatalogDesigner(catalogId: string) {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { error, updateOptimistically } =
    useOptimisticUpdate<Page[]>();

  const addPage = async () => {
    const newPageNumber = pages.length + 1;
    const newPage: Page = {
      id: '',
      pageNumber: newPageNumber,
      columnCount: 2,
      rowCount: 2,
      catalog_category_id: null,
      cells: [],
    };

    await updateOptimistically(
      async () => {
        const { data, error } = await supabase
          .from('catalog_pages')
          .insert({
            catalog_id: catalogId,
            page_number: newPageNumber,
            column_count: 2,
            row_count: 2,
          })
          .select()
          .single();

        if (error) throw error;
        newPage.id = data.id;
        return data;
      },
      [...pages, newPage],
      () => setPages(pages)
    );

    setPages((prev) => [...prev, newPage]);
    setCurrentPage(newPageNumber);
  };

  const deletePage = async (pageId: string) => {
    const pageToDelete = pages.find((p) => p.id === pageId);
    if (!pageToDelete) return;

    const updatedPages = pages
      .filter((p) => p.id !== pageId)
      .map((p) => ({
        ...p,
        pageNumber:
          p.pageNumber > pageToDelete.pageNumber
            ? p.pageNumber - 1
            : p.pageNumber,
      }));

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_pages')
          .delete()
          .eq('id', pageId);

        if (error) throw error;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
    setCurrentPage(Math.max(1, currentPage - 1));
  };

  const updateGrid = async (pageId: string, columns: number, rows: number) => {
    const updatedPages = pages.map((page) =>
      page.id === pageId
        ? { ...page, columnCount: columns, rowCount: rows }
        : page
    );

    await updateOptimistically(
      async () => {
        const { error } = await supabase
          .from('catalog_pages')
          .update({
            column_count: columns,
            row_count: rows,
          })
          .eq('id', pageId);

        if (error) throw error;
      },
      updatedPages,
      () => setPages(pages)
    );

    setPages(updatedPages);
  };

  const addCell = async (pageId: string, cell: Omit<Cell, 'id'>) => {
    const newCell = { ...cell, id: '' };
    const updatedPages = pages.map((page) =>
      page.id === pageId ? { ...page, cells: [...page.cells, newCell] } : page
    );

    await updateOptimistically(
      async () => {
        const { data, error } = await supabase
          .from('catalog_cells')
          .insert({
            page_id: pageId,
            row_index: cell.rowIndex,
            column_index: cell.columnIndex,
            row_span: cell.rowSpan,
            column_span: cell.columnSpan,
            height: cell.height,
            width: cell.width,
            content_type: cell.contentType,
            product_id: cell.productId,
            custom_content: cell.customContent,
          })
          .select()
          .single();

        if (error) throw error;
        newCell.id = data.id;
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
    currentPage,
    error,
    setPages,
    setCurrentPage,
    addPage,
    deletePage,
    updateGrid,
    addCell,
    updateCell,
    deleteCell,
  };
}
