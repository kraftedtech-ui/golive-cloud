import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { KnowledgeArticle } from '@/models/KnowledgeArticle'
import { requireSession, requireAdmin } from '@/lib/apiAuth'

const SEED_ARTICLES = [
  {
    title: 'What is Microsoft 365?',
    slug: 'what-is-microsoft-365',
    category: 'M365 Basics',
    tags: ['m365', 'overview', 'basics'],
    body: `## What is Microsoft 365?

Microsoft 365 (formerly Office 365) is a cloud-based productivity suite that combines best-in-class Office apps with intelligent cloud services and world-class security.

### What's included?
- **Microsoft Teams** – Chat, meetings, calls, and collaboration
- **Word, Excel, PowerPoint, Outlook** – The full Office suite, online and desktop
- **Exchange Online** – Business email with your custom domain
- **SharePoint & OneDrive** – Cloud storage and intranet
- **Microsoft Defender** – Security and threat protection

### Why businesses choose M365
1. Work from anywhere, any device
2. Always up-to-date software (no version upgrades)
3. Enterprise-grade security built in
4. Predictable monthly or annual subscription cost
5. Scales from 1 to 300+ users seamlessly

### Common SKUs we sell
| Plan | Best for | Key feature |
|---|---|---|
| M365 Business Basic | Small teams | Teams + web Office only |
| M365 Business Standard | Most businesses | Full desktop Office |
| M365 Business Premium | Security-conscious | Intune + Defender |
| M365 E3 | Enterprise | Advanced compliance |`,
    createdBy: 'GoLive Admin',
    pinned: true,
  },
  {
    title: 'How to migrate a customer from Gmail to M365',
    slug: 'gmail-to-m365-migration',
    category: 'Migration How-Tos',
    tags: ['migration', 'gmail', 'exchange', 'email'],
    body: `## Gmail to Microsoft 365 Migration Guide

### Before you start
- Confirm the customer's domain registrar (Namecheap, GoDaddy, etc.)
- Note the number of mailboxes and total data size
- Agree a cutover date with the customer (preferably a Friday evening)

### Step 1 — Set up M365 tenant
1. Log in to [admin.microsoft.com](https://admin.microsoft.com)
2. Add the customer's domain under **Settings > Domains**
3. Verify domain ownership (TXT record via registrar)
4. Create all user accounts and assign M365 Business Standard licences

### Step 2 — Configure Gmail migration
1. In M365 Admin Centre, go to **Setup > Data migration**
2. Select **Gmail** as the source
3. Enter a Google Workspace admin account with permissions
4. Map Gmail users to M365 mailboxes

### Step 3 — Run the migration
- Start a test batch with 2–3 users first
- Monitor migration progress under **Exchange Admin > Migration**
- Allow 24–48 hours for full mailbox sync

### Step 4 — DNS cutover
Update the customer's domain MX records to point to Microsoft:
\`\`\`
MX record: customer-domain.mail.protection.outlook.com  Priority: 0
\`\`\`
Allow 1–4 hours for DNS propagation.

### Step 5 — Post-migration
- Verify all email is flowing into M365
- Set up Outlook on desktop and mobile for each user
- Configure Teams and SharePoint if included in the plan
- Disable Gmail forwarding after 48 hours

### Common issues
- **MX records slow to update**: Ask registrar to lower TTL to 300 before cutover
- **Missing emails after cutover**: Check spam filter settings in Exchange Admin`,
    createdBy: 'GoLive Admin',
    pinned: false,
  },
  {
    title: 'Microsoft 365 Licence Management — Adding and Removing Users',
    slug: 'm365-licence-management',
    category: 'Admin How-Tos',
    tags: ['licences', 'admin', 'users', 'management'],
    body: `## M365 Licence Management

### Adding a new user
1. Go to **admin.microsoft.com > Users > Active users**
2. Click **Add a user**
3. Fill in: display name, username (becomes their email), password
4. Under **Licences**, assign the appropriate M365 plan
5. Click **Finish adding**
6. The user can immediately log in at portal.office.com

### Removing a user (offboarding)
1. Go to **Active users**, find the user, click their name
2. Click **Delete user**
3. Choose whether to keep or delete their OneDrive data (keep for 30 days minimum)
4. The licence is automatically released back to your pool

### Reassigning a licence
- You cannot directly reassign — remove from one user, then assign to new user
- Licence is available immediately after removal

### Checking your licence count
- Go to **Billing > Your products**
- Shows licences purchased vs assigned
- Add more licences directly from this page

### CSP billing (how we handle it)
As your Microsoft CSP reseller, GoLive manages your licence pool. To add or remove licences:
- WhatsApp or email us at contact@golivecompany.com
- Changes take effect same business day
- Billing is adjusted on your next monthly invoice`,
    createdBy: 'GoLive Admin',
    pinned: false,
  },
  {
    title: 'Microsoft Teams — Getting Started for End Users',
    slug: 'teams-getting-started',
    category: 'End User Guides',
    tags: ['teams', 'collaboration', 'end user', 'guide'],
    body: `## Getting Started with Microsoft Teams

### What is Teams?
Microsoft Teams is your hub for teamwork — chat, meetings, file sharing, and apps, all in one place.

### Downloading Teams
- **Desktop**: Download from [teams.microsoft.com](https://teams.microsoft.com/downloads)
- **Mobile**: Search "Microsoft Teams" on App Store or Google Play
- **Browser**: Go to [teams.microsoft.com](https://teams.microsoft.com) and sign in

### Sign in
Use your work email (yourname@yourcompany.com) and the password your admin set up.

### Key features

**Chat**
- Click the Chat icon on the left sidebar
- Start a new chat by clicking the pencil icon
- Use @mention to notify someone specifically

**Meetings**
- Click Calendar on the left sidebar
- Click **New meeting** to schedule
- Or click **Meet now** to start instantly
- Share the meeting link with anyone (they don't need Teams installed)

**Teams & Channels**
- A Team is like a department (e.g. "Sales", "Support")
- Channels are topics within a team (e.g. "General", "Proposals")
- Post messages in channels so everyone on the team can see

**Files**
- Every channel has a Files tab — this is shared SharePoint storage
- Drag and drop files directly into Teams
- Edit Word/Excel/PowerPoint files directly inside Teams

### Tips
- Set your status (Available, Busy, Do Not Disturb) so colleagues know when to reach you
- Use the search bar at the top to find messages, files, and people
- Enable notifications under Settings > Notifications`,
    createdBy: 'GoLive Admin',
    pinned: false,
  },
  {
    title: 'OneDrive — Cloud Storage Guide',
    slug: 'onedrive-guide',
    category: 'End User Guides',
    tags: ['onedrive', 'storage', 'backup', 'files'],
    body: `## OneDrive for Business — Guide

### What is OneDrive?
OneDrive is your personal cloud storage included with Microsoft 365. Each user gets 1TB of storage. Files saved to OneDrive sync across all your devices automatically.

### Accessing OneDrive
- **Web**: Go to [onedrive.com](https://onedrive.com) and sign in with your work account
- **Desktop**: Install the OneDrive sync app — files appear in File Explorer (Windows) or Finder (Mac)
- **Mobile**: Download the OneDrive app

### Setting up desktop sync
1. Download OneDrive from [onedrive.com](https://onedrive.com)
2. Sign in with your work Microsoft account
3. Choose which folders to sync locally
4. A OneDrive folder appears in your File Explorer — drag files here to back them up

### Sharing files
1. Right-click any file or folder > **Share**
2. Enter the recipient's email or copy a link
3. Choose: Can edit / Can view / Can't download
4. Set an expiry date if sharing with external parties

### Important: Company files go in SharePoint
- OneDrive = your personal files
- SharePoint (accessible via Teams Files tab) = shared team files
- Never store documents that others need to access in your OneDrive alone

### Recovery
- Deleted files stay in the Recycle Bin for 30 days
- Previous versions of files are kept automatically — right-click > **Version history**`,
    createdBy: 'GoLive Admin',
    pinned: false,
  },
  {
    title: 'GoLive Commission Policy — Quick Reference for Sales Reps',
    slug: 'commission-policy-quick-reference',
    category: 'GoLive Internal',
    tags: ['commission', 'policy', 'sales', 'internal'],
    body: `## Commission Policy — Quick Reference

This is a plain-English summary of the Commission & Bonus Addendum (REF#01010). Always refer to the full addendum for legal terms.

### Four key statuses
| Status | Meaning |
|---|---|
| **Tracked** | Sale logged in CRM under your name |
| **Conditionally Accrued** | Building up — not yet paid |
| **Earned** | All 6 conditions met — money is yours |
| **Payable** | Due in next payroll cycle |

### 6 conditions before a commission is earned
1. You pass probation and are confirmed in writing
2. Customer has paid in full
3. Product/service has been activated or delivered
4. Refund/cancellation window has passed
5. Deal is logged and approved in the CRM
6. Customer was not a pre-existing GoLive account

### Probation rates (Days 1–90)
| Category | Rate |
|---|---|
| New M365 licence/subscription | 5% of Gross Profit |
| Setup/onboarding/migration | 10% of Gross Profit |
| Support retainer (new) | 5% of first month GP |
| Renewal | No commission unless MD approves in writing |

### Confirmed rates (Day 91+)
| Category | Rate |
|---|---|
| New M365 licence/subscription | 10% of GP on first paid invoice |
| Monthly subscription | 10% month 1; 3% months 2–12 |
| Annual subscription (upfront) | 10% of first annual invoice GP |
| Setup/migration/onboarding | 10–15% GP (confirmed per project) |
| Upsell/cross-sell | 7.5% GP on incremental value |
| Renewal (actively managed) | 3% GP |

### Monthly bonus thresholds
| GP generated | Bonus |
|---|---|
| ₦250,000 | ₦25,000 |
| ₦500,000 | ₦60,000 |
| ₦1,000,000 | ₦150,000 |
*Only the highest threshold pays — not cumulative.*

### Gross Profit = customer invoice amount minus GoLive's distributor cost. Never on gross revenue.`,
    createdBy: 'GoLive Admin',
    pinned: true,
  },
]

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const count = await KnowledgeArticle.countDocuments()
    if (count === 0) {
      await KnowledgeArticle.insertMany(SEED_ARTICLES)
    }
    const articles = await KnowledgeArticle.find().sort({ pinned: -1, createdAt: -1 })
    return NextResponse.json(articles)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth
  try {
    await connectDB()
    const body = await req.json()
    const { title, category, body: content, tags, createdBy, pinned } = body
    if (!title || !category || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()
    const article = await KnowledgeArticle.create({
      title, slug, category, body: content,
      tags: tags || [], createdBy: createdBy || 'GoLive Admin', pinned: pinned || false,
    })
    return NextResponse.json(article, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
