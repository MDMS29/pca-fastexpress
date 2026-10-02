import { NewResponse } from "@/src/lib/responses"
import { createShippingQuote } from "./shipping-quote.service"
import { RequestBodyShippingQuote } from "./interface"
import { DataApp } from "../constants"

export function GET() {
    try {
        const shippingQuotes = DataApp.length > 0 ? DataApp : null

        return NewResponse({
            code: 200,
            message: 'Obteniendo cotizaciones de envío!',
            data: shippingQuotes ?? []
        })
    } catch (error) {
        return NewResponse({
            code: 500,
            message: 'Error al obtener las cotizaciones de envío!',
            data: []
        })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const response = createShippingQuote(body)
        return NewResponse(response)
    } catch (error) {
        return NewResponse({
            code: 500,
            message: 'Error al guardar la cotización de envío!',
            data: []
        })
    }
}