import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Thin wrapper over Resend's REST API. We don't bundle the SDK to keep the
// dependency footprint small — Resend has a single POST endpoint.
const RESEND_URL = 'https://api.resend.com/emails';

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

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) {
    logger.debug('Email skipped — RESEND_API_KEY not configured', { to: input.to });
    return { delivered: false, error: 'EMAIL_NOT_CONFIGURED' };
  }

  try {
    const response = await axios.post<{ id: string }>(
      RESEND_URL,
      {
        from: env.EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      },
      {
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    logger.info('Email sent', { to: input.to, messageId: response.data.id });
    return { delivered: true, messageId: response.data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    logger.warn('Email send failed', { to: input.to, error: message });
    return { delivered: false, error: message };
  }
}
