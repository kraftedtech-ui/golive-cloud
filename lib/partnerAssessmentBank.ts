/**
 * partnerAssessmentBank.ts: GoLive Partner Network question banks. SERVER ONLY.
 *
 * Same shape as lib/assessmentBank RoleBank, so lib/assessmentPaper issues,
 * presents and marks these papers exactly as it does for recruitment. Never
 * import this from a client component: it carries the answers.
 *
 * integrity  Module 1, anti-bribery. 10 drawn from 12. Pass mark 100%. It is a
 *            compliance record, not a test, so a failed paper may be retaken
 *            straight away, and wrong answers are explained afterwards.
 * final      Modules 2 to 4. 20 drawn from 30. Pass mark 80%. Two attempts,
 *            the second no sooner than seven days after the first.
 */

import type { BankQuestion, RoleBank } from '@/lib/assessmentBank'

type Q = Omit<BankQuestion, 'id'>
const withIds = (prefix: string, qs: Q[]): BankQuestion[] => qs.map((q, i) => ({ ...q, id: `${prefix}-${String(i + 1).padStart(2, '0')}` }))

const M1 = 'Module 1: Anti-bribery and business integrity'
const M2 = 'Module 2: Authority and representation'
const M3 = 'Module 3: The GoLive portfolio'
const M4 = 'Module 4: Deal process and data handling'

const INTEGRITY: Q[] = [
  { sec: M1, type: 'mcq', text: 'A client\u2019s head of IT suggests that if you pass him 20% of your commission, the order will come to GoLive. What is this?',
    opts: ['A normal referral arrangement, provided it is agreed in writing', 'A bribe, and it must be declined and reported', 'Acceptable if the payment comes from your own commission rather than from GoLive', 'Acceptable if the amount is below \u20a6100,000'],
    correct: 1, explain: 'Passing any part of your commission to someone at the client to win the order is a bribe, whatever it is called and whoever pays it.' },
  { sec: M1, type: 'tf', text: 'A payment only counts as a bribe if it succeeds in winning the business.',
    correct: 'False', explain: 'Offering, promising or requesting is enough. The payment does not need to be made or to succeed.' },
  { sec: M1, type: 'mcq', text: 'An official asks for \u20a65,000 to release a document you are legally entitled to. What should you do?',
    opts: ['Pay it, because small facilitation payments are allowed', 'Pay it and claim it back as an expense', 'Decline and report it to GoLive', 'Ask a colleague to pay it instead'],
    correct: 2, explain: 'GoLive prohibits facilitation payments in every amount and every circumstance.' },
  { sec: M1, type: 'mcq', text: 'A tender that includes a GoLive proposal is currently open. When may you send the client\u2019s procurement lead a gift hamper?',
    opts: ['If it costs less than a set amount', 'If it is sent from your personal account', 'Not while the tender is open', 'If you tell the procurement lead it is a personal gesture'],
    correct: 2, explain: 'Nothing may be offered to anyone involved while a tender, quotation or renewal involving them is open.' },
  { sec: M1, type: 'tf', text: 'You may offer hospitality to an employee of a government-owned organisation without asking GoLive first, provided it is modest.',
    correct: 'False', explain: 'Anything for a public official, or an employee of a government-owned organisation, needs GoLive\u2019s written approval in advance.' },
  { sec: M1, type: 'mcq', text: 'Why can a partner\u2019s improper payment create liability for GoLive and its vendors?',
    opts: ['Because anti-bribery laws can treat an intermediary\u2019s conduct as the company\u2019s', 'It cannot; the partner alone is responsible', 'Only if GoLive knew about it in advance', 'Only if the payment was made in Nigeria'],
    correct: 0, explain: 'Laws such as the UK Bribery Act and US FCPA reach conduct by intermediaries anywhere, and GoLive\u2019s agreements pass these standards on to partners.' },
  { sec: M1, type: 'mcq', text: 'Which of these is a red flag?',
    opts: ['A client asks for a written quotation', 'A contact insists that payment goes through a particular third party', 'A client asks for references from other customers', 'A client wants a demonstration before deciding'],
    correct: 1, explain: 'Insistence on a particular intermediary or payee is a classic sign of a disguised bribe.' },
  { sec: M1, type: 'mcq', text: 'You are unsure whether a lunch for a client team is acceptable. What is the right step?',
    opts: ['Go ahead and mention it afterwards', 'Pay for it yourself so it does not involve GoLive', 'Ask partners@golivecompany.com before offering it', 'Invite only the junior staff'],
    correct: 2, explain: 'Asking first is always the right step and is never held against you.' },
  { sec: M1, type: 'tf', text: 'Offering a job to a decision-maker\u2019s relative in return for an order is a form of bribery.',
    correct: 'True', explain: 'A bribe is anything of value, including a job or contract for the person or a relative.' },
  { sec: M1, type: 'mcq', text: 'You report a suspected bribe in good faith and it turns out to be innocent. What happens to you?',
    opts: ['You lose commission on the account', 'Nothing adverse; good-faith reports are never penalised', 'Your appointment is reviewed', 'You must pay the investigation costs'],
    correct: 1, explain: 'Reporting in good faith is protected, even when the concern proves unfounded.' },
  { sec: M1, type: 'mcq', text: 'Which Nigerian law makes bribery a criminal offence?',
    opts: ['The Nigeria Data Protection Act 2023', 'The Corrupt Practices and Other Related Offences Act 2000', 'The Companies and Allied Matters Act 2020', 'The Cybercrimes Act 2015'],
    correct: 1, explain: 'The Corrupt Practices and Other Related Offences Act 2000 is enforced by the ICPC; the EFCC also acts on corruption.' },
  { sec: M1, type: 'mcq', text: 'What follows if a partner offers a bribe to win an account?',
    opts: ['A written warning', 'A reduced commission rate for a year', 'Termination, forfeiture of unpaid commission on the account, certificate revocation, and possible report to the authorities', 'Nothing, if the account is later lost'],
    correct: 2, explain: 'Bribery ends the appointment immediately and may be reported to the authorities.' },
]

