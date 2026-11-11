# Nasheto Vreme - Full Stack Docker Run

This workspace contains:

- `nasheto-vreme-backend` (Spring Boot, PostgreSQL, Flyway)
- `nasheto-vreme-frontend` (static frontend served by Nginx)

## Run everything with Docker Compose

Build backend jar first:

```bash
cd "C:/Users/t1t_vgnikolov/Desktop/nasheto-vreme/nasheto-vreme-backend"
mvn -DskipTests clean package
```

Then start all containers:

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

## Run on another machine (without source build)

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

