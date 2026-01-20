# Quick Start - Running on Android with Expo Go

## Your Current IP Address
Based on your system, your local IP is: **192.168.1.13**

## Steps to Run on Android Physical Device

1. **Create `.env` file:**
   ```bash
   cd apps/mobile
   cp env.template .env
   ```

2. **Update `.env` with your IP:**
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.13:8080/api/v1
   ```

3. **Make sure backend is running:**
   ```bash
   # In another terminal
   cd apps/backend
   go run cmd/server/main.go
   ```

4. **Start Expo:**
   ```bash
   cd apps/mobile
   pnpm start
   ```

5. **On your Android phone:**
   - Install **Expo Go** from Play Store
   - Scan the QR code from terminal
   - App will load!

## For Android Emulator

No configuration needed! Just run:
```bash
pnpm android
```

## Need to Find Your IP Again?

```bash
pnpm get-ip
```

## Troubleshooting

- **Connection refused?** Make sure backend is running and both devices are on same Wi-Fi
- **Can't connect?** Try `pnpm start --tunnel`
- **IP changed?** Run `pnpm get-ip` and update `.env` file
