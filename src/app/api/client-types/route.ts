import { NewResponse } from "@/src/lib/responses"
import { getDB } from "@/src/db/models"
import { ClientType } from "@/src/db/models.interface"


export function GET() {
  const clientTypes = getDB().prepare('SELECT id, label FROM client_types').all() as ClientType[]

  return NewResponse({
    code: 200,
    message: 'OBTENIENDO TIPOS DE CLIENTE!',
    data: clientTypes
  })
}
