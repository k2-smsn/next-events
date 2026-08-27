# Next Events

A ticketing platform for events, built with Next.js and Supabase. Organizers create events and ticket tiers from an admin dashboard, customers buy tickets and pay via PayMongo (GCash, GrabPay, PayMaya), and door staff scan QR codes to redeem tickets at the venue.

## Features

- **Public event pages** — browse events and buy tickets
- **Checkout** — seat/quantity holds with a 15-minute expiry, payment via PayMongo, and automatic release of the hold if payment setup fails
- **Payment webhooks** — PayMongo webhook verifies the request signature, marks orders as paid, and releases holds on failed payments
- **Ticket delivery** — paid orders trigger an email (via Resend) containing a QR code per ticket
- **Admin dashboard** — authenticated area for creating and managing events and ticket types
- **Door scanning** — admin/door-staff view that scans a ticket's QR code and redeems it against the database in real time
- **Role-based access** — `admin` and `door_staff` profile roles, enforced via Supabase Auth + route protection

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions) |
| Database & Auth | [Supabase](https://supabase.com) (Postgres, Auth, RPC functions) |
| Payments | [PayMongo](https://paymongo.com) |
| Email | [Resend](https://resend.com) |
| QR codes | `qrcode` (generation), `html5-qrcode` (scanning) |
| Styling | Tailwind CSS 4 |
| Language | TypeScript |

## Project Structure

```
app/
  admin/                  # Admin dashboard (auth-protected)
    login/                # Admin sign-in
    events/new/           # Create event
    events/[id]/          # Manage an event
    events/[id]/scan/     # QR ticket scanner (door staff)
  api/webhooks/paymongo/  # PayMongo webhook handler
  checkout/[orderId]/return/  # Post-payment return page
  events/[id]/            # Public event detail + purchase page
  components/ui/          # Shared UI components
lib/
  actions/                # Server Actions (auth, events, checkout, tickets)
  supabase/               # Supabase client factories (browser, server, admin)
  paymongo.ts             # PayMongo API wrapper
  tickets.ts              # Ticket QR generation + email sending
proxy.ts                  # Auth-aware middleware for /admin routes
```

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [PayMongo](https://paymongo.com) account (test-mode keys are fine for local development)
- A [Resend](https://resend.com) account

## Getting Started

### Demo access

For the live demo or local testing, sign in at `/admin/login` with:

```text
Email: admin@demo.com
Password: admin123
```

This account must exist in Supabase Authentication and have a matching `profiles` row with the `admin` role. These credentials are intentionally simple for demonstration only; change the password or remove this account before using the app for real events or payments.

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd next-events
npm install
```

### 2. Set up the Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run [`supabase/schema.sql`](./supabase/schema.sql). It creates, in order:
   - The enum types (`event_status`, `order_status`, `ticket_status`)
   - The core tables: `profiles`, `events`, `ticket_types`, `orders`, `tickets`
   - The RPC functions the app calls: `reserve_tickets`, `set_order_payment_intent`, `mark_order_paid_by_intent`, `release_order_hold`, `release_order_hold_by_intent`

   > **`redeem_ticket` is not included** — it's called by the door-scan flow (`lib/actions/tickets.ts`) but its definition wasn't available when this script was put together. `supabase/schema.sql` has a comment describing its expected signature and behavior; you'll need to write and add it yourself before ticket scanning will work.
   >
   > You'll also need to add Row Level Security (RLS) policies on each table appropriate to your access model (e.g. public read access to `published` events, admin-only writes) — none are included in the script.

3. Create an admin user, unless the demo account already exists:
   - In **Authentication → Users**, add a user with an email/password (this is who signs in at `/admin/login`).
   - Insert a matching row into `profiles` with that user's `id` and a `role` of `admin` (or `door_staff` for scan-only access).
4. Collect your API credentials from **Project Settings → API**:
   - Project URL
   - `anon` / publishable key
   - `service_role` key (keep this secret — server-only)

### 3. Set up PayMongo

1. Create an account at [paymongo.com](https://paymongo.com) and use your **test** keys during development.
2. From the PayMongo dashboard, copy your **Secret Key**.
3. Create a webhook pointing to `https://<your-domain>/api/webhooks/paymongo` listening for `payment.paid` and `payment.failed` events, and copy the **Webhook Secret** it generates.
   - For local development, use a tool like the [PayMongo CLI](https://developers.paymongo.com/docs/webhooks) or [ngrok](https://ngrok.com) to expose `localhost` and register that URL as your webhook endpoint.

### 4. Set up Resend

1. Create an account at [resend.com](https://resend.com) and generate an API key.
2. `lib/tickets.ts` sends email from `onboarding@resend.dev` by default. Once you verify your own domain in Resend, update the `from` address in that file.

### 5. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayMongo
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYMONGO_WEBHOOK_SECRET=whsk_xxxxxxxxxxxxx

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (browser + server) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key for browser/server clients, respects RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client, bypasses RLS — used by the payment webhook |
| `PAYMONGO_SECRET_KEY` | Authenticates server-side requests to the PayMongo API |
| `PAYMONGO_WEBHOOK_SECRET` | Verifies the signature on incoming PayMongo webhook requests |
| `RESEND_API_KEY` | Sends ticket confirmation emails |
| `NEXT_PUBLIC_SITE_URL` | Base URL used to build the PayMongo payment return URL |

> Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` / `PAYMONGO_SECRET_KEY` to the client.

### 6. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the public site, and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) to sign in as an admin.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

## Deployment

This app is a standard Next.js app and deploys well to [Vercel](https://vercel.com) or any Node-compatible host. Before deploying:

- Set all environment variables from the table above in your hosting provider's dashboard.
- Update `NEXT_PUBLIC_SITE_URL` to your production domain.
- Point your PayMongo webhook at `https://<your-production-domain>/api/webhooks/paymongo`.
- Switch PayMongo keys from test mode to live mode once you're ready to accept real payments.
- For a demo deployment, use the Vercel URL as the production URL, keep PayMongo in test mode, and use the demo credentials above.
- Do not use `admin@demo.com` / `admin123` for a real deployment. Create a private admin account with a strong password instead.

## Database Schema

See [`supabase/schema.sql`](./supabase/schema.sql) for the full, runnable definitions (tables, enums, and RPC functions). Summary:

- **`profiles`** — extends Supabase Auth users with an `admin` / `door_staff` role
- **`events`** — event details (title, venue, date/time, banner, status: `draft` → `published` → `completed`, or `cancelled`)
- **`ticket_types`** — pricing tiers per event, with total/remaining quantity
- **`orders`** — a customer's purchase, tracks PayMongo payment intent and expiry of the seat hold (status: `pending` → `paid`, or `cancelled`)
- **`tickets`** — individual issued tickets, each with a unique `ticket_code` used for QR redemption (status: `valid` → `redeemed`, or `void`)

### RPC functions

| Function | Called from | Purpose |
|---|---|---|
| `reserve_tickets` | `lib/actions/checkout.ts` | Atomically checks and decrements `remaining_quantity`, then creates a `pending` order — prevents overselling under concurrent checkouts |
| `set_order_payment_intent` | `lib/actions/checkout.ts` | Links a PayMongo payment intent + checkout URL to a pending order |
| `mark_order_paid_by_intent` | `app/api/webhooks/paymongo/route.ts` | On `payment.paid`, marks the order paid and issues one ticket row per unit purchased |
| `release_order_hold` | `lib/actions/checkout.ts` | Releases a seat hold by order id if PayMongo setup fails after the hold was placed |
| `release_order_hold_by_intent` | `app/api/webhooks/paymongo/route.ts` | On `payment.failed`, releases the seat hold by payment intent id |
| `redeem_ticket` *(not included, see below)* | `lib/actions/tickets.ts` | Validates and redeems a scanned ticket code at the door |
