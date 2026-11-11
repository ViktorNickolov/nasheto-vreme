# Nasheto Vreme Frontend (React POC)

React proof-of-concept frontend that integrates with the backend API.

## What this POC supports

- Register / login
- API base URL configuration
- Load current profile (`/auth/me`)
- Load question of the day (`/questions/today`)
- Logout

## Requirements

- Node.js 20+
- Running backend on `http://localhost:8088`

## Run locally

```bash
cd "C:/Users/t1t_vgnikolov/Desktop/nasheto-vreme/nasheto-vreme-frontend"
npm install
npm test
npm run dev
```

Open:

- `http://localhost:5173`

## Build production assets

```bash
npm run build
npm run preview
```

## Backend note

Default API base URL:

- `http://localhost:8088/api/v1`

You can change it from the app sidebar.
