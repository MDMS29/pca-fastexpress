import { NewResponse } from "@/src/lib/responses"
import { authenticate, createSession } from "@/src/lib/auth"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const user = authenticate(String(body.username ?? ''), String(body.password ?? ''))

        if (!user) {
            return NewResponse({
                code: 401,
                message: 'Usuario o contraseña incorrectos',
                data: null
            })
        }

        await createSession(user.id)

        return NewResponse({
            code: 200,
            message: 'Sesión iniciada!',
            data: user
        })
    } catch (error) {
        return NewResponse({
            code: 500,
            message: 'Error al iniciar sesión!',
            data: null
        })
    }
}
