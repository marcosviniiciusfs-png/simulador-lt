const DEFAULT_WEBHOOK_URL =
  "https://uxttihjsxfowursjyult.supabase.co/functions/v1/form-webhook/f3cfc5a51fd756205a16ea4b7bb1430857cedce49534ceb525c3d43990e573d3";

const WEBHOOK_URL = import.meta.env.VITE_LEAD_WEBHOOK_URL ?? DEFAULT_WEBHOOK_URL;
const WEBHOOK_TOKEN = import.meta.env.VITE_LEAD_WEBHOOK_TOKEN ?? "whi_odJaxq5NdTefWkl2LxEILlItDIwbwquv";

export interface LeadPayload {
  nome: string;
  telefone: string;
  cidade: string;
  tipo: "IMOVEL";
  tipoBem: string;
  prazoAquisicao: string;
  valorCredito: string;
  temEntrada: string;
  valorEntrada: string;
  parcelaIdeal: string;
  dataEntrada: string;
}

export interface LeadInput {
  fullName: string;
  whatsapp: string;
  city: string;
  propertyType: string;
  acquisitionTime: string;
  creditAmount: string;
  hasDownPayment: string;
  downPaymentAmount: string;
  monthlyPayment: string;
}

export class LeadValidationError extends Error {
  constructor(public readonly missingFields: string[]) {
    super(`Campos obrigatórios faltando: ${missingFields.join(", ")}`);
    this.name = "LeadValidationError";
  }
}

const REQUIRED_FIELDS: Array<keyof LeadInput> = [
  "fullName",
  "whatsapp",
  "city",
  "propertyType",
  "creditAmount",
  "monthlyPayment",
];

export function buildLeadPayload(input: LeadInput): LeadPayload {
  const downPayment =
    input.hasDownPayment === "Sim" ? input.downPaymentAmount : "Não tem";

  return {
    nome: input.fullName.trim(),
    telefone: input.whatsapp,
    cidade: input.city.trim(),
    tipo: "IMOVEL",
    tipoBem: input.propertyType,
    prazoAquisicao: input.acquisitionTime,
    valorCredito: input.creditAmount,
    temEntrada: input.hasDownPayment,
    valorEntrada: downPayment,
    parcelaIdeal: input.monthlyPayment,
    dataEntrada: new Date().toISOString(),
  };
}

function validate(input: LeadInput) {
  const missing = REQUIRED_FIELDS.filter((field) => !input[field]?.toString().trim());
  if (missing.length > 0) {
    throw new LeadValidationError(missing);
  }
  if (input.whatsapp.replace(/\D/g, "").length !== 11) {
    throw new LeadValidationError(["whatsapp"]);
  }
}

export async function sendLeadToWebhook(input: LeadInput): Promise<LeadPayload> {
  validate(input);
  const payload = buildLeadPayload(input);

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WEBHOOK_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Webhook respondeu com status ${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  return payload;
}
