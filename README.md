# VenueOps MVP

A first working POS MVP for a bar, cafe, restaurant, or lounge.

This starter includes:

- Login with a demo owner account
- Role structure: ADMIN, MANAGER, BARTENDER, WAITER
- Venue setup
- Menu categories
- Menu items
- Tables / bar area
- Simple paid POS order
- Payment method recording: cash, card, mobile
- Tip recording
- Daily closing
- Basic reports
- Audit logs for important actions

This version does not yet include payment terminal integration, inventory recipes, staff scheduling, refunds/voids UI, or multi-item cart. Those are the next milestones.

## Recommended place to build and launch

Best practical setup:

1. Build locally with VS Code or Cursor.
2. Save the code in GitHub.
3. Use Supabase Postgres for the database, or local Docker Postgres while developing.
4. Deploy the Next.js app on Vercel.

For the first test, local Docker Postgres is easiest. For a real online test, Supabase + Vercel is easier.

## Requirements

- Node.js 20.19 or newer
- npm
- Docker Desktop, optional but recommended for local database

## Setup from zero

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start local PostgreSQL
npm run docker:up
```

There is no `docker:up` script by default, so you can also run:

```bash
docker compose up -d
```

Then run:

```bash
# 4. Create database tables
npm run db:migrate -- --name init

# 5. Generate Prisma Client
npm run db:generate

# 6. Add demo data
npm run db:seed

# 7. Start app
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

Demo login:

```text
Email: owner@demo.com
Password: owner123
```

## Database notes

The database uses Prisma with PostgreSQL.

Important models:

- Venue
- User
- MenuCategory
- MenuItem
- VenueTable
- Order
- OrderItem
- Payment
- Tip
- Discount
- Refund
- Void
- DailyClosing
- AuditLog

## First test flow

1. Login as owner.
2. Go to Menu.
3. Confirm demo categories and items exist.
4. Go to POS.
5. Create a paid order.
6. Go to Dashboard and Reports.
7. Go to Daily Closing.
8. Enter counted cash.
9. Close day.

## Next milestone

Build the real POS cart:

- Add multiple items to one order
- Keep an order open as a table/tab
- Add split payments
- Add discounts
- Add voids/refunds with manager approval
- Add receipt printing/emailing

## Production reminders

Before real launch:

- Change SESSION_SECRET.
- Change the demo password.
- Use real user creation flow.
- Enable HTTPS in production.
- Use a real payment provider/terminal for card payments.
- Add backups for the PostgreSQL database.
- Add detailed VAT/tax settings.
- Add audit review screens.
