import { NewResponse } from "@/src/lib/responses";
import { getDB } from "@/src/db/models";
import { ShippingMethod } from "@/src/db/models.interface";

export function GET(){
  const shippingMethods = getDB().prepare('SELECT id, label FROM shipping_methods').all() as ShippingMethod[]

  return NewResponse({
    code: 200,
    message: 'OBTENIENDO TIPOS DE ENVIOS!',
    data: shippingMethods
  })
}
