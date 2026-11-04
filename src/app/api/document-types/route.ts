import { getDB } from "@/src/db/models";
import { DocumentType } from "@/src/db/models.interface";
import { NewResponse } from "@/src/lib/responses";

export function GET() {
  const documentTypes = getDB().prepare("SELECT id, label FROM document_types ORDER BY id").all() as DocumentType[];
  return NewResponse({
    code: 200,
    message: "Obteniendo tipos de documento",
    data: documentTypes,
  });
}
