import { NewResponse } from "@/src/lib/responses"
import { getSessionUser } from "@/src/lib/auth"
import { createShippingQuote, getShippingQuotes } from "./shipping-quote.service"

const unauthorized = () => NewResponse({
    code: 401,
    message: 'Debe iniciar sesión',
    data: null
})

export async function GET() {
    try {
        const user = await getSessionUser()
        if (!user) return unauthorized()

        return NewResponse({
            code: 200,
            message: 'Obteniendo cotizaciones de envío!',
            data: getShippingQuotes()
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
        const user = await getSessionUser()
        if (!user) return unauthorized()

        const body = await request.json()
        const response = createShippingQuote(body, user)
        return NewResponse(response)
    } catch (error) {
        return NewResponse({
            code: 500,
            message: 'Error al guardar la cotización de envío!',
            data: []
        })
    }
}