const FINAL: Q[] = [
  // Module 2
  { sec: M2, type: 'mcq', text: 'Who does the client contract with when buying a GoLive solution you introduced?',
    opts: ['You, as the partner', 'GoLive', 'Microsoft directly', 'Whoever the client prefers'], correct: 1,
    explain: 'Every sale is made by GoLive, on GoLive paper, and invoiced by GoLive.' },
  { sec: M2, type: 'tf', text: 'A Sales Partner may agree a 10% discount if it closes the deal the same day.', correct: 'False',
    explain: 'Partners may never agree a price or discount.' },
  { sec: M2, type: 'mcq', text: 'A client asks you for the final price for 50 users. What do you do?',
    opts: ['Estimate it from the list price and commit to it', 'Say GoLive will issue a formal quotation, and pass on the requirement', 'Ask the client what they would like to pay', 'Quote a price and let GoLive adjust it later'], correct: 1,
    explain: 'GoLive issues every quotation. You may share list prices, clearly described as such, but never a final figure.' },
  { sec: M2, type: 'mcq', text: 'How may a certified partner describe themselves?',
    opts: ['Microsoft Certified Partner', 'GoLive Accredited Sales Partner', 'GoLive Account Manager', 'Authorised Microsoft Reseller'], correct: 1,
    explain: 'Partners use GoLive wording only; no vendor certification or partnership may be implied.' },
  { sec: M2, type: 'tf', text: 'A partner may put the Microsoft logo on their business card if they sell Microsoft 365 through GoLive.', correct: 'False',
    explain: 'Vendor marks require the vendor\u2019s written permission, which partners do not hold.' },
  { sec: M2, type: 'mcq', text: 'A client wants a firm go-live date before signing. What may you say?',
    opts: ['Promise the date they want', 'Promise a date two weeks after theirs', 'That GoLive will confirm the timetable in its proposal', 'That dates are guaranteed by the vendor'], correct: 2,
    explain: 'Partners may not promise delivery dates or service levels.' },
  { sec: M2, type: 'mcq', text: 'Why are vendor costs and GoLive margins never shared with partners?',
    opts: ['They are confidential under GoLive\u2019s distribution agreements', 'They change daily', 'Partners might find them confusing', 'They are published elsewhere'], correct: 0,
    explain: 'Pricing and terms are confidential under the distribution agreements; partners see a published commission schedule instead.' },
  { sec: M2, type: 'tf', text: 'A partner may accept a deposit from the client to secure the order, then pass it to GoLive.', correct: 'False',
    explain: 'Partners never accept payment from the client for anything.' },
  { sec: M2, type: 'mcq', text: 'You receive a GoLive proposal for a client. Who may you forward it to?',
    opts: ['Anyone who might be interested', 'The client\u2019s decision-makers for that opportunity only', 'Other clients, as an example', 'Other partners, to help them sell'], correct: 1,
    explain: 'GoLive material is confidential and for the named opportunity only.' },
  { sec: M2, type: 'mcq', text: 'Why may partners not act as sub-resellers of GoLive\u2019s cloud products?',
    opts: ['Because GoLive\u2019s reseller agreements require it to sell in its own name and do not allow sub-resellers', 'Because partners lack bank accounts', 'Because it would be slower', 'There is no restriction'], correct: 0,
    explain: 'This is the governing rule of the programme, drawn from GoLive\u2019s reseller agreements.' },
  // Module 3
  { sec: M3, type: 'mcq', text: 'A client says their main system failing would stop them trading for a week. Which solution addresses this most directly?',
    opts: ['Website services', 'Managed IT, backup and business continuity', 'Custom software development', 'Domain registration'], correct: 1,
    explain: 'Backup and continuity planning address the risk of a prolonged outage.' },
  { sec: M3, type: 'mcq', text: 'A distributor runs accounting and stock on spreadsheets and takes three weeks to close each month. Which solution fits best?',
    opts: ['Odoo implementation', 'Web hosting', 'The Digital Archive', 'Microsoft 365 alone'], correct: 0,
    explain: 'Business applications replace disconnected spreadsheets for accounting and stock.' },
  { sec: M3, type: 'tf', text: 'The strongest introductions start with the product\u2019s features, then look for a problem it solves.', correct: 'False',
    explain: 'Start with the problem the client already feels, then show which solution addresses it.' },
  { sec: M3, type: 'mcq', text: 'Which question best qualifies a Microsoft 365 opportunity?',
    opts: ['Do you like Microsoft?', 'How many staff need email and Office applications, and what do they use today?', 'What is your favourite software?', 'Have you heard of the cloud?'], correct: 1,
    explain: 'User numbers and current tools shape the requirement.' },
  { sec: M3, type: 'mcq', text: 'An organisation wants to preserve decades of reports and photographs and let the public see some of them. What fits?',
    opts: ['Managed IT', 'The Digital Archive', 'Odoo', 'Domain registration'], correct: 1,
    explain: 'The Digital Archive covers capture, cataloguing, controlled access and a public archive.' },
  { sec: M3, type: 'mcq', text: 'Which of these is NOT one of the five business problems buyers pay to solve?',
    opts: ['Cost', 'Risk', 'Brand colours', 'Business continuity'], correct: 2,
    explain: 'The five are cost, operational efficiency, productivity, risk and business continuity.' },
  { sec: M3, type: 'mcq', text: 'Which is a sign that an opportunity is qualified?',
    opts: ['The contact is friendly', 'There is a named problem the client agrees is worth solving this year, with a decision-maker and budget identified', 'The client has a large office', 'The client uses social media'], correct: 1,
    explain: 'Problem, decision-maker, budget and timing are the core qualification questions.' },
  { sec: M3, type: 'tf', text: 'GoLive supplies Microsoft 365 as a Microsoft Cloud Solution Provider, including migration and administration.', correct: 'True',
    explain: 'That is GoLive\u2019s Microsoft 365 offer.' },
  { sec: M3, type: 'mcq', text: 'Staff at a firm share passwords and nobody removes accounts when people leave. Which problem is this, and what fits?',
    opts: ['Cost; web hosting', 'Risk; Microsoft 365 with multi-factor sign-in and managed administration', 'Productivity; a new website', 'Continuity; domain registration'], correct: 1,
    explain: 'Unmanaged accounts are a security risk that Microsoft 365 administration and MFA address.' },
  { sec: M3, type: 'mcq', text: 'Off-the-shelf software does not fit how a client works. What may GoLive offer?',
    opts: ['Nothing', 'Custom software development', 'A cheaper licence', 'A domain name'], correct: 1,
    explain: 'Bespoke applications, portals and integrations cover requirements packaged software does not.' },
  // Module 4
  { sec: M4, type: 'mcq', text: 'When should you register a prospect?',
    opts: ['After the client agrees to buy', 'Before you approach it', 'After GoLive sends the quotation', 'Only for large deals'], correct: 1,
    explain: 'No registration, no commission. Register before approaching.' },
  { sec: M4, type: 'mcq', text: 'How long does a valid registration hold a prospect?',
    opts: ['30 days', '90 days, extended by recorded activity', 'One year', 'Until the client buys'], correct: 1,
    explain: 'The first valid registration holds for 90 days, extended by recorded activity.' },
  { sec: M4, type: 'tf', text: 'You can register an organisation that is already in a GoLive employee\u2019s pipeline if you know the client better.', correct: 'False',
    explain: 'Existing customers and employees\u2019 pipeline prospects are not available for registration.' },
  { sec: M4, type: 'mcq', text: 'When does commission accrue?',
    opts: ['When the quotation is sent', 'When the client signs', 'When the client\u2019s payment clears', 'When the invoice is raised'], correct: 2,
    explain: 'Commission is earned on cash received and paid within 30 days, less withholding tax.' },
  { sec: M4, type: 'mcq', text: 'A client cancels and is refunded 60 days after paying. What happens to your commission?',
    opts: ['You keep it', 'It is recoverable by GoLive', 'It doubles', 'It is converted to a future discount for the client'], correct: 1,
    explain: 'Commission is recoverable on cancellation, refund or default within 90 days of payment.' },
  { sec: M4, type: 'mcq', text: 'A client says they might need 80 licences but are sure of only 50. What do you tell GoLive?',
    opts: ['80, to earn more commission', '50, with a note that it may grow', '100, to be safe', 'Nothing until they decide'], correct: 1,
    explain: 'Annual seats cannot be reduced after the cancellation window. Never overstate users; seat inflation is a clawback and termination event.' },
  { sec: M4, type: 'tf', text: 'A partner may accept the Microsoft Customer Agreement on the client\u2019s behalf to speed things up.', correct: 'False',
    explain: 'The client must accept the end user agreement themselves.' },
  { sec: M4, type: 'mcq', text: 'Where may you keep a client\u2019s staff list shared for an opportunity?',
    opts: ['In your personal email', 'In a WhatsApp group', 'Only within GoLive\u2019s channels, collecting no more than needed', 'On a USB stick'], correct: 2,
    explain: 'Under the NDPA, share client data only through GoLive\u2019s channels and never on personal devices or accounts.' },
  { sec: M4, type: 'mcq', text: 'You email a client\u2019s staff list to the wrong person. What do you do?',
    opts: ['Nothing, if the recipient seems trustworthy', 'Ask the recipient to delete it and say no more', 'Tell GoLive immediately', 'Wait to see if anyone complains'], correct: 2,
    explain: 'Breaches have strict reporting deadlines; tell GoLive at once.' },
  { sec: M4, type: 'mcq', text: 'You suspect a prospect is linked to a sanctioned individual. What should you do?',
    opts: ['Carry on; it is GoLive\u2019s problem', 'Raise it with GoLive before the conversation goes further', 'Ask the prospect to use another company name', 'Offer a discount to close quickly'], correct: 1,
    explain: 'Export controls and sanctions apply to technology products; raise any doubt first.' },
]

export const INTEGRITY_BANK: RoleBank = { minutes: 15, draw: 10, version: 'ptr-integrity-v1', questions: withIds('PI', INTEGRITY) }
export const FINAL_BANK: RoleBank = { minutes: 35, draw: 20, version: 'ptr-final-v1', questions: withIds('PF', FINAL) }

export const bankFor = (kind: 'integrity' | 'final') => (kind === 'integrity' ? INTEGRITY_BANK : FINAL_BANK)
