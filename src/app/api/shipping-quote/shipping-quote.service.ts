import { getCalculationWeight } from "@/src/lib/get-calculation-weight";
import { getDB } from "@/src/db/models";
import { CustomerDiscount, ShippingMethodSurcharge, ShippingQuote, User } from "@/src/db/models.interface";
import { RequestBodyShippingQuote } from "./interface";

export const getShippingQuotes = () => {
    return getDB().prepare(`
        SELECT q.*, u.name AS responsible, dt.label AS document_type
        FROM shipping_quotes q
        LEFT JOIN users u ON u.id = q.responsible_id
        LEFT JOIN document_types dt ON dt.id = q.document_type_id
        ORDER BY q.id DESC
    `).all() as ShippingQuote[];
}

export const createShippingQuote = (body: RequestBodyShippingQuote, responsible: User) => {
    const clientName = typeof body.client_name === "string" ? body.client_name.trim() : "";
    const clientIdentification = typeof body.client_identification === "string" ? body.client_identification.trim() : "";
    const documentTypeId = Number(body.document_type_id);
    const clientTypeId = Number(body.client_type_id);
    const shippingMethodId = Number(body.shipping_method_id);
    const weight = Number(body.weight);

    if (!clientName || !clientIdentification || !Number.isInteger(documentTypeId)) {
        return { code: 400, message: "Nombre, tipo de documento y número de documento son obligatorios", data: null };
    }

    const calculationWeight = getCalculationWeight(weight);
    if (calculationWeight === null) {
        return {
            code: 400,
            message: 'El peso ingresado no es válido, debe ser mayor a 0.01 y menor o igual a 20',
            data: null
        }
    }

    const db = getDB();
    const documentType = db.prepare("SELECT id, label FROM document_types WHERE id = ?").get(documentTypeId) as { id: number; label: string } | undefined;
    const valueDiscountTypeClient = db.prepare('SELECT * FROM customer_discounts WHERE client_type_id = ?').get(clientTypeId) as CustomerDiscount | undefined;
    const valueSurchargeTypeShipping = db.prepare('SELECT * FROM shipping_method_surcharges WHERE shipping_method_id = ?').get(shippingMethodId) as ShippingMethodSurcharge | undefined;

    if (!documentType) {
        return { code: 400, message: "El tipo de documento es inválido", data: null };
    }

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

    const total = ((calculationWeight * weight) * (1 - discount)) * (1 + surcharge);

    const existingClient = db.prepare("SELECT id, name FROM clients WHERE document_type_id = ? AND document_number = ?")
        .get(documentTypeId, clientIdentification) as { id: number; name: string } | undefined;

    // Un mismo documento identifica a un solo cliente. Si ya existe, se reutiliza para nuevos envíos.
    if (existingClient && existingClient.name.trim().toLocaleLowerCase() !== clientName.toLocaleLowerCase()) {
        return {
            code: 409,
            message: "El tipo y número de documento ya están registrados para otro cliente",
            data: null,
        };
    }

    const clientId = existingClient?.id ?? Number(db.prepare(`
        INSERT INTO clients (name, document_type_id, document_number)
        VALUES (?, ?, ?)
    `).run(clientName, documentTypeId, clientIdentification).lastInsertRowid);

    const data = {
        client_name: clientName,
        client_identification: clientIdentification,
        document_type_id: documentTypeId,
        client_id: clientId,
        client_type_id: clientTypeId,
        shipping_method_id: shippingMethodId,
        weight,
        calculation_weight: calculationWeight,
        discount: valueDiscountTypeClient.label,
        surcharge: valueSurchargeTypeShipping.label,
        total,
        responsible_id: responsible.id
    }

    const result = db.prepare(`
        INSERT INTO shipping_quotes (client_name, client_identification, document_type_id, client_id, client_type_id, shipping_method_id, weight, calculation_weight, discount, surcharge, total, responsible_id)
        VALUES (@client_name, @client_identification, @document_type_id, @client_id, @client_type_id, @shipping_method_id, @weight, @calculation_weight, @discount, @surcharge, @total, @responsible_id)
    `).run(data);

    return {
        code: 200,
        message: 'Cotización de envío calculada exitosamente!',
        data: { id: Number(result.lastInsertRowid), ...data, document_type: documentType.label, responsible: responsible.name }
    }
}
