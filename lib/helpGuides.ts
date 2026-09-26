/**
 * helpGuides.ts: the portal Help area. CLIENT-SAFE.
 *
 * Each officer sees only their own role's SOP and the how-to guides for their
 * role (the Administrator sees all). Screenshots live in public/help and are
 * regenerated with scripts/help-screenshots (see its README) when screens change.
 *
 * Source: "GoLive Cloud: Standard Operating Procedures and Staffing Plan".
 * Keep the two in step: change the SOP document first, then this file.
 */

export type HelpRole = 'admin' | 'operations' | 'sales' | 'support' | 'viewer'

export type HelpStep = { title: string; body: string; image?: string; caption?: string }
export type HelpGuide = { id: string; section: string; title: string; summary: string; roles: HelpRole[] | 'all'; steps: HelpStep[] }
export type HelpSop = { role: HelpRole; title: string; purpose: string; daily: string[]; weekly: string[]; monthly: string[]; never: string[] }

export const HELP_SECTIONS = ['Getting started', 'Sales', 'Customers and delivery', 'Partner Network', 'Support', 'Administration'] as const

const ALL: HelpRole[] | 'all' = 'all'
const SALES: HelpRole[] = ['sales', 'operations', 'admin']
const OPS: HelpRole[] = ['operations', 'admin']
const DELIVERY: HelpRole[] = ['operations', 'support', 'admin']
const SUPPORT: HelpRole[] = ['support', 'admin']
const ADMIN: HelpRole[] = ['admin']

