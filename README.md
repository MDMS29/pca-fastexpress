# FastExpress

FastExpress es una aplicación web para gestionar cotizaciones de envíos. Permite autenticar a un operador, registrar clientes, calcular tarifas según las condiciones comerciales y consultar el historial de envíos guardados.

El proyecto reúne un frontend responsive, una API con Next.js, persistencia local en SQLite y pruebas automatizadas para las reglas de negocio y los endpoints principales.

## Características

- Página de inicio pública y panel administrativo protegido por sesión.
- Inicio y cierre de sesión mediante cookies `httpOnly`.
- Registro de cotizaciones con cliente, documento, tipo de cliente, tipo de envío y peso.
- Identificación única por **tipo de documento + número de documento**.
- Cálculo automático de tarifa, descuento, recargo y total.
- Historial de envíos con su responsable y los valores aplicados.
- Catálogos persistentes para tipos de cliente, documento y envío.
- Diseño adaptable a laptop, tablet y pantallas pequeñas.
- Migraciones y datos iniciales de SQLite al iniciar la aplicación.
- Pruebas con Vitest y cobertura mínima del 85% para el alcance crítico.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Framework | Next.js 16 con App Router |
| Lenguaje | TypeScript |
| Interfaz | React 19 y Tailwind CSS 4 |
| Base de datos | SQLite mediante `better-sqlite3` |
| Pruebas | Vitest y cobertura V8 |

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.

## Instalación y ejecución local

1. Ubícate en la carpeta del proyecto:

   ```bash
   cd fastexpress-backend
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea `.env.local` en la raíz del proyecto. Usa credenciales propias en entornos compartidos:

   ```env
   DEFAULT_USER=admin
   DEFAULT_USER_NAME=Administrador
   DEFAULT_PASSWORD=una-clave-segura
   ```

4. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en el navegador.

Al iniciar, el proyecto crea `data/pca-fastexpress.db`, ejecuta las migraciones pendientes y carga los catálogos iniciales. Si el usuario definido en `.env.local` no existe, también lo crea.

> `.env.local` y la carpeta `data/` están excluidos de Git. No subas credenciales ni bases de datos locales al repositorio.

## Rutas de la interfaz

| Ruta | Descripción | Acceso |
| --- | --- | --- |
| `/` | Página de inicio e información del servicio. | Público |
| `/login` | Formulario de autenticación. | Público |
| `/dashboard` | Registro de cotizaciones e historial. | Requiere sesión |
| `/api/docs` | Documentación interactiva de la API. | Público |

## Reglas de negocio

### Peso y tarifa base

| Rango de peso | Tarifa |
| --- | --- |
| `0.01 < peso <= 5 kg` | $2 por kg |
| `5 < peso <= 20 kg` | $4 por kg |
| `peso <= 0.01` o `peso > 20 kg` | Cotización rechazada |

### Descuentos y recargos

| Tipo de cliente | Descuento |
| --- | --- |
| Nuevo | 0% |
| Frecuente | 10% |
| VIP | 20% |

| Tipo de envío | Recargo |
| --- | --- |
| Estándar | 0% |
| Express | 25% |

El total se calcula así:

```text
(tarifa por kg × peso) × (1 - descuento) × (1 + recargo)
```

Por ejemplo, un envío Express de 20 kg para un cliente Nuevo usa una tarifa de $4/kg y un recargo del 25%, para un total de $100.

## Integridad de clientes

Un cliente se identifica de forma única mediante su tipo y número de documento. Al crear una cotización:

1. Si el documento no está registrado, se crea el cliente.
2. Si existe con el mismo nombre, se reutiliza el cliente para la nueva cotización.
3. Si existe con otro nombre, la API responde `409 Conflict` y no crea el envío.

Esta regla evita duplicidades e inconsistencias en el historial.

## API

Todas las respuestas siguen este formato:

```json
{
  "code": 200,
  "error": false,
  "message": "Descripción del resultado",
  "data": {}
}
```

| Método | Endpoint | Descripción | Sesión |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Inicia sesión y crea la cookie de sesión. | No |
| `POST` | `/api/auth/logout` | Cierra la sesión activa. | No |
| `GET` | `/api/auth/me` | Consulta el usuario de la sesión actual. | Sí |
| `GET` | `/api/client-types` | Lista tipos de cliente. | No |
| `GET` | `/api/document-types` | Lista tipos de documento. | No |
| `GET` | `/api/shipping-method` | Lista métodos de envío. | No |
| `GET` | `/api/shipping-quote` | Lista las cotizaciones más recientes. | Sí |
| `POST` | `/api/shipping-quote` | Calcula y registra una cotización. | Sí |
| `GET` | `/api/openapi.json` | Expone la especificación OpenAPI. | No |

### Crear una cotización

Solicitud autenticada a `POST /api/shipping-quote`:

```json
{
  "client_name": "Ana Pérez",
  "client_identification": "100200300",
  "document_type_id": 1,
  "client_type_id": 2,
  "shipping_method_id": 2,
  "weight": 5
}
```

Consulta los identificadores disponibles mediante los endpoints de catálogos. El usuario responsable no se envía en el cuerpo: la API lo obtiene de la sesión activa.

## Base de datos y migraciones

SQLite crea y actualiza el esquema automáticamente. Las entidades principales son:

- `users` y `sessions`: autenticación y sesiones.
- `clients`: información única del cliente y su documento.
- `shipping_quotes`: cotizaciones, cálculo aplicado y usuario responsable.
- `client_types`, `document_types` y `shipping_methods`: catálogos operativos.
- `customer_discounts` y `shipping_method_surcharges`: parámetros comerciales.
- `schema_migrations`: control de migraciones aplicadas.

Los catálogos y cotizaciones de ejemplo se insertan únicamente cuando corresponde; el arranque normal no sobrescribe la información existente.

## Pruebas y calidad

Ejecuta las pruebas unitarias:

```bash
npm run test
```

Para ejecutar las pruebas con cobertura:

```bash
npm run test:coverage
```

La suite verifica valores límite de peso, las seis combinaciones de cliente y envío, validación de catálogos, prevención de duplicidad de clientes, autenticación y manejo de errores.

Comandos de verificación adicionales:

```bash
npm run lint
npm run build
```

## Estructura relevante

```text
src/
├── app/
│   ├── api/                  # Autenticación, catálogos y cotizaciones
│   ├── dashboard/            # Panel operativo protegido
│   ├── login/                # Interfaz de autenticación
│   └── page.tsx              # Página de inicio
├── db/
│   ├── models.ts             # SQLite, migraciones y datos iniciales
│   └── models.interface.ts   # Tipos de entidades
├── lib/
│   ├── auth.ts               # Sesiones y autenticación
│   ├── get-calculation-weight.ts
│   └── openapi.ts            # Especificación de API
└── **/*.spec.ts              # Pruebas unitarias
```

## Notas para desarrollo

- Mantén las reglas de negocio en el servicio de cotizaciones para que la interfaz y la API compartan el mismo comportamiento.
- Agrega o modifica datos de selección mediante migraciones y catálogos persistentes, no solo desde el frontend.
- Actualiza `src/lib/openapi.ts` cuando se agregue o cambie un endpoint.
- Añade pruebas para cada nueva regla de negocio, validación o ruta protegida.
