# Observability Verification Plan

Follow these steps to verify that the observability stack is correctly implemented and functional.

## 1. Health Checks
- [ ] **Liveness**: Call `GET /v1/health`. Should return `200 OK` with `status: "ok"`.
- [ ] **Readiness**: Call `GET /v1/health/ready`.
    - [ ] If DB and Redis are up: `200 OK`.
    - [ ] If ES is down but DB/Redis are up: `200 OK` with `status: "degraded"`.
    - [ ] If DB or Redis are down: `503 Service Unavailable`.

## 2. Request Correlation
- [ ] Perform any API request.
- [ ] **Response Headers**: Check for `X-Request-ID`.
- [ ] **Logs**: Check the application console/logs. The same `requestId` should be present in the log JSON entry.
- [ ] **Sentry**: Check Sentry breadcrumbs for the request. The `requestId` should be attached as a tag.

## 3. Error Tracking (Sentry)
- [ ] **Backend**: Navigate to `GET /v1/__test/trigger-error` (Dev only). Verify the error appears in Sentry with the correct `release` tag (git SHA).
- [ ] **Admin**: Trigger a manual error in the admin panel and verify it reaches Sentry.
- [ ] **Mobile**: Trigger a manual error in the mobile app and verify it reaches Sentry.

## 4. Distributed Tracing (OTEL)
- [ ] **Dev**: Ensure `OpenTelemetry instrumentation started` appears in the console on startup.
- [ ] **Collector**: Check your OTLP collector (Tempo/SigNoz) for incoming spans from `barmeh-api`.
