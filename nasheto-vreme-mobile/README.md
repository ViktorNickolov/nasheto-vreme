# Nasheto Vreme Mobile (Expo)

Initial mobile bootstrap for iOS and Android using Expo + React Native.

## What is included

- Auth starter screens (`Login`, `Register`, `Home`)
- API client with 401 refresh retry logic
- Secure refresh-token storage via `expo-secure-store`
- Navigation setup with `@react-navigation/native-stack`
- Smoke test harness for project wiring

## Project structure

- `App.js` - app entry + stack navigation
- `src/api/http.js` - HTTP client and auth flows
- `src/auth/` - session + token storage helpers
- `src/screens/` - starter screens
- `tests/smoke.test.js` - lightweight structural checks

## Configure API URL

Default API base URL is set in `app.json`:

- `expo.extra.apiBaseUrl`: `http://localhost:8088/api/v1`

For real device testing, replace `localhost` with your machine LAN IP.

## Quick start

Install dependencies:

```bash
cd "C:/Users/t1t_vgnikolov/Desktop/nasheto-vreme/nasheto-vreme-mobile"
npm install
```

Run smoke checks:

```bash
cd "C:/Users/t1t_vgnikolov/Desktop/nasheto-vreme"
npm --prefix nasheto-vreme-mobile test
```

Start Expo:

```bash
cd "C:/Users/t1t_vgnikolov/Desktop/nasheto-vreme/nasheto-vreme-mobile"
npm start
```

## Next milestones

1. Add dashboard modules (`Въпрос на деня`, `Семейни моменти`, `Семейна хроника`)
2. Add file attach/view/download flows
3. Add release profiles (Android internal + TestFlight)

