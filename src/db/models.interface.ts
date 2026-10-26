export interface ClientType {
  id?: number;
  label: string;
}

export interface DocumentType {
  id?: number;
  label: string;
}

export interface ShippingMethod {
  id?: number;
  label: string;
}

export interface CustomerDiscount {
  id?: number;
  label: string;
  client_type_id: number;
  value: number;
}

export interface ShippingMethodSurcharge {
  id?: number;
  label: string;
  shipping_method_id: number;
  value: number;
}

export interface User {
  id: number;
  username: string;
  name: string;
}

export interface ShippingQuote {
  id: number;
  client_name: string;
  client_identification: string;
  document_type_id: number | null;
  document_type: string | null;
  client_id: number | null;
  client_type_id: number;
  shipping_method_id: number;
  weight: number;
  calculation_weight: number;
  discount: string;
  surcharge: string;
  total: number;
  responsible_id: number | null;
  responsible: string | null;
  created_at: string;
}
