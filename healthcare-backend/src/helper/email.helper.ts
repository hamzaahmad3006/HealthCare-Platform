import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Brevo (formerly Sendinblue) transactional email — chosen over Resend for the
// 3x larger free tier (300/day) and because Brevo's same dashboard also
// exposes WhatsApp + SMS APIs we can consolidate onto later.
//
// Reference: https://developers.brevo.com/reference/sendtransacemail
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface SendEmailResult {
  delivered: boolean;
  messageId?: string;
  error?: string;
}

interface BrevoSuccess {
  messageId: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.BREVO_API_KEY) {
    logger.debug('Email skipped — BREVO_API_KEY not configured', { to: input.to });
    return { delivered: false, error: 'EMAIL_NOT_CONFIGURED' };
  }

  try {
    const response = await axios.post<BrevoSuccess>(
      BREVO_URL,
      {
        sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
        to: [{ email: input.to }],
        subject: input.subject,
        textContent: input.text,
        ...(input.html ? { htmlContent: input.html } : {}),
      },
      {
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10000,
      },
    );

    logger.info('Email sent', { to: input.to, messageId: response.data.messageId });
    return { delivered: true, messageId: response.data.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    // Brevo returns useful errors in response.data — surface them so the
    // admin success modal can show why delivery failed.
    const apiError =
      axios.isAxiosError(err) && err.response?.data
        ? JSON.stringify(err.response.data)
        : message;
    logger.warn('Email send failed', { to: input.to, error: apiError });
    return { delivered: false, error: apiError };
  }
}