export const HELP_GUIDES: HelpGuide[] = [
  {
    id: 'sign-in', section: 'Getting started', roles: ALL,
    title: 'Sign in and set up two-step verification',
    summary: 'Your first sign-in, and how to keep your account safe.',
    steps: [
      { title: 'Open the portal', body: 'Go to cloud.golivecompany.com/portal on your computer. Bookmark it; always type the address yourself rather than clicking links in emails.' },
      { title: 'Enter your details', body: 'Enter your company email address (1) and the password you were given (2), then press Continue (3). You will be asked to choose a new password on first sign-in.', image: '/help/signin.jpg' },
      { title: 'Set up two-step verification', body: 'Install Microsoft Authenticator or Google Authenticator on your work phone. When the portal shows a QR code, scan it with the app and type the six-digit code it shows. From then on, every sign-in asks for a fresh code.' },
      { title: 'Stay safe', body: 'Never share your password or code. Sign out on any shared computer. If you lose your phone or think someone else has used your account, tell the Administrator the same day.' },
    ],
  },
  {
    id: 'tour', section: 'Getting started', roles: ALL,
    title: 'Find your way around the portal',
    summary: 'The menu, the search bar, notifications and your own view.',
    steps: [
      { title: 'The menu on the left', body: 'The menu shows only the screens your role uses, grouped under headings such as Sales, Tools, Team and Partner Network. If you expect a screen and cannot see it, ask the Administrator; do not borrow another officer\u2019s login.', image: '/help/tour.jpg' },
      { title: 'Search', body: 'The search bar at the top (1) finds customers, leads and reference numbers. Type part of a company name or a reference such as GL-LEAD-2026-0041.' },
      { title: 'Notifications and New lead', body: 'The bell (2) shows notifications meant for you. The New lead button (3) records a new enquiry from any screen.' },
      { title: 'What each role sees', body: 'Sales officers see Sales and Tools. Operations also sees the Partner Network. Support sees Transfer requests, Deployment workflow, Customer accounts and the Knowledge base. The pictures below show the Operations and Support menus.', image: '/help/menu-operations.jpg', caption: 'Operations menu' },
      { title: '', body: '', image: '/help/menu-support.jpg', caption: 'Support menu' },
    ],
  },
  {
    id: 'team-updates', section: 'Getting started', roles: ALL,
    title: 'Read announcements and use the Knowledge base',
    summary: 'Where company notices and approved answers live.',
    steps: [
      { title: 'Announcements', body: 'Open Announcements (under Team) at the start of each day. Price changes, service notices and new procedures are posted here. Only the Administrator and authorised officers post.', image: '/help/announcements.jpg' },
      { title: 'Knowledge base', body: 'Open Knowledge base to find approved answers, fixes and procedures. Use the search box (2) before asking a colleague. If you solve a problem twice, write it up with New Article (1) so it is solved once.', image: '/help/knowledge.jpg' },
    ],
  },
  {
    id: 'new-lead', section: 'Sales', roles: SALES,
    title: 'Record a new enquiry as a lead',
    summary: 'Every enquiry goes into the portal within one hour.',
    steps: [
      { title: 'Press New lead', body: 'From any screen, press New lead at the top right. The Add New Lead form opens.', image: '/help/new-lead.jpg' },
      { title: 'Fill in the details', body: 'Enter the company name (1), contact person, email, WhatsApp number, country, industry, number of users and current email provider. In Notes, say where the enquiry came from (WhatsApp, Instagram, website, referral, partner) and what they asked for.' },
      { title: 'Save', body: 'Press Save Lead (2). The lead appears in the CRM pipeline under New Lead with its own reference number.' },
      { title: 'Social media enquiries', body: 'If you are the Social Media & Community Manager: log every buying enquiry this way the same day, then tell the Sales & Support Associate. Do not quote prices beyond those on the website.' },
      { title: 'Partner check', body: 'Before working a new organisation, confirm with the Operations Coordinator that it is not registered to a partner. A partner\u2019s approved registration takes precedence.' },
    ],
  },
  {
    id: 'pipeline', section: 'Sales', roles: SALES,
    title: 'Move a lead through the pipeline',
    summary: 'Keep every lead in the right stage, with a next step and a date.',
    steps: [
      { title: 'Open CRM pipeline', body: 'Open CRM pipeline under Sales. Leads sit in five stages: New Lead (1), Assessment Done (2), Quote Sent (3), Negotiating (4) and Won (5).', image: '/help/pipeline.jpg' },
      { title: 'Update the stage', body: 'When a lead moves on, update its stage on the card. Assessment Done after the discovery questionnaire; Quote Sent after you send the proposal; Negotiating while terms are discussed; Won when the customer has agreed.' },
      { title: 'Lost leads', body: 'A lead that will not proceed is marked Lost with the reason in the notes. Do not leave dead leads open.' },
      { title: 'Every Friday', body: 'Review every lead with no activity in seven days: call, message, or close it as Lost with a reason.' },
    ],
  },
  {
    id: 'discovery', section: 'Sales', roles: SALES,
    title: 'Run the discovery questionnaire',
    summary: 'Understand the customer\u2019s needs before you price anything.',
    steps: [
      { title: 'Open the questionnaire', body: 'Open Discovery questionnaire under Tools, and choose the lead from the list (1).', image: '/help/discovery.jpg' },
      { title: 'Ask, do not pitch', body: 'Go through the questions with the customer: number of users, current email platform, devices, security concerns, budget and who makes the decision. Record their answers in their own words.' },
      { title: 'Save', body: 'Save the assessment. It appears under Saved Assessments and is used by the proposal generator. Move the lead to Assessment Done.' },
    ],
  },
  {
    id: 'proposal', section: 'Sales', roles: SALES,
    title: 'Prepare a proposal',
    summary: 'Price from the catalogue, never from memory.',
    steps: [
      { title: 'Open the Proposal generator', body: 'Open Proposal generator under Tools. Choose the lead (1), the package (2) and the billing plan (3). Annual commitment is the lowest cost; monthly allows the count to change.', image: '/help/proposals.jpg' },
      { title: 'Users, currency and setup fee', body: 'Enter the number of users and the currency. The setup fee is suggested from the discovery questionnaire; change it only with the Administrator\u2019s approval.' },
      { title: 'Extras and discount', body: 'Add add-ons or extra licences only from the catalogue. A discount outside the catalogue needs the Administrator\u2019s written approval before the proposal is sent. Tick Charge VAT only when instructed.' },
      { title: 'Save and send', body: 'Check the preview on the right, then press Save & download PDF at the bottom. Send the PDF to the customer and move the lead to Quote Sent. Follow up within 48 hours.' },
      { title: 'When the customer agrees', body: 'Tell the Administrator, who records the acceptance so the invoice number is issued. Then move the lead to Won and inform the Operations Coordinator.' },
    ],
  },
  {
    id: 'payment-risk', section: 'Sales', roles: SALES,
    title: 'Follow up payments and renewals',
    summary: 'Keep customers paid up before the suspension date.',
    steps: [
      { title: 'Open Payment risk', body: 'Open Payment risk under Administration. It lists monthly customers who have not paid for the current month, and annual renewals in the next 30 days.', image: '/help/payment-risk.jpg' },
      { title: 'Call and record', body: 'Call or message each customer on the list and note the outcome. When payment is confirmed, press Mark paid (1). Only confirmed payments are marked.' },
      { title: 'Suspension', body: 'Never suspend a customer yourself. Escalate to the Administrator with the reminders you sent.' },
    ],
  },
  {
    id: 'commissions', section: 'Sales', roles: ['sales', 'admin'],
    title: 'Check your commission',
    summary: 'For commission-eligible sales officers only.',
    steps: [
      { title: 'Open Commissions', body: 'Open Commissions under Sales. Read the Do\u2019s & Don\u2019ts tab (1) first; it is part of your signed terms.', image: '/help/commissions.jpg' },
      { title: 'Plan and track', body: 'Use the Forecast Calculator (2) to see what a deal would earn, and the Commission Tracker (3) to follow each deal from tracked to paid.' },
      { title: 'Queries', body: 'Raise any discrepancy with the Administrator within five working days of month end.' },
    ],
  },
  {
    id: 'customer-onboarding', section: 'Customers and delivery', roles: OPS,
    title: 'Onboard a newly won customer',
    summary: 'No licence is provisioned until the customer agreement is signed.',
    steps: [
      { title: 'Open Customer accounts', body: 'Open Customer accounts under Administration. Find the new customer and check the record is complete: tenant, package, users, billing and country.', image: '/help/customers.jpg' },
      { title: 'Customer agreement', body: 'The Agreement column (1) shows Pending, Sent or Signed. Send the customer agreement and follow it up until it reads Signed. Nothing is provisioned before then.' },
      { title: 'Hand over to delivery', body: 'Once signed, open the deployment record (next guide) and assign the technician or engineer.' },
    ],
  },
  {
    id: 'deployment', section: 'Customers and delivery', roles: DELIVERY,
    title: 'Plan and update a deployment',
    summary: 'Every setup and migration is tracked in the Deployment workflow.',
    steps: [
      { title: 'Choose the customer', body: 'Open Deployment workflow under Tools and pick the customer (1).', image: '/help/deployment.jpg' },
      { title: 'Plan', body: 'Record the migration type (existing Microsoft 365, other platform, or new), who controls the DNS, the cut-over tolerance and the MFA approach. Status: Planning.' },
      { title: 'Work and update', body: 'Move the status to In progress when work starts, Live when the customer is working on the new service, and Closed after hand-over. Add a note at each step.' },
      { title: 'Rule', body: 'Do not start work for a customer whose agreement is not Signed in Customer accounts.' },
    ],
  },
  {
    id: 'transfers', section: 'Customers and delivery', roles: DELIVERY,
    title: 'Work a transfer request',
    summary: 'Requests from the website\u2019s migration form.',
    steps: [
      { title: 'Open Transfer requests', body: 'Open Transfer requests under Sales. Each row is a customer asking to move their email or licences to GoLive.', image: '/help/transfers.jpg' },
      { title: 'Update the status', body: 'Use the Status list (1) to show where the request stands, and record progress on the customer\u2019s deployment record.' },
    ],
  },
  {
    id: 'partner-application', section: 'Partner Network', roles: OPS,
    title: 'Review a partner application',
    summary: 'Check, recommend and move early stages. Decisions stay with the Administrator.',
    steps: [
      { title: 'Open the application', body: 'Open Partner applications under Partner Network and click the applicant\u2019s row.', image: '/help/partner-application.jpg' },
      { title: 'Check the details', body: 'Check the applicant, background and named accounts. A red flag on a named account means it matches an existing customer, a lead, or another partner.' },
      { title: 'Recommend and move', body: 'Write your recommendation in the note, and use Accreditation stage (1) to move the applicant up to Training where appropriate. Moving to Training emails their personal training link.' },
      { title: 'What stays with the Administrator', body: 'Registering or refusing named accounts, declining an applicant, sending the agreement and countersigning are Administrator actions; those buttons are not shown to Operations.' },
    ],
  },
  {
    id: 'deal-registration', section: 'Partner Network', roles: OPS,
    title: 'Check a deal registration and record a milestone',
    summary: 'Milestones extend a partner\u2019s registration. Record only what GoLive witnessed.',
    steps: [
      { title: 'Open the registration', body: 'Open Deal registrations under Partner Network and click the organisation.', image: '/help/deal-registration.jpg' },
      { title: 'Record a milestone', body: 'Under Record a milestone GoLive confirms (1), choose what happened: a meeting GoLive attended, a GoLive quotation, or the prospect\u2019s written confirmation to GoLive. Enter the date and a short note of the evidence, then press Record.' },
      { title: 'Never', body: 'Never record a milestone GoLive did not attend, issue or receive. Approval, refusal, extension and closing are Administrator actions.' },
    ],
  },
  {
    id: 'knowledge-article', section: 'Support', roles: SUPPORT,
    title: 'Write a Knowledge base article',
    summary: 'Solve each problem once.',
    steps: [
      { title: 'New article', body: 'Open Knowledge base and press New Article (1). Search first (2) to be sure it has not been written.', image: '/help/knowledge.jpg' },
      { title: 'Write it plainly', body: 'Title it as the customer would describe the problem, for example "Emails going to spam after domain change". Write the cause, the fix step by step, and how to confirm it worked. Add tags such as hosting, dns, email.' },
      { title: 'Publish', body: 'Press Publish. Update the article whenever the fix changes.' },
    ],
  },
  {
    id: 'customer-lookup', section: 'Support', roles: SUPPORT,
    title: 'Look up a customer account',
    summary: 'Read-only view of what the customer has.',
    steps: [
      { title: 'Search or browse', body: 'Use the search bar or open Customer accounts to see the customer\u2019s package, users, domain and agreement status. Support can read these records but not change them.', image: '/help/customers.jpg' },
      { title: 'Hosting tickets', body: 'Hosting and domain tickets are handled in the WHMCS support desk at app.golivenaija.com, not in this portal. Record any setup or migration work on the customer\u2019s deployment record.' },
    ],
  },
  {
    id: 'team', section: 'Administration', roles: ADMIN,
    title: 'Add a team member and choose their role',
    summary: 'Least access: give each officer only the role their job needs.',
    steps: [
      { title: 'Add the member', body: 'Open Team and access and press Add Team Member (1). Enter their name and company email and choose the role.', image: '/help/team.jpg' },
      { title: 'Which role', body: 'Sales & Support Associate: Sales. Social Media & Community Manager: Sales, not commission-eligible. Operations Coordinator: Operations. Hosting Support Technician: Support. Never give Admin for convenience.' },
      { title: 'Changing a role', body: 'Press Edit (2), choose the new role and save. The officer must sign out and back in for the change to apply.' },
      { title: 'Leavers', body: 'Deactivate the account on the officer\u2019s last working day.' },
    ],
  },
]

