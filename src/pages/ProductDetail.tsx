import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BasicInformation } from '../components/product/BasicInformation'
import { ProductImages } from '../components/product/ProductImages'
import { ProductSpecifications } from '../components/product/ProductSpecifications'
import { ProductManufacturers } from '../components/product/ProductManufacturers'
import { ProductSuppliers } from '../components/product/ProductSuppliers'
import { RelatedProducts } from '../components/product/RelatedProducts'
import { ProductDescriptions } from '../components/product/ProductDescriptions'
import { ProductFeaturesBenefits } from '../components/product/ProductFeaturesBenefits'
import { ProductQuestionsAnswers } from '../components/product/ProductQuestionsAnswers'
import { ProductSEO } from '../components/product/ProductSEO'
import { AddRelatedProductDialog } from '../components/dialogs/AddRelatedProductDialog'
import { AddImageDialog } from '../components/dialogs/AddImageDialog'
import { AddSpecificationDialog } from '../components/dialogs/AddSpecificationDialog'
import { AddManufacturerDialog } from '../components/dialogs/AddManufacturerDialog'
import { AddSupplierDialog } from '../components/dialogs/AddSupplierDialog'
import { AddDescriptionDialog } from '../components/dialogs/AddDescriptionDialog'
import { AddFeatureBenefitDialog } from '../components/dialogs/AddFeatureBenefitDialog'
import { AddQuestionAnswerDialog } from '../components/dialogs/AddQuestionAnswerDialog'
import { AddSEODialog } from '../components/dialogs/AddSEODialog'
import { 
  Product, 
  Asset, 
  Specification,
  Manufacturer,
  Supplier
} from '../types/product'

interface Description {
  id: string
  type: 'Raw' | 'Main' | 'Sub' | 'Rich' | 'About'
  description: string
}

interface FeatureBenefit {
  id: string
  type: 'Feature' | 'Benefit'
  value: string
  order: number
}

interface QuestionAnswer {
  id: string
  question: string
  answer: string
  order: number
}

interface SEO {
  id: string
  title: string
  description: string
  keywords: string
}

