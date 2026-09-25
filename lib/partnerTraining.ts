/**
 * partnerTraining.ts: the four GoLive Partner Network training modules.
 *
 * Client-safe: this is reading material, shown to the partner in full. The
 * questions that test it live in lib/partnerAssessmentBank.ts, which is
 * server only and never sent with its answers.
 *
 * Module 1 is the anti-bribery record GoLive's distribution agreements ask
 * for (OB-18): each partner's completion is time-stamped and kept. Commission
 * rates are deliberately absent until they are confirmed and published.
 */

export type TrainingSection = { heading: string; paragraphs?: string[]; points?: string[] }
export type TrainingModule = {
  no: number
  title: string
  minutes: number
  summary: string
  sections: TrainingSection[]
  /** What the partner confirms when marking the module complete. */
  confirm: string
}

/** Which modules each category must complete. Both categories take all four until decided otherwise. */
export const REQUIRED_MODULES: Record<'referral' | 'sales', number[]> = {
  referral: [1, 2, 3, 4],
  sales: [1, 2, 3, 4],
}

export const ASSESSMENT_RULES = {
  integrity: { title: 'Integrity check', passPct: 100, minutes: 15, questions: 10 },
  final: { title: 'Partner assessment', passPct: 80, minutes: 35, questions: 20, retakeAfterDays: 7, standardAttempts: 2 },
} as const

export const INTEGRITY_DISCLOSURE = {
  recorded: [
    'How many times you switch to another tab or window',
    'How many times this page loses focus',
    'Attempts to paste into, or copy from, the assessment',
    'When you start and submit, and the time taken',
  ],
  notRecorded: [
    'No camera or video',
    'No microphone or audio',
    'No screen recording',
    'No record of your keystrokes or other browsing',
  ],
}

