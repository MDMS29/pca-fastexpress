import { getCalculationWeight } from "@/src/lib/get-calculation-weight";
import { getDB } from "@/src/db/models";
import { CustomerDiscount, ShippingMethodSurcharge, ShippingQuote, User } from "@/src/db/models.interface";
import { RequestBodyShippingQuote } from "./interface";

export const getShippingQuotes = () => {
    return getDB().prepare(`
        SELECT q.*, u.name AS responsible
        FROM shipping_quotes q
        LEFT JOIN users u ON u.id = q.responsible_id
        ORDER BY q.id DESC
    `).all() as ShippingQuote[];
}

export const createShippingQuote = (body: RequestBodyShippingQuote, responsible: User) => {
    const calculationWeight = getCalculationWeight(body.weight);
    if (calculationWeight === null) {
        return {
            code: 400,
            message: 'El peso ingresado no es válido, debe ser mayor a 0.01 y menor o igual a 20',
            data: null
        }
    }

    const db = getDB();
    const valueDiscountTypeClient = db.prepare('SELECT * FROM customer_discounts WHERE client_type_id = ?').get(body.client_type_id) as CustomerDiscount | undefined;
    const valueSurchargeTypeShipping = db.prepare('SELECT * FROM shipping_method_surcharges WHERE shipping_method_id = ?').get(body.shipping_method_id) as ShippingMethodSurcharge | undefined;

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
        total,
        responsible_id: responsible.id
    }

    const result = db.prepare(`
        INSERT INTO shipping_quotes (client_name, client_identification, client_type_id, shipping_method_id, weight, calculation_weight, discount, surcharge, total, responsible_id)
        VALUES (@client_name, @client_identification, @client_type_id, @shipping_method_id, @weight, @calculation_weight, @discount, @surcharge, @total, @responsible_id)
    `).run(data);

    return {
        code: 200,
        message: 'Cotización de envío calculada exitosamente!',
        data: { id: Number(result.lastInsertRowid), ...data, responsible: responsible.name }
    }
}