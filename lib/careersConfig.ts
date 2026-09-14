/**
 * careersConfig.ts — single source of truth for the public /careers page.
 * Add, close, or edit roles here; the page renders from this list.
 * Salary figures are monthly gross NGN.
 */

export interface CareerRole {
  slug: string
  title: string
  department: string
  type: string
  location: string
  salaryLower: number
  salaryUpper: number
  commission?: boolean
  open: boolean
  summary: string
  responsibilities: string[]
  requirements: string[]
}

export const CAREERS: CareerRole[] = [
  {
    slug: 'full-stack-engineer',
    title: 'Full Stack Engineer',
    department: 'Technical & IT Operations',
    type: 'Full-time',
    location: 'Lagos \u00b7 Hybrid',
    salaryLower: 1500000,
    salaryUpper: 2500000,
    open: true,
    summary:
      'Build and own product across the GoLive stack: our cloud marketplace portal, hosting automation, legal tech SaaS, and Microsoft 365 integrations. You will ship end to end, from database schema to production deploy, working directly with the MD/CEO.',
    responsibilities: [
      'Design, build, and maintain features across our Next.js and Laravel applications, from API to interface',
      'Own deployments end to end: GitHub Actions CI/CD, Linux server administration (Nginx, PM2), and Cloudflare',
      'Integrate third-party platforms: Microsoft Graph and Partner Center, payment gateways, WHMCS, and email infrastructure',
      'Model and manage data in MongoDB and MySQL, with attention to performance and data protection (NDPA 2023)',
      'Harden security across the estate: authentication, 2FA, token design, rate limiting, and secure file handling',
      'Contribute to architecture decisions and mentor future engineering hires as the team grows',
    ],
    requirements: [
      'Strong command of TypeScript and JavaScript, with production experience in React and Next.js (App Router)',
      'Server-side proficiency in Node.js and PHP, including Laravel; working knowledge of Python for tooling and automation',
      'Solid SQL and NoSQL experience: MongoDB and MySQL in production',
      'HTML, CSS, and Tailwind CSS to a high standard of interface craft',
      'REST API design and consumption; experience with Microsoft 365 or payment APIs is a strong advantage',
      'Comfort with Linux servers, Nginx, PM2, Git, and CI/CD pipelines; Cloudflare and Puppeteer experience is a plus',
      'Four or more years of professional software engineering experience, with at least one product you can demonstrate end to end',
    ],
  },
  {
    slug: 'operations-coordinator',
    title: 'Operations Coordinator',
    department: 'Management & Administration',
    type: 'Full-time',
    location: 'Lagos \u00b7 Hybrid',
    salaryLower: 200000,
    salaryUpper: 280000,
    open: true,
    summary:
      'The operational right hand of the MD/CEO: vendors, renewals, records, meetings, logistics, and correspondence across all three arms of the company.',
    responsibilities: [
      'Maintain the company filing system, vendor register, and contract renewal tracker',
      'Prepare meeting agendas and accurate, neutral minutes; manage correspondence and logistics',
      'Collate invoices and prepare vendor spend reports for management review',
      'Run a weekly operations report covering pending decisions, renewals, and spend',
    ],
    requirements: [
      'Excellent written English and rigorous attention to detail',
      'Strong Microsoft 365 skills: Outlook, Word, Excel, OneDrive, and Teams',
      'Sound judgement on authority boundaries; disciplined escalation habits',
      'Experience coordinating operations or administration in a fast-moving environment',
    ],
  },
  {
    slug: 'social-media-community-manager',
    title: 'Social Media & Community Manager',
    department: 'Marketing & Content Management',
    type: 'Full-time',
    location: 'Lagos \u00b7 Hybrid',
    salaryLower: 150000,
    salaryUpper: 250000,
    open: true,
    summary:
      'Own the GoLive voice online: content strategy, creation, publishing, and community engagement that turns attention into hosting and Microsoft 365 customers.',
    responsibilities: [
      'Plan and run a monthly content calendar across Instagram, X, LinkedIn, and Facebook',
      'Create graphics and short-form video that make Nigerian SMEs stop scrolling',
      'Manage community engagement, direct messages, and public customer responses',
      'Report monthly on leads generated, engagement, and growth',
    ],
    requirements: [
      'A portfolio of accounts you have grown, with numbers you can defend',
      'Strong copywriting in the register Nigerian business audiences actually speak',
      'Design tooling proficiency (Canva or Adobe) and short-form video editing',
      'Calm, professional crisis handling in public threads',
    ],
  },
  {
    slug: 'hosting-support-technician',
    title: 'Hosting Support Technician',
    department: 'Technical & IT Operations',
    type: 'Full-time',
    location: 'Lagos \u00b7 Hybrid',
    salaryLower: 180000,
    salaryUpper: 280000,
    open: true,
    summary:
      'Front-line technical support for our hosting and domain customers: diagnose, fix, and communicate, from DNS and SSL to WordPress and email deliverability.',
    responsibilities: [
      'Resolve customer tickets across cPanel/WHM, DNS, SSL, WordPress, and email',
      'Diagnose deliverability issues: SPF, DKIM, DMARC, and blacklist remediation',
      'Coordinate scheduled maintenance and communicate clearly with affected customers',
      'Document fixes in the knowledge base so problems are solved once',
    ],
    requirements: [
      'Hands-on cPanel/WHM and Linux troubleshooting experience',
      'Working knowledge of DNS, SSL/TLS, and email authentication records',
      'WordPress diagnostic skills: logs first, elimination second, restore last',
      'The ability to explain technical problems to non-technical clients with patience and clarity',
    ],
  },
  {
    slug: 'sales-support-associate',
    title: 'Sales & Support Associate',
    department: 'Sales & Customer Relations',
    type: 'Full-time',
    location: 'Lagos \u00b7 Hybrid',
    salaryLower: 120000,
    salaryUpper: 180000,
    commission: true,
    open: true,
    summary:
      'Sell and support GoLive services to Nigerian SMEs: Microsoft 365, hosting, and managed IT. Base salary plus a performance-based commission and bonus structure.',
    responsibilities: [
      'Prospect, qualify, and close SME customers for Microsoft 365 and hosting services',
      'Manage renewals and support existing customers; retention is revenue',
      'Maintain accurate pipeline records and weekly activity reports',
      'Represent GoLive with professionalism in every call, message, and meeting',
    ],
    requirements: [
      'Consultative selling instincts: discovery before pitching',
      'Resilience, self-management, and disciplined follow-up (WhatsApp fluency expected)',
      'Clear written and spoken English; comfort with CRM-style record keeping',
      'B2B sales experience in technology, telecoms, or services preferred',
    ],
  },
]

export const CAREERS_CONTACT = 'talent.acquisition@golivecompany.com'
export const fmtNairaRange = (a: number, b: number) =>
  '\u20a6' + a.toLocaleString('en-NG') + ' \u2013 \u20a6' + b.toLocaleString('en-NG')
