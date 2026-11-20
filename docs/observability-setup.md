# Observability Setup Guide

This document outlines the observability stack for Barmeh and how to configure the various components.

## Tracing (OpenTelemetry)

We use OpenTelemetry for distributed tracing. The backend is instrumented to export traces in OTLP format via HTTP.

### Recommended Backends:

1.  **Tempo (Grafana Cloud)**:
    *   **Pros**: Free tier available, integrates perfectly with Grafana dashboards.
    *   **Endpoint**: `https://<your-zone>.grafana.net/tempo` (Requires basic auth headers).
2.  **SigNoz (Self-hosted/Cloud)**:
    *   **Pros**: Open-source, includes metrics, traces, and logs in one UI.
    *   **Endpoint**: `http://<signoz-ip>:4318/v1/traces`.

### Configuration:

Set the following environment variable in your production environment:
`OTEL_EXPORTER_OTLP_ENDPOINT=http://your-collector-endpoint:4318/v1/traces`

---

## Error Tracking (Sentry)

We use Sentry for error reporting and performance monitoring across Backend, Admin, and Mobile.

### Configuration:

1.  Create a project in Sentry for each component.
2.  Set `SENTRY_DSN` in the respective `.env` files.
3.  Release tracking is automatic via Git SHA.

---

## Logs (Pino)

Logs are structured as JSON in production and "pretty-printed" in development.

*   **Production**: Logs should be shipped to a centralized log management system (e.g., Loki, ELK, or Datadog) using a sidecar or log driver.
*   **Context**: Every log includes `requestId` and `userId` if available.
