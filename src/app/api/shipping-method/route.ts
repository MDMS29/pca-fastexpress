import { NewResponse } from "@/src/lib/responses";
import { SHIPPING_METHODS } from "../constants";

export function GET(){
return NewResponse({
    code: 200,
    message: 'OBTENIENDO TIPOS DE ENVIOS!',
    data: SHIPPING_METHODS
  })
}