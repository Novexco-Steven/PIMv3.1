export interface Product {
  id: string
  name: string
  sku: string
  description: string
  category_id: string | null
  category: {
    name: string
  } | null
  status: string
  etilize_id: string | null
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  url: string
  usage_type: string
  alt_tag: string
  is_default: boolean
}

export interface AssetFormData {
  url: string
  usage_type: string
  alt_tag: string
  is_default: boolean
}

export interface SpecificationItem {
  id: string
  name: string
  value: string
}

export interface Specification {
  id: string
  name: string
  items: SpecificationItem[]
}

export interface Manufacturer {
  id: string
  name: string
  manufacturer_sku?: string
  etilize_id?: string
  is_default: boolean
}

export interface Supplier {
  id: string
  name: string
  supplier_sku?: string
  is_default: boolean
}

export interface SpecificationValue {
  specification: {
    id: string
    name: string
    items: {
      id: string
      name: string
    }[]
  }
  item_id: string
  value: string
}