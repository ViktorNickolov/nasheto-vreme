# Nasheto Vreme - Full Stack Workspace

This repository is organized as a small monorepo and contains:

- `nasheto-vreme-backend` - Spring Boot API (Java 21, PostgreSQL, Flyway)
- `nasheto-vreme-frontend` - React + Vite frontend (served by Nginx in Docker)
- root-level Docker Compose files for local and runtime deployments

## Project structure

```text
.
|-- nasheto-vreme-backend/
|-- nasheto-vreme-frontend/
|-- docker-compose.yml
|-- docker-compose.runtime.yml
`-- .env.runtime.example
```

## Run everything with Docker Compose (local)

Build backend JAR first:

```bash
cd "C:/Users/t1t_vgnikolov/Desktop/nasheto-vreme/nasheto-vreme-backend"
mvn -DskipTests clean package
```

Start all containers:

```bash
cd "C:/Users/t1t_vgnikolov/Desktop/nasheto-vreme"
docker compose up --build
```

## Service URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8088`
- Swagger: `http://localhost:8088/swagger-ui.html`
- PostgreSQL: `localhost:5432`

## Stop and remove containers

```bash
docker compose down
```

## Reset database volume (fresh seed/migrations)

```bash
docker compose down -v
docker compose up --build
```

## Runtime deployment (prebuilt images)

Use prebuilt images and the runtime compose file:

1. Copy `docker-compose.runtime.yml` and `.env.runtime.example`.
2. Create `.env.runtime` from `.env.runtime.example` and set image names.
3. Start runtime stack.

```bash
cd "<your-folder>"
cp .env.runtime.example .env.runtime
docker compose --env-file .env.runtime -f docker-compose.runtime.yml up -d
```

Stop runtime stack:

```bash
docker compose --env-file .env.runtime -f docker-compose.runtime.yml down
```

## CI

GitHub Actions workflow is in `.github/workflows/ci.yml` and validates:

- backend build and tests (`mvn test`)
- frontend smoke test (`npm test`)
