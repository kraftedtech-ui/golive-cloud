# GoLive Cloud Marketplace

**Microsoft 365, Copilot, Azure, Defender & Power Platform for African Businesses**

GoLive Digital Solutions · Africa-Authorized Microsoft CSP · [cloud.golivecompany.com](https://cloud.golivecompany.com)

---

## What this is

A Next.js 16 web application with two parts:

- **Public landing page** — `cloud.golivecompany.com` — GoLive Cloud Marketplace for African SMEs to discover Microsoft cloud services and submit assessment requests
- **Internal portal** — `cloud.golivecompany.com/portal` — CRM pipeline, lead management, proposal generator, onboarding checklists and customer accounts for GoLive staff

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js (credentials) |
| Email | Nodemailer → Microsoft 365 SMTP |
| Styling | Inline styles + Tailwind CSS |
| Runtime | Node.js 22+ via PM2 |
| Server | aaPanel · Hetzner Dedicated · 65.108.124.35 |

---

## Local development setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/golive-cloud.git
cd golive-cloud

# Install dependencies
npm install

# Copy env template and fill in your values
cp .env.example .env.local
nano .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your site |
| `ADMIN_EMAIL` | Portal login email |
| `ADMIN_PASSWORD` | Portal login password |
| `SMTP_HOST` | Microsoft 365 SMTP host |
| `SMTP_PORT` | 587 |
| `SMTP_USER` | Your M365 email |
| `SMTP_PASS` | Your M365 email password |
| `NOTIFY_EMAIL` | Where new leads are emailed |
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `NEXT_PUBLIC_WA_NUMBER` | WhatsApp number (digits only) |

---

## Deployment to aaPanel (production)

```bash
# SSH into server
ssh root@65.108.124.35

# Navigate to project
cd /www/wwwroot/golive-cloud

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Build for production
npm run build

# Restart PM2
pm2 restart golive-cloud
pm2 save
```

---

## Project structure

```
golive-cloud/
├── app/
│   ├── page.tsx                    # Public landing page
│   ├── layout.tsx                  # Root layout + SEO metadata
│   ├── globals.css                 # GoLive brand styles
│   ├── portal/
│   │   ├── page.tsx                # Internal admin portal
│   │   └── login/page.tsx          # Portal login
│   └── api/
│       ├── leads/
│       │   ├── route.ts            # GET all leads / POST new lead
│       │   └── [id]/route.ts       # GET/PATCH single lead
│       └── auth/
│           └── [...nextauth]/route.ts  # NextAuth handler
├── lib/
│   ├── mongodb.ts                  # DB connection singleton
│   └── email.ts                    # Nodemailer email functions
├── models/
│   └── Lead.ts                     # Mongoose Lead schema
├── middleware.ts                   # Portal route protection
├── server.js                       # PM2 entry point
├── .env.example                    # Environment template
└── .gitignore                      # Never commits .env.local
```

---

## 5 Microsoft cloud pillars

1. **Microsoft 365** — Business Basic, Business Standard, Business Premium
2. **Microsoft Copilot** — AI readiness audit, licensing, training
3. **Azure Cloud** — VMs, backup, SQL, app hosting, DR
4. **Microsoft Defender** — Endpoint protection, MFA, anti-phishing
5. **Power Platform** — Power Apps, Automate, BI, SharePoint workflows

---

## Target markets

| Priority | Country | Currency |
|----------|---------|----------|
| 1 | Nigeria 🇳🇬 | NGN |
| 2 | Ghana 🇬🇭 | GHS |
| 3 | Kenya 🇰🇪 | KES |
| 4 | South Africa 🇿🇦 | ZAR |
| 5+ | Rwanda, Uganda, Senegal, Cameroon | — |

---

## Roadmap

- [ ] Distributor API integration (pricing + provisioning)
- [ ] Proposal PDF generator
- [ ] Customer account management
- [ ] Microsoft Graph API — tenant management
- [ ] Renewal tracking and alerts
- [ ] Multi-user portal with roles
- [ ] WhatsApp Business API integration

---

## License

Private — GoLive Digital Solutions Company Ltd. All rights reserved.
