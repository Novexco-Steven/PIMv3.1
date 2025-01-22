import React, { useState } from 'react'
import { FileDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Section {
  id: string
  name: string
  pages: Page[]
}

interface Page {
  id: string
  pageNumber: number
  section_id: string | null
  columnCount: number
  rowCount: number
  cells: Cell[]
  category?: {
    name: string
  }
}

interface Cell {
  contentType: 'Product' | 'Custom'
  product?: {
    name: string
    sku: string
    description: string
    price?: number
  }
  customContent?: string
  columnIndex: number
  rowIndex: number
  columnSpan: number
  rowSpan: number
}

interface PDFExportProps {
  catalogName: string
  sections: Section[]
  pages: Page[]
  onExport: () => void
}

export function PDFExport({ catalogName, sections, pages, onExport }: PDFExportProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      const doc = new jsPDF()
      
      // Cover Page
      doc.setFontSize(24)
      doc.text(catalogName, 20, 40, { align: 'center' })
      doc.setFontSize(12)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 50, { align: 'center' })
      
      // Table of Contents
      doc.addPage()
      doc.setFontSize(20)
      doc.text('Table of Contents', 20, 20)
      
      let y = 40
      sections.forEach((section, index) => {
        doc.setFontSize(14)
        doc.text(`${index + 1}. ${section.name}`, 20, y)
        y += 10
        
        section.pages.forEach(page => {
          doc.setFontSize(12)
          doc.text(`   Page ${page.pageNumber}`, 30, y)
          y += 7
          
          if (y > 250) {
            doc.addPage()
            y = 20
          }
        })
        
        y += 5
      })
      
      // Category Index
      doc.addPage()
      doc.setFontSize(20)
      doc.text('Category Index', 20, 20)
      
      const categoryPages = new Map<string, number[]>()
      pages.forEach(page => {
        if (page.category) {
          const existing = categoryPages.get(page.category.name) || []
          categoryPages.set(page.category.name, [...existing, page.pageNumber])
        }
      })
      
      const categoryData = Array.from(categoryPages.entries()).map(([category, pageNumbers]) => [
        category,
        pageNumbers.join(', ')
      ])
      
      autoTable(doc, {
        head: [['Category', 'Pages']],
        body: categoryData,
        styles: { fontSize: 12 },
        headStyles: { fillColor: [63, 81, 181] },
        startY: 30
      })
      
      // Product Index
      doc.addPage()
      doc.setFontSize(20)
      doc.text('Product Index', 20, 20)
      
      const productData = pages.flatMap(page => 
        page.cells
          .filter(cell => cell.contentType === 'Product' && cell.product)
          .map(cell => [
            cell.product!.name,
            cell.product!.sku,
            `Page ${page.pageNumber}`
          ])
      )
      
      autoTable(doc, {
        startY: 30,
        head: [['Product', 'SKU', 'Page']],
        body: productData,
        styles: { fontSize: 12 },
        headStyles: { fillColor: [63, 81, 181] }
      })
      
      // Content Pages
      pages.forEach((page) => {
        doc.addPage()
        
        // Header
        doc.setFontSize(10)
        doc.text(`Page ${page.pageNumber}`, 190, 10, { align: 'right' })
        if (page.category) {
          doc.text(page.category.name, 20, 10)
        }
        
        // Grid layout
        const margin = 20
        const usableWidth = doc.internal.pageSize.width - (margin * 2)
        const usableHeight = doc.internal.pageSize.height - (margin * 2) - 20 // Account for header
        
        page.cells.forEach(cell => {
          const x = margin + (cell.columnIndex * (usableWidth / page.columnCount))
          const y = margin + 20 + (cell.rowIndex * (usableHeight / page.rowCount))
          const width = (usableWidth / page.columnCount) * cell.columnSpan
          const height = (usableHeight / page.rowCount) * cell.rowSpan
          
          if (cell.contentType === 'Product' && cell.product) {
            doc.setFontSize(12)
            doc.text(cell.product.name, x + 5, y + 10)
            doc.setFontSize(10)
            doc.text(`SKU: ${cell.product.sku}`, x + 5, y + 20)
            if (cell.product.price) {
              doc.text(`Price: $${cell.product.price.toFixed(2)}`, x + 5, y + 30)
            }
            doc.setFontSize(9)
            const lines = doc.splitTextToSize(cell.product.description, width - 10)
            doc.text(lines, x + 5, y + 40)
          } else if (cell.customContent) {
            doc.setFontSize(10)
            const lines = doc.splitTextToSize(cell.customContent, width - 10)
            doc.text(lines, x + 5, y + 10)
          }
          
          // Cell border
          doc.rect(x, y, width, height)
        })
      })
      
      // Save the PDF
      doc.save(`${catalogName.toLowerCase().replace(/\s+/g, '-')}.pdf`)
      onExport()
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setExporting(false)
    }
  }
  
  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
    >
      <FileDown className="h-4 w-4 mr-2" />
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  )
}