interface RelatedProduct {
  id: string
  name: string
  image_url: string | null
  type: 'similar' | 'variant' | 'suggested'
  order: number
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [specifications, setSpecifications] = useState<Specification[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [descriptions, setDescriptions] = useState<Description[]>([])
  const [featuresBenefits, setFeaturesBenefits] = useState<FeatureBenefit[]>([])
  const [questionsAnswers, setQuestionsAnswers] = useState<QuestionAnswer[]>([])
  const [seo, setSEO] = useState<SEO | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])

  // Dialog states
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showSpecificationDialog, setShowSpecificationDialog] = useState(false)
  const [showManufacturerDialog, setShowManufacturerDialog] = useState(false)
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false)
  const [showFeatureBenefitDialog, setShowFeatureBenefitDialog] = useState(false)
  const [showQuestionAnswerDialog, setShowQuestionAnswerDialog] = useState(false)
  const [showSEODialog, setShowSEODialog] = useState(false)
  const [showRelatedProductDialog, setShowRelatedProductDialog] = useState(false)
  const [showEditSEODialog, setShowEditSEODialog] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (id === 'new') {
          setLoading(false)
          return
        }

        // Fetch all product data
        const [
          productResult,
          assetsResult,
          specificationsResult,
          manufacturersResult,
          suppliersResult,
          descriptionsResult,
          featuresBenefitsResult,
          questionsAnswersResult,
          seoResult,
          relationsResult
        ] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single(),
          supabase
            .from('assets')
            .select('*')
            .eq('product_id', id)
            .order('created_at'),
          supabase
            .from('product_specification_values')
            .select(`
              specification:specifications (
                id,
                name,
                items:specification_items (
                  id,
                  name
                )
              ),
              item_id,
              value
            `)
            .eq('product_id', id),
          supabase
            .from('product_manufacturers')
            .select(`
              id,
              manufacturer:manufacturers(id, name),
              manufacturer_sku,
              etilize_id,
              is_default
            `)
            .eq('product_id', id),
          supabase
            .from('product_suppliers')
            .select(`
              id,
              supplier:suppliers(id, name),
              supplier_sku,
              is_default
            `)
            .eq('product_id', id),
          supabase
            .from('product_descriptions')
            .select('*')
            .eq('product_id', id)
            .order('created_at'),
          supabase
            .from('product_features_benefits')
            .select('*')
            .eq('product_id', id)
            .order('order'),
          supabase
            .from('product_questions_answers')
            .select('*')
            .eq('product_id', id)
            .order('order'),
          supabase
            .from('product_seo')
            .select('*')
            .eq('product_id', id)
            .maybeSingle(),
          supabase
            .from('product_relations')
            .select(`
              related_product_id,
              type,
              order,
              related_product:products!related_product_id (
                id,
                name,
                assets (
                  url,
                  is_default
                )
              )
            `)
            .eq('product_id', id)
            .order('order')
        ])

        if (productResult.error) throw productResult.error
        if (assetsResult.error) throw assetsResult.error
        if (specificationsResult.error) throw specificationsResult.error
        if (manufacturersResult.error) throw manufacturersResult.error
        if (suppliersResult.error) throw suppliersResult.error
        if (descriptionsResult.error) throw descriptionsResult.error
        if (featuresBenefitsResult.error) throw featuresBenefitsResult.error
        if (questionsAnswersResult.error) throw questionsAnswersResult.error
        if (relationsResult.error) throw relationsResult.error

        // Transform specifications data
        const specsMap = new Map<string, Specification>()
        specificationsResult.data.forEach(spec => {
          const specId = spec.specification.id
          if (!specsMap.has(specId)) {
            specsMap.set(specId, {
              id: specId,
              name: spec.specification.name,
              items: spec.specification.items.map(item => ({
                id: item.id,
                name: item.name,
                value: spec.item_id === item.id ? spec.value : ''
              }))
            })
          }
        })

        setProduct(productResult.data)
        setAssets(assetsResult.data || [])
        setSpecifications(Array.from(specsMap.values()))
        setManufacturers(manufacturersResult.data.map(m => ({
          id: m.manufacturer.id,
          name: m.manufacturer.name,
          manufacturer_sku: m.manufacturer_sku,
          etilize_id: m.etilize_id,
          is_default: m.is_default
        })))
        setSuppliers(suppliersResult.data.map(s => ({
          id: s.supplier.id,
          name: s.supplier.name,
          supplier_sku: s.supplier_sku,
          is_default: s.is_default
        })))
        setDescriptions(descriptionsResult.data || [])
        setFeaturesBenefits(featuresBenefitsResult.data || [])
        setQuestionsAnswers(questionsAnswersResult.data || [])
        setSEO(seoResult.data)
        setRelatedProducts(relationsResult.data.map(relation => ({
          id: relation.related_product.id,
          name: relation.related_product.name,
          image_url: relation.related_product.assets?.find(a => a.is_default)?.url || null,
          type: relation.type,
          order: relation.order
        })))

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load product data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  const handleAddImage = async (data: {
    url: string
    name: string
    alt_tag: string
    is_default: boolean
    order: number
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('assets')
        .insert([{
          product_id: product.id,
          url: data.url,
          name: data.name,
          alt_tag: data.alt_tag,
          is_default: data.is_default,
          order: data.order
        }])

      if (error) throw error

      // Refresh assets
      const { data: newAssets, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at')

      if (fetchError) throw fetchError
      setAssets(newAssets)
    } catch (err) {
      console.error('Error adding image:', err)
    }
  }

  const handleAddSpecification = async (data: {
    specification_id: string
    item_id: string
    value: string
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_specification_values')
        .insert([{
          product_id: product.id,
          specification_id: data.specification_id,
          item_id: data.item_id,
          value: data.value
        }])

      if (error) throw error

      // Refresh specifications
      const { data: newSpecs, error: fetchError } = await supabase
        .from('product_specification_values')
        .select(`
          specification:specifications (
            id,
            name,
            items:specification_items (
              id,
              name
            )
          ),
          item_id,
          value
        `)
        .eq('product_id', product.id)

      if (fetchError) throw fetchError

      // Transform specifications data
      const specsMap = new Map<string, Specification>()
      newSpecs.forEach(spec => {
        const specId = spec.specification.id
        if (!specsMap.has(specId)) {
          specsMap.set(specId, {
            id: specId,
            name: spec.specification.name,
            items: spec.specification.items.map(item => ({
              id: item.id,
              name: item.name,
              value: spec.item_id === item.id ? spec.value : ''
            }))
          })
        }
      })

      setSpecifications(Array.from(specsMap.values()))
    } catch (err) {
      console.error('Error adding specification:', err)
    }
  }

  const handleAddManufacturer = async (data: {
    manufacturer_id: string
    manufacturer_sku: string
    etilize_id: string
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_manufacturers')
        .insert([{
          product_id: product.id,
          manufacturer_id: data.manufacturer_id,
          manufacturer_sku: data.manufacturer_sku || null,
          etilize_id: data.etilize_id || null,
          is_default: manufacturers.length === 0
        }])

      if (error) throw error

      // Refresh manufacturers
      const { data: newManufacturers, error: fetchError } = await supabase
        .from('product_manufacturers')
        .select(`
          id,
          manufacturer:manufacturers(id, name),
          manufacturer_sku,
          etilize_id,
          is_default
        `)
        .eq('product_id', product.id)

      if (fetchError) throw fetchError

      setManufacturers(newManufacturers.map(m => ({
        id: m.manufacturer.id,
        name: m.manufacturer.name,
        manufacturer_sku: m.manufacturer_sku,
        etilize_id: m.etilize_id,
        is_default: m.is_default
      })))
    } catch (err) {
      console.error('Error adding manufacturer:', err)
    }
  }

  const handleAddSupplier = async (data: {
    supplier_id: string
    supplier_sku: string
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_suppliers')
        .insert([{
          product_id: product.id,
          supplier_id: data.supplier_id,
          supplier_sku: data.supplier_sku || null,
          is_default: suppliers.length === 0
        }])

      if (error) throw error

      // Refresh suppliers
      const { data: newSuppliers, error: fetchError } = await supabase
        .from('product_suppliers')
        .select(`
          id,
          supplier:suppliers(id, name),
          supplier_sku,
          is_default
        `)
        .eq('product_id', product.id)

      if (fetchError) throw fetchError

      setSuppliers(newSuppliers.map(s => ({
        id: s.supplier.id,
        name: s.supplier.name,
        supplier_sku: s.supplier_sku,
        is_default: s.is_default
      })))
    } catch (err) {
      console.error('Error adding supplier:', err)
    }
  }

  const handleAddDescription = async (data: {
    type: 'Raw' | 'Main' | 'Sub' | 'Rich' | 'About'
    description: string
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_descriptions')
        .insert([{
          product_id: product.id,
          type: data.type,
          description: data.description
        }])

      if (error) throw error

      // Refresh descriptions
      const { data: newDescriptions, error: fetchError } = await supabase
        .from('product_descriptions')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at')

      if (fetchError) throw fetchError
      setDescriptions(newDescriptions)
    } catch (err) {
      console.error('Error adding description:', err)
    }
  }

  const handleAddFeatureBenefit = async (data: {
    type: 'Feature' | 'Benefit'
    value: string
    order: number
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_features_benefits')
        .insert([{
          product_id: product.id,
          type: data.type,
          value: data.value,
          order: data.order
        }])

      if (error) throw error

      // Refresh features & benefits
      const { data: newFeaturesBenefits, error: fetchError } = await supabase
        .from('product_features_benefits')
        .select('*')
        .eq('product_id', product.id)
        .order('order')

      if (fetchError) throw fetchError
      setFeaturesBenefits(newFeaturesBenefits)
    } catch (err) {
      console.error('Error adding feature/benefit:', err)
    }
  }

  const handleAddQuestionAnswer = async (data: {
    question: string
    answer: string
    order: number
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_questions_answers')
        .insert([{
          product_id: product.id,
          question: data.question,
          answer: data.answer,
          order: data.order
        }])

      if (error) throw error

      // Refresh Q&A
      const { data: newQA, error: fetchError } = await supabase
        .from('product_questions_answers')
        .select('*')
        .eq('product_id', product.id)
        .order('order')

      if (fetchError) throw fetchError
      setQuestionsAnswers(newQA)
    } catch (err) {
      console.error('Error adding Q&A:', err)
    }
  }

  const handleAddSEO = async (data: {
    title: string
    description: string
    keywords: string
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_seo')
        .insert([{
          product_id: product.id,
          title: data.title,
          description: data.description,
          keywords: data.keywords
        }])

      if (error) throw error

      // Refresh SEO
      const { data: newSEO, error: fetchError } = await supabase
        .from('product_seo')
        .select('*')
        .eq('product_id', product.id)
        .single()

      if (fetchError) throw fetchError
      setSEO(newSEO)
    } catch (err) {
      console.error('Error adding SEO:', err)
    }
  }

  const handleUpdateSEO = async (data: {
    title: string
    description: string
    keywords: string
  }) => {
    try {
      if (!product || !seo) return

      const { error } = await supabase
        .from('product_seo')
        .update({
          title: data.title,
          description: data.description,
          keywords: data.keywords
        })
        .eq('id', seo.id)

      if (error) throw error

      // Refresh SEO
      const { data: updatedSEO, error: fetchError } = await supabase
        .from('product_seo')
        .select('*')
        .eq('product_id', product.id)
        .single()

      if (fetchError) throw fetchError
      setSEO(updatedSEO)
    } catch (err) {
      console.error('Error updating SEO:', err)
    }
  }

  const handleAddRelatedProduct = async (data: {
    related_product_id: string
    type: 'similar' | 'variant' | 'suggested'
    order: number
  }) => {
    try {
      if (!product) return

      const { error } = await supabase
        .from('product_relations')
        .insert([{
          product_id: product.id,
          related_product_id: data.related_product_id,
          type: data.type,
          order: data.order
        }])

      if (error) throw error

      // Refresh related products
      const { data: newRelations, error: fetchError } = await supabase
        .from('product_relations')
        .select(`
          related_product_id,
          type,
          order,
          related_product:products!related_product_id (
            id,
            name,
            assets (
              url,
              is_default
            )
          )
        `)
        .eq('product_id', product.id)
        .order('order')

      if (fetchError) throw fetchError

      setRelatedProducts(newRelations.map(relation => ({
        id: relation.related_product.id,
        name: relation.related_product.name,
        image_url: relation.related_product.assets?.find(a => a.is_default)?.url || null,
        type: relation.type,
        order: relation.order
      })))
    } catch (err) {
      console.error('Error adding related product:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/products')}
            className="mr-4 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id === 'new' ? 'New Product' : 'Edit Product'}
          </h1>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form className="space-y-8 divide-y divide-gray-200 p-6">
          <BasicInformation product={product} onChange={setProduct} />
          
          <ProductImages 
            assets={assets}
            onAddImage={() => setShowImageDialog(true)}
            onSetDefault={async (assetId) => {
              try {
                if (!product) return

                await supabase
                  .from('assets')
                  .update({ is_default: false })
                  .eq('product_id', product.id)

                const { error } = await supabase
                  .from('assets')
                  .update({ is_default: true })
                  .eq('id', assetId)

                if (error) throw error

                setAssets(prev => prev.map(asset => ({
                  ...asset,
                  is_default: asset.id === assetId
                })))
              } catch (err) {
                console.error('Error setting default asset:', err)
              }
            }}
            onRemove={async (assetId) => {
              try {
                const { error } = await supabase
                  .from('assets')
                  .delete()
                  .eq('id', assetId)

                if (error) throw error

                setAssets(prev => prev.filter(asset => asset.id !== assetId))
              } catch (err) {
                console.error('Error removing asset:', err)
              }
            }}
          />

          <ProductDescriptions
            descriptions={descriptions}
            onAddDescription={() => setShowDescriptionDialog(true)}
            onRemoveDescription={async (id) => {
              try {
                const { error } = await supabase
                  .from('product_descriptions')
                  .delete()
                  .eq('id', id)

                if (error) throw error

                setDescriptions(prev => prev.filter(desc => desc.id !== id))
              } catch (err) {
                console.error('Error removing description:', err)
              }
            }}
          />

          <ProductFeaturesBenefits
            featuresBenefits={featuresBenefits}
            onAddFeatureBenefit={() => setShowFeatureBenefitDialog(true)}
            onRemoveFeatureBenefit={async (id) => {
              try {
                const { error } = await supabase
                  .from('product_features_benefits')
                  .delete()
                  .eq('id', id)

                if (error) throw error

                setFeaturesBenefits(prev => prev.filter(fb => fb.id !== id))
              } catch (err) {
                console.error('Error removing feature/benefit:', err)
              }
            }}
          />

          <ProductSpecifications
            specifications={specifications}
            onAddSpecification={() => setShowSpecificationDialog(true)}
            onEditSpecification={(id) => {
              // Handle edit specification
            }}
            onRemoveSpecification={async (id) => {
              try {
                if (!product) return

                const { error } = await supabase
                  .from('product_specification_values')
                  .delete()
                  .eq('product_id', product.id)
                  .eq('specification_id', id)

                if (error) throw error

                setSpecifications(prev => prev.filter(spec => spec.id !== id))
              } catch (err) {
                console.error('Error removing specification:', err)
              }
            }}
          />

          <ProductManufacturers
            manufacturers={manufacturers}
            onAddManufacturer={() => setShowManufacturerDialog(true)}
            onEditManufacturer={(id) => {
              // Handle edit manufacturer
            }}
            onRemoveManufacturer={async (id) => {
              try {
                if (!product) return

                const { error } = await supabase
                  .from('product_manufacturers')
                  .delete()
                  .eq('product_id', product.id)
                  .eq('manufacturer_id', id)

                if (error) throw error

                setManufacturers(prev => prev.filter(m => m.id !== id))
              } catch (err) {
                console.error('Error removing manufacturer:', err)
              }
            }}
          />

          <ProductSuppliers
            suppliers={suppliers}
            onAddSupplier={() => setShowSupplierDialog(true)}
            onEditSupplier={(id) => {
              // Handle edit supplier
            }}
            onRemoveSupplier={async (id) => {
              try {
                if (!product) return

                const { error } = await supabase
                  .from('product_suppliers')
                  .delete()
                  .eq('product_id', product.id)
                  .eq('supplier_id', id)

                if (error) throw error

                setSuppliers(prev => prev.filter(s => s.id !== id))
              } catch (err) {
                console.error('Error removing supplier:', err)
              }
            }}
          />

          <ProductQuestionsAnswers
            questionsAnswers={questionsAnswers}
            onAddQuestionAnswer={() => setShowQuestionAnswerDialog(true)}
            onRemoveQuestionAnswer={async (id) => {
              try {
                const { error } = await supabase
                  .from('product_questions_answers')
                  .delete()
                  .eq('id', id)

                if (error) throw error

                setQuestionsAnswers(prev => prev.filter(qa => qa.id !== id))
              } catch (err) {
                console.error('Error removing Q&A:', err)
              }
            }}
          />

          <ProductSEO
            seo={seo}
            onAddSEO={() => setShowSEODialog(true)}
            onEditSEO={() => {
              if (seo) {
                setShowEditSEODialog(true)
              }
            }}
            onRemoveSEO={async (id) => {
              try {
                const { error } = await supabase
                  .from('product_seo')
                  .delete()
                  .eq('id', id)

                if (error) throw error

                setSEO(null)
              } catch (err) {
                console.error('Error removing SEO:', err)
              }
            }}
          />

          <RelatedProducts
            products={relatedProducts}
            onAddRelation={() => setShowRelatedProductDialog(true)}
          />
        </form>
      </div>

      {/* Dialogs */}
      <AddImageDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onAdd={handleAddImage}
      />

      <AddSpecificationDialog
        isOpen={showSpecificationDialog}
        onClose={() => setShowSpecificationDialog(false)}
        onAdd={handleAddSpecification}
      />

      <AddManufacturerDialog
        isOpen={showManufacturerDialog}
        onClose={() => setShowManufacturerDialog(false)}
        onAdd={handleAddManufacturer}
      />

      <AddSupplierDialog
        isOpen={showSupplierDialog}
        onClose={() => setShowSupplierDialog(false)}
        onAdd={handleAddSupplier}
      />

      <AddDescriptionDialog
        isOpen={showDescriptionDialog}
        onClose={() => setShowDescriptionDialog(false)}
        onAdd={handleAddDescription}
      />

      <AddFeatureBenefitDialog
        isOpen={showFeatureBenefitDialog}
        onClose={() => setShowFeatureBenefitDialog(false)}
        onAdd={handleAddFeatureBenefit}
      />

      <AddQuestionAnswerDialog
        isOpen={showQuestionAnswerDialog}
        onClose={() => setShowQuestionAnswerDialog(false)}
        onAdd={handleAddQuestionAnswer}
      />

      <AddSEODialog
        isOpen={showSEODialog}
        onClose={() => setShowSEODialog(false)}
        onAdd={handleAddSEO}
      />

      {seo && (
        <AddSEODialog
          isOpen={showEditSEODialog}
          onClose={() => setShowEditSEODialog(false)}
          onAdd={handleUpdateSEO}
          initialData={{
            title: seo.title,
            description: seo.description,
            keywords: seo.keywords
          }}
        />
      )}

      {product && (
        <AddRelatedProductDialog
          isOpen={showRelatedProductDialog}
          onClose={() => setShowRelatedProductDialog(false)}
          currentProductId={product.id}
          onAdd={handleAddRelatedProduct}
        />
      )}
    </div>
  )
}