const SWAGGER_UI = 'https://unpkg.com/swagger-ui-dist@5.17.14'

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FastExpress API Docs</title>
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      withCredentials: true
    })
  </script>
</body>
</html>`

export function GET() {
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
