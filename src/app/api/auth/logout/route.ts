import { NewResponse } from "@/src/lib/responses"
import { deleteSession } from "@/src/lib/auth"

export async function POST() {
    await deleteSession()

    return NewResponse({
        code: 200,
        message: 'Sesión cerrada!',
        data: null
    })
}
