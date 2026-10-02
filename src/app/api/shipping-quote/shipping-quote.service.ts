import { getCalculationWeight } from "@/src/lib/get-calculation-weight";
import { CUSTOMER_DISCOUNT, DataApp, SHIPPING_METHOD_SURCHARGE } from "../constants";
import { RequestBodyShippingQuote } from "./interface";

export const createShippingQuote = (body: RequestBodyShippingQuote) => {
    const calculationWeight = getCalculationWeight(body.weight);
    if (calculationWeight === null) {
        return {
            code: 400,
            message: 'El peso ingresado no es válido, debe ser mayor a 0.01 y menor o igual a 20',
            data: null
        }
    }

    const valueDiscountTypeClient = CUSTOMER_DISCOUNT.find((item) => item.client_type_id === body.client_type_id);
    const valueSurchargeTypeShipping = SHIPPING_METHOD_SURCHARGE.find((item) => item.shipping_method_id === body.shipping_method_id);

    if (!valueDiscountTypeClient) {
        return {
            code: 400,
            message: 'El tipo de cliente es inválido',
            data: null
        }
    }

    if (!valueSurchargeTypeShipping) {
        return {
            code: 400,
            message: 'El tipo de envío es inválido',
            data: null
        }
    }
    const discount = valueDiscountTypeClient.value;
    const surcharge = valueSurchargeTypeShipping.value;

    const total = ((calculationWeight * body.weight) * (1 - discount)) * (1 + surcharge);

    const data = {
        client_name: body.client_name,
        client_identification: body.client_identification,
        client_type_id: body.client_type_id,
        shipping_method_id: body.shipping_method_id,
        weight: body.weight,
        calculation_weight: calculationWeight,
        discount: valueDiscountTypeClient.label,
        surcharge: valueSurchargeTypeShipping.label,
        total
    }

    DataApp.push(data);

    return {
        code: 200,
        message: 'Cotización de envío calculada exitosamente!',
        data
    }
}