# Nasheto Vreme Frontend (React)

React + Vite frontend for the Nasheto Vreme backend API.

## What it supports

- Register / login / refresh token / me
- Get question of the day
- Create answer and load family answers
- Create and list moments
- Upload image
- Load family timeline
- Generate and download PDF book

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

You can change it in the sidebar of the app.