export const HELP_SOPS: HelpSop[] = [
  {
    role: 'sales', title: 'Sales & Support Associate',
    purpose: 'To win new customers for Microsoft 365, hosting and managed IT, and to keep existing customers paying and renewing.',
    daily: [
      'Check your pipeline on Home; attend first to follow-ups due today or earlier.',
      'Record every new enquiry in the CRM pipeline within one hour of first contact.',
      'Contact every new Cloud assessment and Transfer request the same working day.',
      'Qualify with the Discovery questionnaire before you pitch.',
      'Prepare quotes only in the Proposal generator; follow up every quote within 48 hours.',
      'When a customer agrees, tell the Administrator to record acceptance, move the lead to Won and inform the Operations Coordinator.',
    ],
    weekly: [
      'Friday: review every lead with no activity in 7 days.',
      'Call every monthly customer on Payment risk before the suspension date.',
      'Contact renewals due in the next 30 days.',
      'Send your weekly activity report to the Administrator.',
    ],
    monthly: [
      'Check your Commissions figures; raise discrepancies within five working days.',
      'Read Announcements for price or product changes and quote from the current catalogue.',
    ],
    never: [
      'Promise a price, discount, delivery date or service level not approved in writing.',
      'Accept payment into any account other than GoLive\u2019s official bank account.',
      'Provision, cancel or change a customer\u2019s licences yourself.',
      'Share distributor price lists or GoLive\u2019s margins outside the company.',
    ],
  },
  {
    role: 'operations', title: 'Operations Coordinator',
    purpose: 'To keep the business in order: customer onboarding, vendors and renewals, records, the partner network and the weekly operations report.',
    daily: [
      'Read partners@ and operations@; acknowledge every message within one working day.',
      'For every lead moved to Won, complete the customer record and take the customer agreement to Signed.',
      'Open the Deployment workflow record and assign the technician or engineer.',
      'Check Payment risk and send reminders to overdue customers.',
      'Review new partner applications and deal registrations; write your recommendation for the Administrator.',
      'Record deal milestones only when GoLive attended, quoted or received written confirmation.',
    ],
    weekly: [
      'Friday: send the weekly operations report: pending decisions, unsigned agreements, late deployments, overdue payments, renewals.',
      'Remind partners and the Sales Associate of registrations lapsing within 14 days.',
      'Update the vendor register and renewal tracker.',
    ],
    monthly: [
      'By the 5th, remind the Administrator to import the new 4Sight price list.',
      'Prepare the vendor spend report.',
      'List partner commission falling due next month for the Administrator.',
      'Prepare agendas and neutral minutes of management meetings.',
    ],
    never: [
      'Sign, countersign or accept any agreement, offer or proposal for the company.',
      'Approve, refuse or extend a deal registration, or record a milestone GoLive did not witness.',
      'Publish or edit the commission schedule, or mark commission as paid.',
      'Share one partner\u2019s information with another partner.',
    ],
  },
  {
    role: 'support', title: 'Hosting Support Technician',
    purpose: 'To keep GoLive Naija\u2019s hosting, domain and email customers working, set up new accounts correctly, and write down every fix.',
    daily: [
      'Work the WHMCS ticket queue by priority, then age: first response within two working hours; urgent within 30 minutes.',
      'Diagnose before changing anything: logs first, eliminate causes, restore last. Back up before every change.',
      'Update the Deployment workflow records assigned to you.',
      'Work Transfer requests assigned to you.',
      'Provision only after the WHMCS invoice is paid and the customer agreement is Signed.',
    ],
    weekly: [
      'Review SSL certificates and domains expiring in 30 days.',
      'Check the mail server\u2019s reputation and blacklist status.',
      'Add or update at least one Knowledge base article.',
    ],
    monthly: [
      'Write an incident report within two working days of any outage.',
    ],
    never: [
      'Share customer passwords, or ask for them over WhatsApp or ordinary email.',
      'Delete customer data without a verified backup and written instruction.',
      'Change a customer\u2019s plan, price or billing without an invoice or approval.',
      'Install nulled or pirated plugins or themes.',
    ],
  },
  {
    role: 'admin', title: 'Administrator',
    purpose: 'To hold the authority other roles do not: approvals, signatures, prices, access, commission, and the integrity of the record.',
    daily: [
      'Clear the approvals queue: proposals, discount requests, partner applications and deal registrations.',
      'Record proposal acceptance only on the customer\u2019s written confirmation.',
      'Countersign offers and partner agreements.',
      'Decide deal registrations; record a reason for any conflict override.',
    ],
    weekly: [
      'Decide every item in the Operations Coordinator\u2019s weekly report.',
      'Review Payment risk; no suspension without a documented reminder.',
      'Review the pipeline and renewals with the Sales Associate.',
    ],
    monthly: [
      'By the 5th: import the 4Sight price list; review and publish or discard the commission draft.',
      'Pay due partner commission; Mark paid with the bank reference; remit withholding tax.',
      'Claw back commission where a client cancelled, was refunded or defaulted within 90 days.',
      'Review Team and access: every account current, least role.',
    ],
    never: [
      'Approve your own expense or commission.',
      'Give the Admin role for convenience.',
      'Delete a record after commission has been paid.',
    ],
  },
  {
    role: 'viewer', title: 'Viewer',
    purpose: 'Read-only access to the portal, for officers whose work is mainly outside it.',
    daily: ['Read Announcements.', 'Use the Knowledge base.'], weekly: [], monthly: [],
    never: ['Share what you read in the portal outside the company.'],
  },
]

