import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

interface WhatsAppTextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: { body: string };
}

interface WhatsAppSendResponse {
  messages: Array<{ id: string }>;
}

const whatsappAxios: AxiosInstance = axios.create({
  baseURL: `${env.WHATSAPP_API_URL}/${env.WHATSAPP_PHONE_NUMBER_ID}`,
  timeout: 10000,
  headers: {
    Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export interface SendMessageResult {
  messageId: string;
}

export async function sendWhatsAppMessage(
  to: string,
  content: string,
): Promise<SendMessageResult> {
  const payload: WhatsAppTextMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: content },
  };

  const response = await whatsappAxios.post<WhatsAppSendResponse>('/messages', payload);
  const messageId = response.data.messages[0]?.id ?? '';
  return { messageId };
}

export { whatsappAxios };
