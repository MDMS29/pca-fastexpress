// Especificación OpenAPI de la API. Actualizar al agregar o cambiar endpoints.

const envelope = (data: object, example: unknown, message: string, code = 200) => ({
    type: 'object',
    properties: {
        code: { type: 'integer', example: code },
        error: { type: 'boolean', example: code >= 400 },
        message: { type: 'string', example: message },
        data
    },
    example: { code, error: code >= 400, message, data: example }
})

const errorResponse = (description: string, message: string, code: number) => ({
    description,
    content: { 'application/json': { schema: envelope({ nullable: true }, null, message, code) } }
})

const unauthorized = errorResponse('No hay sesión activa', 'Debe iniciar sesión', 401)

const exampleQuote = {
    id: 1,
    client_name: 'Ana Pérez',
    client_identification: '0102030405',
    document_type_id: 1,
    document_type: 'Cédula de ciudadanía',
    client_id: 1,
    client_type_id: 2,
    shipping_method_id: 2,
    weight: 5,
    calculation_weight: 2,
    discount: '10%',
    surcharge: '25%',
    total: 11.25,
    responsible_id: 1,
    responsible: 'Administrador',
    created_at: '2026-10-25 20:23:35'
}

export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'FastExpress API',
        version: '1.0.0',
        description:
            'API de cotización y registro de envíos.\n\n' +
            '**Autenticación:** `POST /api/auth/login` guarda una cookie `session` (httpOnly, 8 h). ' +
            'Las rutas protegidas la leen automáticamente; desde el front usar `fetch` en el mismo origen ' +
            '(o `credentials: "include"`).\n\n' +
            'El usuario inicial se configura únicamente mediante `DEFAULT_USER`, `DEFAULT_PASSWORD` y `DEFAULT_USER_NAME`.\n\n' +
            'Todas las respuestas usan el sobre `{ code, error, message, data }`.'
    },
    tags: [
        { name: 'Auth', description: 'Inicio y cierre de sesión' },
        { name: 'Catálogos', description: 'Datos base cargados desde constants.ts' },
        { name: 'Envíos', description: 'Cotizaciones de envío (requiere sesión)' }
    ],
    components: {
        securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: 'session' }
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    username: { type: 'string', example: 'admin' },
                    name: { type: 'string', example: 'Administrador' }
                }
            },
            CatalogItem: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    label: { type: 'string', example: 'Nuevo' }
                }
            },
            ShippingQuoteInput: {
                type: 'object',
                required: ['client_name', 'client_identification', 'document_type_id', 'client_type_id', 'shipping_method_id', 'weight'],
                properties: {
                    client_name: { type: 'string', example: 'Ana Pérez' },
                    client_identification: { type: 'string', example: '0102030405' },
                    document_type_id: { type: 'integer', description: 'id de GET /api/document-types', example: 1 },
                    client_type_id: { type: 'integer', description: 'id de GET /api/client-types (1 Nuevo 0%, 2 Frecuente 10%, 3 VIP 20%)', example: 2 },
                    shipping_method_id: { type: 'integer', description: 'id de GET /api/shipping-method (1 Estandar 0%, 2 Express +25%)', example: 2 },
                    weight: { type: 'number', description: 'kg; > 0.01 y <= 20', example: 5 }
                }
            },
            ShippingQuote: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    client_name: { type: 'string' },
                    client_identification: { type: 'string' },
                    document_type_id: { type: 'integer', nullable: true },
                    document_type: { type: 'string', nullable: true },
                    client_id: { type: 'integer', nullable: true },
                    client_type_id: { type: 'integer' },
                    shipping_method_id: { type: 'integer' },
                    weight: { type: 'number' },
                    calculation_weight: { type: 'number', description: 'Tarifa por kg: 2 si peso <= 5, 4 si peso <= 20' },
                    discount: { type: 'string', example: '10%' },
                    surcharge: { type: 'string', example: '25%' },
                    total: { type: 'number', description: '(tarifa × peso) × (1 − descuento) × (1 + recargo)' },
                    responsible_id: { type: 'integer', nullable: true, description: 'Usuario que creó el envío' },
                    responsible: { type: 'string', nullable: true, description: 'Nombre del usuario que creó el envío' },
                    created_at: { type: 'string', description: 'UTC, formato YYYY-MM-DD HH:MM:SS' }
                },
                example: exampleQuote
            }
        }
    },
    paths: {
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Iniciar sesión',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['username', 'password'],
                                properties: {
                                    username: { type: 'string', example: 'admin' },
                                    password: { type: 'string', example: 'admin123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Sesión iniciada; responde con cookie `session`',
                        headers: { 'Set-Cookie': { schema: { type: 'string', example: 'session=abc123; Path=/; HttpOnly; SameSite=Lax' } } },
                        content: { 'application/json': { schema: envelope({ $ref: '#/components/schemas/User' }, { id: 1, username: 'admin', name: 'Administrador' }, 'Sesión iniciada!') } }
                    },
                    401: errorResponse('Credenciales inválidas', 'Usuario o contraseña incorrectos', 401)
                }
            }
        },
        '/api/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Cerrar sesión',
                responses: {
                    200: { description: 'Sesión eliminada', content: { 'application/json': { schema: envelope({ nullable: true }, null, 'Sesión cerrada!') } } }
                }
            }
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Usuario de la sesión actual',
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: 'Usuario autenticado', content: { 'application/json': { schema: envelope({ $ref: '#/components/schemas/User' }, { id: 1, username: 'admin', name: 'Administrador' }, 'Usuario autenticado') } } },
                    401: errorResponse('Sin sesión', 'No autenticado', 401)
                }
            }
        },
        '/api/client-types': {
            get: {
                tags: ['Catálogos'],
                summary: 'Listar tipos de cliente',
                responses: {
                    200: {
                        description: 'Tipos de cliente',
                        content: { 'application/json': { schema: envelope({ type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } }, [{ id: 1, label: 'Nuevo' }, { id: 2, label: 'Frecuente' }, { id: 3, label: 'VIP' }], 'OBTENIENDO TIPOS DE CLIENTE!') } }
                    }
                }
            }
        },
        '/api/document-types': {
            get: {
                tags: ['Catálogos'],
                summary: 'Listar tipos de documento',
                responses: {
                    200: {
                        description: 'Tipos de documento',
                        content: { 'application/json': { schema: envelope({ type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } }, [{ id: 1, label: 'Cédula de ciudadanía' }, { id: 3, label: 'NIT' }], 'Obteniendo tipos de documento') } }
                    }
                }
            }
        },
        '/api/shipping-method': {
            get: {
                tags: ['Catálogos'],
                summary: 'Listar tipos de envío',
                responses: {
                    200: {
                        description: 'Tipos de envío',
                        content: { 'application/json': { schema: envelope({ type: 'array', items: { $ref: '#/components/schemas/CatalogItem' } }, [{ id: 1, label: 'Estandar' }, { id: 2, label: 'Express' }], 'OBTENIENDO TIPOS DE ENVIOS!') } }
                    }
                }
            }
        },
        '/api/shipping-quote': {
            get: {
                tags: ['Envíos'],
                summary: 'Listar envíos (más recientes primero) con su responsable',
                security: [{ cookieAuth: [] }],
                responses: {
                    200: { description: 'Envíos', content: { 'application/json': { schema: envelope({ type: 'array', items: { $ref: '#/components/schemas/ShippingQuote' } }, [exampleQuote], 'Obteniendo cotizaciones de envío!') } } },
                    401: unauthorized
                }
            },
            post: {
                tags: ['Envíos'],
                summary: 'Crear envío; el responsable es el usuario de la sesión',
                security: [{ cookieAuth: [] }],
                requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ShippingQuoteInput' } } } },
                responses: {
                    200: { description: 'Envío guardado', content: { 'application/json': { schema: envelope({ $ref: '#/components/schemas/ShippingQuote' }, exampleQuote, 'Cotización de envío calculada exitosamente!') } } },
                    400: errorResponse('Peso, tipo de cliente o tipo de envío inválido', 'El peso ingresado no es válido, debe ser mayor a 0.01 y menor o igual a 20', 400),
                    401: unauthorized
                }
            }
        }
    }
}
