export const CLIENT_TYPES = [
    { id: 1, label: 'Nuevo' },
    { id: 2, label: 'Frecuente' },
    { id: 3, label: 'VIP' },
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

// Usuario por defecto; se puede sobrescribir con variables de entorno
export const DEFAULT_USER = {
    username: process.env.DEFAULT_USER ?? 'admin',
    name: process.env.DEFAULT_USER_NAME ?? 'Administrador',
    password: process.env.DEFAULT_PASSWORD ?? 'admin123'
}
