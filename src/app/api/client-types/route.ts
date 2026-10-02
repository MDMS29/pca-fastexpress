import { NewResponse } from "@/src/lib/responses"
import { CLIENT_TYPES } from "../constants"


export function GET() {
  return NewResponse({
    code: 200,
    message: 'OBTENIENDO TIPOS DE CLIENTE!',
    data: CLIENT_TYPES
  })
}