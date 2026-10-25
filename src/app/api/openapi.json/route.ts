import { openApiSpec } from "@/src/lib/openapi"

export function GET() {
    return Response.json(openApiSpec)
}
