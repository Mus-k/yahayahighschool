import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/csv',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Record<string, unknown> => ({
  // ── Users & Permissions (built-in to Strapi v5) ──────────────────────────
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },

  // ── Upload (built-in, configure allowed types) ───────────────────────────
  upload: {
    config: {
      sizeLimit: 250 * 1024 * 1024, // 250 MB max upload
    },
  },

  // ── i18n (built-in to Strapi v5) ─────────────────────────────────────────
  i18n: {
    enabled: true,
    config: {
      defaultLocale: env('DEFAULT_LOCALE', 'en'),
      locales: ['en', 'ar', 'fr', 'tr'],
    },
  },

  // ── Email (built-in to Strapi v5, uses sendmail by default) ──────────────
  // To enable SMTP, install: npm install @strapi/provider-email-nodemailer
  // Then uncomment and configure below:
  // email: {
  //   config: {
  //     provider: 'nodemailer',
  //     providerOptions: {
  //       host: env('SMTP_HOST', 'smtp.gmail.com'),
  //       port: env.int('SMTP_PORT', 587),
  //       auth: {
  //         user: env('SMTP_USERNAME', ''),
  //         pass: env('SMTP_PASSWORD', ''),
  //       },
  //       secure: false,
  //     },
  //     settings: {
  //       defaultFrom: env('EMAIL_FROM', 'noreply@yahayascool.edu.ng'),
  //       defaultReplyTo: env('EMAIL_REPLY_TO', 'support@yahayascool.edu.ng'),
  //     },
  //   },
  // },
});

export default config;