/** The Social Media & Community Manager holds the sales role without commission; shown to sales users as a second SOP. */
export const SOCIAL_SOP: HelpSop = {
  role: 'sales', title: 'Social Media & Community Manager',
  purpose: 'To grow GoLive\u2019s audience and turn attention into recorded leads. Success is measured in leads in the portal, not likes.',
  daily: [
    'Answer messages and comments within four working hours, using approved replies from the Knowledge base.',
    'Log every buying enquiry as a lead the same day (source: the platform), then tell the Sales & Support Associate.',
    'Publish the day\u2019s approved content.',
  ],
  weekly: ['Send next week\u2019s posts to the Administrator for approval by Thursday.', 'Publish new products, price changes and service notices from Announcements.'],
  monthly: ['Prepare the content calendar.', 'Report followers, reach, engagement, enquiries, leads logged and leads won.'],
  never: [
    'Post a price or promotion not on the website or approved in writing.',
    'Use Microsoft, Odoo or any vendor logo without written approval.',
    'Post a customer\u2019s name, logo or story without written consent.',
    'Argue publicly or share a customer\u2019s personal details.',
  ],
}

export function guidesFor(role: string): HelpGuide[] {
  if (role === 'admin') return HELP_GUIDES
  return HELP_GUIDES.filter((g) => g.roles === 'all' || (g.roles as string[]).includes(role))
}

export function sopsFor(role: string): HelpSop[] {
  if (role === 'admin') return [...HELP_SOPS.filter((s) => s.role !== 'viewer'), SOCIAL_SOP]
  const own = HELP_SOPS.filter((s) => s.role === role)
  return role === 'sales' ? [...own, SOCIAL_SOP] : own
}
