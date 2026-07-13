# Anime Calendar

📅 A personal seven-day anime broadcast calendar powered directly by the AniList GraphQL API and localized to `Asia/Bangkok`.

## ✨ Features

### Calendar Views

- **Weekly View** - Browse anime releases across seven days
- **Timeline View** - Follow upcoming releases in chronological order
- **Centralized Countdown** - Keep all countdowns synchronized with a single timer
- **Anime Formats** - Show only `TV` and `ONA` anime

### Search and Filters

- **Multilingual Search** - Search English, Romaji, and Native titles
- **Status Filter** - Filter anime by airing status
- **Format Filter** - Filter anime by format
- **Adult Content Filter** - Include or hide 18+ titles
- **Aired Releases Filter** - Show or hide releases that have already aired

### Details and Preferences

- **Release Details** - Open a detail dialog using `?release=<anilist_schedule_id>`
- **Theme Support** - Choose Light, Dark, or System theme
- **Local Storage** - Persist cached data and user preferences on each device
- **Cache Fallback** - Continue using existing cached data when an AniList update fails

### PWA and Notifications

- **PWA & Offline** - Install the app and open the latest saved seven-day schedule offline
- **Device Bookmarks** - Add or remove anime bookmarks offline and sync them after reconnecting
- **Notification Modes** - Choose every release or bookmarked anime only
- **Web Push** - Receive the title, episode, and Bangkok airtime, then open its detail dialog
- **Adult Guard** - Notify 18+ releases only after the user confirms and enables adult content on that device

## 🚀 Installation

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Format code
npm run format
```

## 🔐 Environment Setup

Copy the application environment template before running the project locally:

```powershell
Copy-Item .env.example .env.local
```

The application reads the following variables:

| Variable | Purpose | Visibility |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical production origin used in metadata | Public |
| `SUPABASE_URL` | Supabase project URL used by server routes | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative Supabase key used by server routes | Secret |
| `NOTIFICATION_CRON_SECRET` | Authorizes the schedule-sync cron request | Secret |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Web Push subscription key | Public |

Replace every example value in `.env.local`. Never commit `.env.local`, a service-role key, a private VAPID key, or a notification secret.

### Generate notification secrets

Run this one-line PowerShell command to create a 64-character hexadecimal secret, copy it to the clipboard, and display it locally:

```powershell
$secret=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant(); Set-Clipboard $secret; $secret
```

Generate separate values for the cron secret and Edge Function secret. Do not reuse either value for unrelated services.

### Generate VAPID keys

Generate the paired public and private Web Push keys:

```bash
node scripts/generate-vapid-keys.mjs
```

The command writes two files under the ignored `vapid-output/` directory:

- Copy the complete contents of `vapid-output/vapid-public-key.txt` to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in `.env.local` and Vercel.
- Copy the complete contents of `vapid-output/vapid-keys.json` to `VAPID_KEYS_JSON` in the Supabase Edge Function secrets.

These two files must come from the same command execution. Running the generator again replaces both files with a different key pair and invalidates the previous relationship.

### Configure Vercel

In **Vercel → Project → Environment Variables**, add all variables from `.env.example` and scope them to **Production**. Use the stable production domain, including `https://`, for `NEXT_PUBLIC_SITE_URL`.

After adding or changing an environment variable, redeploy the latest production deployment. Existing deployments continue using the environment snapshot that was present when they were built.

The Vercel `NOTIFICATION_CRON_SECRET` value must exactly match the Supabase Vault secret named `notification_cron_secret`. Leading spaces, trailing spaces, and line breaks make the values different.

For Edge Function, Vault, cron, and notification-pipeline setup, continue with the [Supabase notification backend guide](supabase/README.md).

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!

## 📝 Author

**Made with ❤️ by @jirateep12z**
