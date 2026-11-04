export interface RequestBodyShippingQuote {
    client_name: string;
    client_identification: string;
    document_type_id: number;
    client_type_id: number;
    shipping_method_id: number;
    weight: number;
}
