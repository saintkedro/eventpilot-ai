/** Inbound text and metadata normalized from a Meta webhook payload. */
export type InboundWhatsAppMessage = {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  text?: string;
};

/** Subset of Meta WhatsApp webhook payload used for parsing. */
export type WhatsAppWebhookPayload = {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
};

export type WhatsAppWebhookEntry = {
  id?: string;
  changes?: WhatsAppWebhookChange[];
};

export type WhatsAppWebhookChange = {
  field?: string;
  value?: WhatsAppWebhookValue;
};

export type WhatsAppWebhookValue = {
  messaging_product?: string;
  metadata?: {
    display_phone_number?: string;
    phone_number_id?: string;
  };
  messages?: WhatsAppWebhookMessage[];
};

export type WhatsAppWebhookMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body?: string;
  };
};
