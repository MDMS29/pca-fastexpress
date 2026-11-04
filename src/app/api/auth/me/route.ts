import { NewResponse } from "@/src/lib/responses"
import { getSessionUser } from "@/src/lib/auth"

export async function GET() {
    const user = await getSessionUser()

    if (!user) {
        return NewResponse({
            code: 401,
            message: 'No autenticado',
            data: null
        })
    }

    return NewResponse({
        code: 200,
        message: 'Usuario autenticado',
        data: user
    })
}
