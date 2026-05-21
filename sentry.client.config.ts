import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Porcentaje de transacciones que se envían (1.0 = 100%)
  // Bajarlo en producción si hay mucho tráfico (ej. 0.1 = 10%)
  tracesSampleRate: 1.0,

  // Replay de sesiones solo en errores (no graba videos de usuarios)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  // No capturar en desarrollo local
  enabled: process.env.NODE_ENV === "production",

  integrations: [
    Sentry.replayIntegration({
      maskAllText:    true,
      blockAllMedia:  true,
    }),
  ],
});
