# Anime Calendar

A personal seven-day anime broadcast calendar powered directly by the AniList GraphQL API and localized to `Asia/Bangkok`. It includes seasonal and finished-anime catalogs, device bookmarks, offline support as an installable PWA, and Web Push release notifications backed by Supabase. Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and shadcn/ui.

## Features

### Calendar Views

- **Weekly View**: Browse anime releases across the next seven days, grouped by day with day tabs.
- **Timeline View**: Follow upcoming releases in chronological order.
- **Upcoming Release Banner**: Highlight the next release with a live countdown.
- **Centralized Countdown**: Keep all countdowns synchronized with a single timer.
- **Anime Formats**: Support `TV`, `TV_SHORT`, `MOVIE`, `SPECIAL`, `OVA`, `ONA`, and `MUSIC` on the calendar, seasonal catalog, and finished-anime pages. Calendar entries require a scheduled airing time from AniList.

### Seasonal Catalogs

- **Seasons Page**: Browse anime by year and season (`Winter`, `Spring`, `Summer`, `Fall`) at `/calendar/seasons`, sorted by AniList popularity.
- **Finished Anime Page**: Browse finished anime by year and season at `/calendar/completed`.
- **Current Season Default**: Open each catalog on the current anime season.
- **Load More**: Load additional catalog pages on demand, keeping already loaded results when a later page fails.

### Search and Filters

- **Multilingual Search**: Search English, Romaji, and Native titles, with AniList search starting from two characters.
- **Status Filter**: Filter releases by `UPCOMING`, `AIRING`, or `AIRED` status.
- **Format Filter**: Filter releases by anime format.
- **Adult Content Filter**: Include or hide 18+ titles after a one-time confirmation on the device.
- **Aired Releases Filter**: Show or hide releases that have already aired.

### Details and Preferences

- **Release Details**: Open a detail dialog using `?release=<anilist_schedule_id>`.
- **Theme Support**: Choose Light, Dark, or System theme.
- **Persistent Preferences**: Store view mode, filters, theme, and adult confirmation on each device.
- **Cache Fallback**: Continue using cached schedule data when an AniList update fails, and show a retry hint when AniList rate-limits requests.

### PWA and Notifications

- **Installable PWA**: Install the app through the web app manifest and service worker.
- **Offline Access**: Open the latest saved seven-day schedule offline, with a dedicated `/offline` fallback page.
- **Device Bookmarks**: Add or remove anime bookmarks offline and sync them after reconnecting.
- **Notification Modes**: Choose notifications for every release or for bookmarked anime only.
- **Web Push**: Receive the title, episode, and Bangkok airtime, then open the release detail dialog.
- **In-App Fallback**: Show due release notifications as in-app toasts while the app is open.
- **Adult Guard**: Notify 18+ releases only after the user confirms and enables adult content on that device.
- **iOS Guidance**: Indicate when notifications on iOS require installing the app to the Home Screen.

## Tech Stack

- [Next.js](https://nextjs.org/) 16 (App Router, Turbopack) and React 19
- TypeScript
- Tailwind CSS 4 and shadcn/ui
- TanStack Query and Redux Toolkit
- `date-fns` with `@date-fns/tz`
- `idb` for IndexedDB storage
- Zod for validation
- Supabase (PostgreSQL, Vault, pg_cron, Edge Functions) for the notification backend
- [AniList GraphQL API](https://docs.anilist.co/) for anime data

## Installation

### Prerequisites

- Node.js and npm
- A Supabase project for bookmarks and notifications
- Docker, when running the local Supabase stack with `npm run supabase:start`

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

`npm run dev` and `npm run build` first bundle the service worker into `public/sw.js` through `npm run build:service-worker`.

### Scripts

| Script                         | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| `npm run dev`                  | Start the development server with Turbopack.      |
| `npm run build`                | Create a production build with Turbopack.         |
| `npm run start`                | Start the production server.                      |
| `npm run build:service-worker` | Bundle `src/service-worker/` into `public/sw.js`. |
| `npm run supabase:start`       | Start the local Supabase stack.                   |
| `npm run supabase:stop`        | Stop the local Supabase stack.                    |
| `npm run lint`                 | Lint source files with ESLint.                    |
| `npm run lint:fix`             | Lint source files and apply automatic fixes.      |
| `npm run format`               | Format source files with Prettier.                |

## Environment Setup

Copy the application environment template before running the project locally:

```powershell
Copy-Item .env.example .env.local
```

The application reads the following variables:

| Variable                       | Purpose                                           | Visibility  |
| ------------------------------ | ------------------------------------------------- | ----------- |
| `NEXT_PUBLIC_SITE_URL`         | Canonical production origin used in metadata      | Public      |
| `SUPABASE_URL`                 | Supabase project URL used by server routes        | Server only |
| `SUPABASE_SERVICE_ROLE_KEY`    | Administrative Supabase key used by server routes | Secret      |
| `NOTIFICATION_CRON_SECRET`     | Authorizes the schedule-sync cron request         | Secret      |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Web Push subscription key                  | Public      |

Replace every example value in `.env.local`. Never commit `.env.local`, a service-role key, a private VAPID key, or a notification secret.

### Generate Notification Secrets

Run this one-line PowerShell command to create a 64-character hexadecimal secret, copy it to the clipboard, and display it locally:

```powershell
$secret=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant(); Set-Clipboard $secret; $secret
```

Generate separate values for the cron secret and the Edge Function secret. Do not reuse either value for unrelated services.

### Generate VAPID Keys

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

For Edge Function, Vault, cron, migration, and notification-pipeline setup, continue with the [Supabase notification backend guide](supabase/README.md).

## Project Structure

```text
src/
├── app/                  # Routes, API route handlers, manifest, metadata
├── components/ui/        # shadcn/ui components
├── features/
│   ├── anime-bookmarks/      # Device bookmarks with offline outbox
│   ├── anime-calendar/       # Weekly and timeline calendar, search, filters
│   ├── anime-notifications/  # Notification settings, push subscription, fallback
│   ├── anime-schedule/       # AniList client, schedule cache, transforms
│   ├── anime-seasons/        # Seasonal and finished-anime catalogs
│   ├── app-loading/          # Loading animation and route loading state
│   ├── app-shell/            # Header and bottom navigation
│   ├── device-session/       # Device session for API routes
│   ├── offline-storage/      # IndexedDB database
│   ├── pwa/                  # Service worker registration
│   └── theme/                # Theme store and switcher
├── lib/                  # Shared API, Supabase, and utility modules
└── service-worker/       # Service worker caching and push handlers
supabase/
├── functions/            # send-notification-batch Edge Function
└── migrations/           # Notification schema, functions, and cron jobs
```

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions, issues and feature requests are welcome!

## Show your support

Give a ⭐️ if this project helped you!

## Author

**Made with ❤️ by @jirateep12z**