export const MODULES: TrainingModule[] = [
  {
    no: 1,
    title: 'Anti-bribery and business integrity',
    minutes: 15,
    summary: 'What counts as a bribe, why a partner\u2019s conduct becomes GoLive\u2019s conduct, gifts and hospitality, and how to report a concern.',
    sections: [
      {
        heading: 'Why this module comes first',
        paragraphs: [
          'When you introduce a GoLive solution, you act on GoLive\u2019s behalf. In law and in the eyes of our vendors, what an intermediary does to win business can be treated as if the company did it. A single improper payment by a partner can end GoLive\u2019s distribution agreements, expose the vendors whose products we sell, and lead to criminal liability for the people involved.',
          'This is why every partner completes this module before appointment, why it requires a perfect score, and why your completion is recorded and kept.',
        ],
      },
      {
        heading: 'What a bribe is',
        paragraphs: [
          'A bribe is anything of value offered, promised, given, requested or accepted to influence someone to act improperly, or to reward them for having done so. It does not need to be cash, and it does not need to succeed.',
        ],
        points: [
          'Cash, transfers, airtime, vouchers or cryptocurrency.',
          'Gifts, travel, hospitality or entertainment beyond what is modest and proportionate.',
          'A job, internship or contract for the person or a relative.',
          'Donations or sponsorships requested by a decision-maker.',
          'A share of your commission passed to anyone at the client. This is always a bribe, however it is described.',
        ],
      },
      {
        heading: 'The laws that apply',
        paragraphs: [
          'In Nigeria, bribery is a criminal offence under the Corrupt Practices and Other Related Offences Act 2000, enforced by the ICPC and the EFCC. The vendors and distributors whose products GoLive sells are also bound by laws such as the UK Bribery Act 2010 and the US Foreign Corrupt Practices Act, which reach conduct by intermediaries anywhere in the world. Their contracts with GoLive require these standards to be passed on to everyone who sells for us, including you.',
        ],
      },
      {
        heading: 'Facilitation payments',
        paragraphs: [
          'A facilitation payment is a small unofficial payment to speed up a routine action, such as releasing a document or approving a visit. GoLive prohibits them in every amount and every circumstance. If one is requested, decline and report it.',
        ],
      },
      {
        heading: 'Gifts and hospitality',
        points: [
          'Anything you offer must be modest, occasional, openly given and never linked to a decision that is pending.',
          'Nothing may be offered to anyone while a tender, quotation or renewal involving them is open.',
          'Nothing may be offered to a public official, or to an employee of a government-owned organisation, without GoLive\u2019s written approval in advance.',
          'If you are unsure, ask partners@golivecompany.com before offering anything. Asking first is never held against you.',
        ],
      },
      {
        heading: 'Red flags',
        points: [
          'A contact asks for a \u201cconsultancy fee\u201d, a share of your commission, or payment to a third party.',
          'A contact insists on using a particular intermediary, or on payment in cash.',
          'Pricing or specifications are shaped to favour one supplier in return for a benefit.',
          'A request to keep a benefit off the record or out of writing.',
        ],
      },
      {
        heading: 'Reporting a concern',
        paragraphs: [
          'Report any request, offer or suspicion to the Managing Director or to partners@golivecompany.com straight away. You will not be penalised for reporting in good faith, even if the concern turns out to be unfounded.',
          'Offering or accepting a bribe, or failing to report one you are part of, leads to immediate termination of your appointment, forfeiture of unpaid commission on the affected account, revocation of your certificate, and may be reported to the authorities.',
        ],
      },
    ],
    confirm: 'I have read and understood this module, and I will comply with GoLive\u2019s anti-bribery and business integrity requirements.',
  },
  {
    no: 2,
    title: 'Authority and representation',
    minutes: 10,
    summary: 'What a partner may and may not do or say, how to describe yourself, and how pricing questions are handled.',
    sections: [
      {
        heading: 'The governing rule',
        paragraphs: [
          'Every sale is made by GoLive, on GoLive\u2019s paper, and invoiced by GoLive. You never contract with the client, never invoice the client, and never buy licences on the client\u2019s behalf. This is required by GoLive\u2019s own reseller agreements, which do not allow sub-resellers.',
        ],
      },
      {
        heading: 'What a partner may never do',
        points: [
          'Sign any document on behalf of GoLive or the client.',
          'Quote a price, agree a discount, or promise that a price will be held.',
          'Promise a delivery date, a go-live date or a service level.',
          'Represent, or appear to represent, Microsoft or any other vendor or distributor.',
          'Describe yourself as a GoLive employee, or use a GoLive email address or letterhead.',
          'Accept payment from the client for anything.',
        ],
      },
      {
        heading: 'How to describe yourself',
        paragraphs: [
          'Once certified, you may describe yourself as a \u201cGoLive Accredited Sales Partner\u201d or \u201cGoLive Accredited Referral Partner\u201d, as your appointment states. You may not describe yourself as certified, accredited or partnered by Microsoft or any other vendor, and you may not use any vendor logo. Vendor marks may only be used with the vendor\u2019s written permission, which partners do not hold.',
        ],
      },
      {
        heading: 'When a client asks \u201chow much?\u201d',
        paragraphs: [
          'Explain that GoLive will prepare a formal quotation, register the opportunity if you have not already, and pass on the client\u2019s requirement. You may share published list prices from the GoLive price list you are given, clearly described as list prices, but never a discount or a final figure.',
          'Vendor costs and GoLive\u2019s margins are confidential under GoLive\u2019s distribution agreements. You will not be given them, and you must not speculate about them to a client.',
        ],
      },
      {
        heading: 'Confidentiality',
        points: [
          'Price lists, proposals and anything GoLive shares with you are confidential and for the named opportunity only.',
          'Never forward GoLive material to anyone outside the client\u2019s decision-makers for that opportunity.',
        ],
      },
    ],
    confirm: 'I understand that I hold no authority to sign, price, discount or commit on behalf of GoLive or any vendor.',
  },
  {
    no: 3,
    title: 'The GoLive portfolio',
    minutes: 15,
    summary: 'What GoLive delivers, the business problems each solution addresses, and the questions that qualify an opportunity.',
    sections: [
      {
        heading: 'Start with the problem, not the product',
        paragraphs: [
          'Decision-makers buy solutions to five problems: cost, operational efficiency, productivity, risk, and business continuity. The strongest introductions name the problem the client already feels, then show which GoLive solution addresses it.',
        ],
      },
      {
        heading: 'Microsoft 365 licensing, security and productivity',
        paragraphs: [
          'GoLive is a Microsoft Cloud Solution Provider and supplies Microsoft 365 subscriptions with migration, security configuration and ongoing administration. Addresses productivity, collaboration, and the risk of unmanaged accounts and email.',
        ],
        points: [
          'How many staff need email and Office applications, and what do they use today?',
          'Is sign-in protected with multi-factor authentication?',
          'Who administers accounts when someone joins or leaves?',
        ],
      },
      {
        heading: 'Odoo implementation, licensing and support',
        paragraphs: [
          'Business applications for accounting, inventory, sales, purchasing, HR and more, implemented and supported by GoLive. Addresses efficiency and cost where a business runs on spreadsheets or disconnected systems.',
        ],
        points: [
          'Which processes run on spreadsheets or paper today?',
          'How long does month-end close take, and how reliable is stock information?',
        ],
      },
      {
        heading: 'Custom software development and SaaS',
        paragraphs: [
          'Bespoke web and mobile applications, portals and integrations, plus GoLive\u2019s own software products. Addresses efficiency where off-the-shelf software does not fit how the organisation works.',
        ],
      },
      {
        heading: 'Web hosting, domains and websites',
        paragraphs: [
          'Hosting, domain registration and website services through GoLive Naija and GoLive Forge. Addresses reputation and reliability online.',
        ],
      },
      {
        heading: 'Managed IT, backup and business continuity',
        paragraphs: [
          'Support contracts, device and network management, backup and recovery planning. Addresses risk and continuity. A good question: \u201cIf your main system failed tomorrow, how long before you could trade again?\u201d',
        ],
      },
      {
        heading: 'Digital Archive and document management',
        paragraphs: [
          'Capture, cataloguing, secure storage and controlled access for records, publications and photographs, including a public archive where an organisation wants its history seen. Addresses risk, compliance and the cost of physical storage.',
        ],
      },
      {
        heading: 'Qualifying an opportunity',
        points: [
          'Is there a named problem, and does the client agree it is worth solving this year?',
          'Who decides, who pays, and who else must agree?',
          'Is there a budget, or a way to create one?',
          'What is the timing, and what is driving it?',
        ],
      },
    ],
    confirm: 'I understand the GoLive portfolio and how to qualify an opportunity before introducing it.',
  },
  {
    no: 4,
    title: 'Deal process and data handling',
    minutes: 15,
    summary: 'Deal registration, how a sale is made and paid, subscription commitments, the end user agreement, and handling client data.',
    sections: [
      {
        heading: 'Deal registration',
        points: [
          'Register a prospect in the GoLive portal before you approach it. No registration means no commission, whatever is claimed afterwards.',
          'The first valid registration holds that prospect for 90 days, extended by recorded activity.',
          'Existing GoLive customers, and prospects already in a GoLive employee\u2019s pipeline, are not available for registration. Check before you approach.',
        ],
      },
      {
        heading: 'How a sale is made',
        points: [
          'GoLive prepares the quotation from the client\u2019s requirement and sends it to the client.',
          'The client contracts with GoLive and pays GoLive.',
          'Commission is earned on cash received: it accrues when the client\u2019s payment clears, and is paid within 30 days, less withholding tax deducted at source.',
          'Commission is recoverable if the client cancels, refunds or defaults within 90 days of paying.',
        ],
      },
      {
        heading: 'Subscription commitments',
        paragraphs: [
          'Most cloud subscriptions are bought on annual commitments. Seats can be added at any time, but once the short cancellation window after purchase has passed, seats cannot be reduced until the term ends, and GoLive owes the vendor for every seat for the full year.',
          'Never overstate the number of users to increase the size of a deal. Seat inflation is treated as a clawback event and grounds for termination.',
        ],
      },
      {
        heading: 'The end user agreement',
        paragraphs: [
          'Every client buying cloud subscriptions must accept the vendor\u2019s end user agreement themselves. For Microsoft this is the Microsoft Customer Agreement. A partner may never accept it for the client, sign it, or suggest changing it.',
        ],
      },
      {
        heading: 'Client data and the Nigeria Data Protection Act 2023',
        points: [
          'Collect only the client information needed for the opportunity, and share it only through GoLive\u2019s channels.',
          'Do not keep client personal data in personal email, on personal devices, or in messaging groups.',
          'If client data is lost, sent to the wrong person or exposed, tell GoLive immediately. Controllers have strict deadlines to report breaches to the Nigeria Data Protection Commission, so hours matter.',
        ],
      },
      {
        heading: 'Restricted parties and countries',
        paragraphs: [
          'Technology products are subject to export controls and sanctions. Do not pursue opportunities with organisations or individuals you believe may be sanctioned, or for use in sanctioned countries. If in doubt, raise it with GoLive before any conversation goes further.',
        ],
      },
    ],
    confirm: 'I understand how deals are registered, made and paid, and my obligations when handling client data.',
  },
]
