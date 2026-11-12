# Nasheto Vreme Backend (Foundation)

Foundation setup for the MVP backend of "Нашето време".

## Included in Foundation

- Spring Boot 3.5.x + Java 21
- PostgreSQL + Flyway migrations
- Dockerfile + docker-compose for local DB
- Actuator health endpoint
- OpenAPI/Swagger UI
- Base JPA entity with audit fields
- Global exception handler
- Security starter + baseline filter chain
- Starter package structure for next modules

## Project Structure

```text
src/main/java/com/nashetovreme
├── common
├── config
├── exception
├── family
├── moment
├── question
├── security
├── shared
└── user
```

## Endpoints

- Health: `GET /actuator/health`
- Swagger UI: `GET /swagger-ui.html`
- OpenAPI JSON: `GET /v3/api-docs`

## Run Locally

Requirements:

- JDK 21
- Maven 3.8+
- Docker (for PostgreSQL)

1. Start PostgreSQL:

    ```bash
    docker compose up -d
    ```

2. Run the backend:

    ```bash
    mvn spring-boot:run
    ```

## Build and Test

```bash
mvn clean test
mvn clean package
```

## Production Security Configuration

These environment variables are required when running with `prod` profile:

- `APP_JWT_SECRET`: Base64-encoded secret (minimum 32 decoded bytes)
- `APP_CORS_ORIGINS`: comma-separated allowed origins

Example:

```bash
APP_JWT_SECRET=<base64-secret>
APP_CORS_ORIGINS=https://app.example.com
```

## Production Release Security Checklist

- [ ] `APP_JWT_SECRET` is set from secret manager (not committed in source control)
- [ ] `APP_CORS_ORIGINS` contains only trusted frontend domains
- [ ] TLS is enabled in front of the backend (HSTS requires HTTPS)
- [ ] Backend and frontend test suites pass
- [ ] Dependency security gate passes (`npm audit` high+ and OWASP dependency-check)
- [ ] Audit logs are collected and retained according to policy

## Secret Rotation Policy

- Rotate `APP_JWT_SECRET` on a fixed cadence (for example every 90 days) and immediately after suspected exposure.
- During planned rotation, deploy a maintenance window or force re-authentication because existing JWTs become invalid.
- Keep rotation history in your secret manager metadata (who rotated, when, and why).
- Never share secrets over chat/email; inject them at runtime via environment variables or secret stores.

## Next Step

After Foundation, implement `Auth` module (JWT register/login), then continue with `Family`, `Questions`, `Moments`, `Uploads`, and `Timeline`.
