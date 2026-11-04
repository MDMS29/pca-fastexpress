export const CLIENT_TYPES = [
    { id: 1, label: 'Nuevo' },
    { id: 2, label: 'Frecuente' },
    { id: 3, label: 'VIP' },
]

// Datos de referencia insertados por las migraciones de SQLite.
export const DOCUMENT_TYPES = [
    { id: 1, label: 'Cédula de ciudadanía' },
    { id: 2, label: 'Cédula de extranjería' },
    { id: 3, label: 'NIT' },
    { id: 4, label: 'Pasaporte' },
]

export const SHIPPING_METHODS = [
    { id: 1, label: 'Estandar' },
    { id: 2, label: 'Express' }
]

export const CUSTOMER_DISCOUNT = [
    { id: 1, label: '0%', client_type_id: 1, value: 0 },
    { id: 2, label: '10%', client_type_id: 2, value: 0.1 },
    { id: 3, label: '20%', client_type_id: 3, value: 0.2 }
]

export const SHIPPING_METHOD_SURCHARGE = [
    { id: 1, label: '0%', shipping_method_id: 1, value: 0 },
    { id: 2, label: '25%', shipping_method_id: 2, value: 0.25 }
]
