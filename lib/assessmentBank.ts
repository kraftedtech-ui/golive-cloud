/**
 * assessmentBank.ts: the candidate assessment question banks, SERVER ONLY.
 *
 * Moved out of the public assessment pages, where every question shipped with
 * its correct answer and explanation in the page source, and the score was
 * calculated in the candidate's browser. Neither is true any more:
 *
 * - Nothing in this file is ever sent to a browser with its answer. The paper
 *   route strips 'correct' and 'explain' before responding.
 * - Scoring happens in save-recording, against this file.
 *
 * Do not import this module from any client component or public script.
 *
 * Per-role settings:
 *   minutes  time allowed, enforced on the server from when the paper is issued
 *   draw     how many MARKED questions each candidate receives, drawn at random
 *            from the bank; null means all of them. Written questions are
 *            always included. Raise the bank size, then set draw, to give each
 *            candidate a different paper.
 *   version  recorded on every application, so results from different banks
 *            are never compared as if they were the same test.
 */

export type BankQuestion = {
  id: string
  sec: string
  type: 'mcq' | 'tf' | 'text'
  text: string
  opts?: string[]
  correct?: number | 'True' | 'False'
  explain?: string
  /** Written questions: the instruction shown beneath the question. */
  sub?: string
  /** Written questions: the example text shown in the empty answer box. */
  placeholder?: string
}

export type RoleBank = {
  minutes: number
  draw: number | null
  version: string
  questions: BankQuestion[]
}

const QUESTIONS: Record<string, BankQuestion[]> = {
  "Operations Coordinator": [
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "In the contract renewal tracker, column D holds renewal dates. Which feature makes renewals due within 30 days stand out automatically?",
      "opts": [
        "Sorting the sheet once a month",
        "Typing 'urgent' next to each row by hand",
        "Freezing the top row",
        "Conditional formatting with a formula comparing the date to TODAY()+30"
      ],
      "correct": 3,
      "explain": "Conditional formatting updates itself every day, so nothing depends on remembering to check.",
      "id": "o2q01"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "You need the total spend with one vendor, 'Apex Supplies', from a table of invoices with vendor names in column B and amounts in column C. Which formula works?",
      "opts": [
        "=SUM(C:C)",
        "=SUMIFS(C:C, B:B, \"Apex Supplies\")",
        "=COUNTIF(B:B, \"Apex Supplies\")",
        "=AVERAGE(C:C)"
      ],
      "correct": 1,
      "explain": "SUMIFS adds amounts that meet a condition. COUNTIF counts rows rather than adding amounts.",
      "id": "o2q02"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "A formula copied down a column should always refer to the VAT rate in cell F1. How should F1 be written in the formula?",
      "opts": [
        "F1",
        "F$1$",
        "$F$1",
        "#F1"
      ],
      "correct": 2,
      "explain": "The dollar signs make an absolute reference, so the formula keeps pointing at F1 when copied.",
      "id": "o2q03"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "Which Excel feature best summarises monthly spend by vendor and category from a long invoice list?",
      "opts": [
        "A PivotTable",
        "Find and replace",
        "Spell check",
        "Page layout view"
      ],
      "correct": 0,
      "explain": "PivotTables summarise large lists by any combination of fields in seconds.",
      "id": "o2q04"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "Someone overwrote the vendor register saved in OneDrive yesterday. What is the quickest fix?",
      "opts": [
        "Recreate it from memory",
        "Ask IT to restore the whole server",
        "Nothing can be done",
        "Restore the previous version from the file's version history"
      ],
      "correct": 3,
      "explain": "OneDrive and SharePoint keep version history, so an earlier version can be restored in moments.",
      "id": "o2q05"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "You need to share a confidential contract with an external lawyer through OneDrive. Which sharing option is appropriate?",
      "opts": [
        "Share with specific people, entering the lawyer's email, so only they can open it",
        "'Anyone with the link', so it is easy to open",
        "Attach it to a WhatsApp message",
        "Make the folder public"
      ],
      "correct": 0,
      "explain": "Specific-people links need the recipient to verify, so a forwarded link cannot be opened by others.",
      "id": "o2q06"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "The MD wants emails from a key client flagged and moved to a folder automatically. What do you set up in Outlook?",
      "opts": [
        "A calendar reminder",
        "An inbox rule based on the sender's address",
        "A distribution list",
        "An out-of-office reply"
      ],
      "correct": 1,
      "explain": "Rules sort mail automatically on conditions such as sender or subject.",
      "id": "o2q07"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "The team needs one shared address, operations@, that several people can read and reply from. What is the right setup in Microsoft 365?",
      "opts": [
        "Everyone shares one person's password",
        "A personal mailbox forwarded to all",
        "Separate accounts with auto-forwarding",
        "A shared mailbox, with access granted to each team member"
      ],
      "correct": 3,
      "explain": "Shared mailboxes give common access with each person using their own login, which keeps an audit trail.",
      "id": "o2q08"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "You need to find a meeting time for five busy people in Outlook. Which tool helps most?",
      "opts": [
        "The Scheduling Assistant, which shows attendees' free and busy times side by side",
        "Emailing each person separately",
        "Booking any time and hoping",
        "A Teams chat poll only"
      ],
      "correct": 0,
      "explain": "The Scheduling Assistant avoids back-and-forth by showing availability directly.",
      "id": "o2q09"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "tf",
      "text": "A formula using a relative reference such as F1 will keep pointing at F1 when copied down a column.",
      "correct": "False",
      "explain": "Relative references shift as they are copied. Use $F$1 to fix the reference.",
      "id": "o2q10"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "tf",
      "text": "Two people can edit the same Word document in OneDrive at the same time.",
      "correct": "True",
      "explain": "Co-authoring lets several people work in a document at once, with changes saved automatically.",
      "id": "o2q11"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "mcq",
      "text": "Which file name follows good practice for a vendor contract?",
      "opts": [
        "contract final FINAL new.pdf",
        "Apex.pdf",
        "scan0023.pdf",
        "2026-10-01_ApexSupplies_ServiceAgreement_v2.pdf"
      ],
      "correct": 3,
      "explain": "A date-first, consistent name sorts correctly and shows the content and version at a glance.",
      "id": "o2q12"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "mcq",
      "text": "Three versions of a policy document exist in different folders and nobody knows which is current. What prevents this in future?",
      "opts": [
        "One agreed location, a version number in the file name or properties, and superseded versions archived rather than left beside the current one",
        "Keeping all versions in everyone's email",
        "Printing the latest version",
        "Deleting all but the newest-looking file"
      ],
      "correct": 0,
      "explain": "Document control means a single source of truth with clear versions.",
      "id": "o2q13"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "mcq",
      "text": "A vendor contract auto-renews unless cancelled 60 days before its end date of 31 December. By when must notice be given to avoid renewal?",
      "opts": [
        "By 31 December",
        "By 1 December",
        "By 31 January the following year",
        "By 1 November"
      ],
      "correct": 3,
      "explain": "Sixty days before 31 December is 1 November. The tracker should flag it well before, allowing time for a decision.",
      "id": "o2q14"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "mcq",
      "text": "What should a vendor register record, at minimum?",
      "opts": [
        "Only the vendor's phone number",
        "Only unpaid invoices",
        "Vendor name, contact, service provided, contract start and end dates, notice period, cost, and the owner inside GoLive",
        "The vendor's personal social media accounts"
      ],
      "correct": 2,
      "explain": "The register exists so renewals, costs and responsibilities are never a surprise.",
      "id": "o2q15"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "mcq",
      "text": "A signed contract arrives by email. What is the correct handling?",
      "opts": [
        "Leave it in your inbox",
        "Save it to the agreed contracts folder with a standard name, update the vendor register and renewal tracker, and confirm receipt",
        "Print it and file the paper only",
        "Forward it to all staff"
      ],
      "correct": 1,
      "explain": "Filing, registering and tracking together ensure the contract can be found and its dates are acted on.",
      "id": "o2q16"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "tf",
      "text": "Keeping the only copy of important records in your personal email is acceptable if you are organised.",
      "correct": "False",
      "explain": "Records must be in company systems so they survive absences and departures and can be found by others.",
      "id": "o2q17"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "tf",
      "text": "A renewal tracker should flag contracts early enough to allow a decision before the notice deadline, not just before the end date.",
      "correct": "True",
      "explain": "The notice deadline is the real deadline. Missing it can lock the company into another term.",
      "id": "o2q18"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "mcq",
      "text": "What should good meeting minutes record?",
      "opts": [
        "Everything everyone said, word for word",
        "Decisions made, actions agreed with an owner and a due date, and key points, stated neutrally",
        "Only the chair's opinions",
        "Personal remarks and jokes"
      ],
      "correct": 1,
      "explain": "Minutes exist to capture decisions and accountability, not a transcript.",
      "id": "o2q19"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "mcq",
      "text": "In a meeting, a manager says something unflattering about a colleague who is absent. How should it appear in the minutes?",
      "opts": [
        "Record it exactly",
        "Record it with the manager's name in bold",
        "It should not appear unless it relates to a decision, and then only in neutral, factual terms",
        "Send it to the colleague"
      ],
      "correct": 2,
      "explain": "Minutes are neutral records. Personal remarks do not belong in them.",
      "id": "o2q20"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "mcq",
      "text": "When should minutes be circulated?",
      "opts": [
        "Just before the next meeting",
        "Only if someone asks",
        "At the end of the quarter",
        "Promptly, ideally within one working day, while memories are fresh, with actions highlighted"
      ],
      "correct": 3,
      "explain": "Prompt minutes mean actions start straight away and errors are corrected early.",
      "id": "o2q21"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "mcq",
      "text": "A meeting is set for 3pm in Lagos in October with a board member in New York. What time is it for them?",
      "opts": [
        "10am, since Lagos is five hours ahead of New York while the United States observes daylight saving time",
        "9am",
        "8pm",
        "3pm"
      ],
      "correct": 0,
      "explain": "Lagos is UTC+1 all year. New York is UTC-4 during daylight saving time (March to November) and UTC-5 in winter, so the gap is five hours in October and six in January.",
      "id": "o2q22"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "mcq",
      "text": "A vendor emails the MD directly with a complaint that is really an operations matter. What is best?",
      "opts": [
        "Acknowledge the vendor, handle it within your remit, keep the MD informed with a short summary, and escalate only what needs the MD's decision",
        "Forward every vendor email to the MD without comment",
        "Ignore it because it was not sent to you",
        "Reply to the vendor promising a refund"
      ],
      "correct": 0,
      "explain": "Handling what you can, and escalating decisions with context, saves the MD time.",
      "id": "o2q23"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "mcq",
      "text": "Which subject line is best for an email asking the MD to approve a vendor renewal?",
      "opts": [
        "'Hello'",
        "'Quick question'",
        "'Approval needed by Friday: Apex Supplies renewal, N1.2m per year'",
        "'URGENT!!! PLEASE READ'"
      ],
      "correct": 2,
      "explain": "A good subject line says what is needed, by when, and the key detail.",
      "id": "o2q24"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "tf",
      "text": "An agenda sent before a meeting, with the decisions needed, helps meetings end on time.",
      "correct": "True",
      "explain": "Attendees come prepared and the discussion stays on the decisions required.",
      "id": "o2q25"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "tf",
      "text": "When drafting a reply for the MD's signature, it is fine to send it yourself without their approval if it seems routine.",
      "correct": "False",
      "explain": "Anything issued in the MD's name needs the MD's approval. Send in your own name only what is within your remit.",
      "id": "o2q26"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "mcq",
      "text": "A vendor invoice for N200,000 excludes VAT. What is the total including VAT at 7.5%?",
      "opts": [
        "N200,000",
        "N207,500",
        "N215,000",
        "N230,000"
      ],
      "correct": 2,
      "explain": "200,000 multiplied by 1.075 is 215,000.",
      "id": "o2q27"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "mcq",
      "text": "Before an invoice is passed for payment, what should be checked?",
      "opts": [
        "Only that the vendor's logo is on it",
        "Only the total",
        "Nothing; vendors are trusted",
        "That it matches the purchase order or agreement and the goods or services actually received, and that it is not a duplicate"
      ],
      "correct": 3,
      "explain": "Matching invoice, order and delivery, and checking for duplicates, prevents overpayment and fraud.",
      "id": "o2q28"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "mcq",
      "text": "An email from a regular vendor says their bank details have changed and asks that future payments go to a new account. What do you do?",
      "opts": [
        "Update the details and pay",
        "Reply to the email to confirm",
        "Pay half to each account",
        "Treat it as a possible fraud; verify by phoning the vendor on a number already on file, not one in the email, before any change"
      ],
      "correct": 3,
      "explain": "Payment redirection is the most common invoice fraud. Independent verification is the control.",
      "id": "o2q29"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "mcq",
      "text": "Two invoices from the same vendor show the same amount, date and description but different invoice numbers. What is the right action?",
      "opts": [
        "Pay both; the numbers differ",
        "Pay the first one received",
        "Delete one",
        "Hold both, query the vendor, and pay only after confirming whether one is a duplicate"
      ],
      "correct": 3,
      "explain": "Duplicates often come with new numbers. Confirm before paying.",
      "id": "o2q30"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "mcq",
      "text": "What makes a vendor spend report useful to management?",
      "opts": [
        "Spend by vendor and category against budget, with the change on last month and any unusual items explained",
        "A list of every invoice with no summary",
        "Only the total",
        "Vendor contact details"
      ],
      "correct": 0,
      "explain": "Management needs the picture and the exceptions, not raw data.",
      "id": "o2q31"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "mcq",
      "text": "What is the purpose of a weekly operations report?",
      "opts": [
        "To record every email sent",
        "To replace meetings entirely",
        "To show pending decisions, upcoming renewals and spend at a glance, so nothing important waits unnoticed",
        "To report colleagues' attendance"
      ],
      "correct": 2,
      "explain": "It surfaces what needs attention before it becomes urgent.",
      "id": "o2q32"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "tf",
      "text": "Paying an invoice without matching it to a purchase order or agreement is acceptable if the vendor is well known.",
      "correct": "False",
      "explain": "Familiarity is how fraud and errors slip through. Every invoice is checked.",
      "id": "o2q33"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "tf",
      "text": "Withholding tax may need to be deducted from certain vendor payments, so the accountant's guidance should be followed.",
      "correct": "True",
      "explain": "Withholding tax applies to specified payments in Nigeria. The coordinator follows the accountant's rules rather than guessing.",
      "id": "o2q34"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "mcq",
      "text": "A vendor needs a contract signed today to keep a discount, and the MD is unreachable on a flight. What do you do?",
      "opts": [
        "Do not sign; tell the vendor it is awaiting the MD, ask whether the deadline can move, and message the MD with the details",
        "Sign it yourself to save the discount",
        "Ask a colleague to sign it",
        "Ignore the vendor until the MD lands"
      ],
      "correct": 0,
      "explain": "Only authorised signatories bind the company. A missed discount costs less than an unauthorised commitment.",
      "id": "o2q35"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "mcq",
      "text": "The MD asks you to book travel but the booking exceeds the budget they set. What do you do?",
      "opts": [
        "Present the options and the cost difference and ask the MD to decide before booking",
        "Book it anyway",
        "Book a cheaper option without saying anything",
        "Cancel the trip"
      ],
      "correct": 0,
      "explain": "When a request conflicts with a constraint, surface the trade-off and let the decision-maker choose.",
      "id": "o2q36"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "mcq",
      "text": "You notice a colleague has not logged three vendor calls in the tracker. What is the right approach?",
      "opts": [
        "Report them to the MD immediately",
        "Fix it quietly every time",
        "Ignore it",
        "Mention it to them directly and helpfully first; escalate only if it continues and affects the work"
      ],
      "correct": 3,
      "explain": "Direct, respectful feedback solves most issues. Escalate patterns, not single slips.",
      "id": "o2q37"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "mcq",
      "text": "Three urgent tasks land at once: a contract renewal deadline today, the MD's travel for next week, and filing from last month. What order?",
      "opts": [
        "The filing first, as it is overdue",
        "The renewal deadline first, then the travel, then the filing",
        "The travel first, as it is for the MD",
        "All three at once"
      ],
      "correct": 1,
      "explain": "Order by consequence and deadline. A missed renewal notice can lock in a year of cost.",
      "id": "o2q38"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "mcq",
      "text": "You make an error in the spend report already sent to the MD. What do you do?",
      "opts": [
        "Hope nobody notices",
        "Wait until next month's report",
        "Blame the source data without checking",
        "Send a correction promptly, saying what changed and why"
      ],
      "correct": 3,
      "explain": "Prompt, transparent correction protects decisions made on the report and your credibility.",
      "id": "o2q39"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "tf",
      "text": "An operations coordinator may approve payments on the MD's behalf when the amount is small.",
      "correct": "False",
      "explain": "Payment approval rests with the authorised person regardless of amount. The coordinator prepares and checks; the MD approves.",
      "id": "o2q40"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "tf",
      "text": "Escalating early with the facts and options is better than escalating late with only the problem.",
      "correct": "True",
      "explain": "Early escalation keeps choices open; offering options respects the decision-maker's time.",
      "id": "o2q41"
    },
    {
      "sec": "Section F: Confidentiality and data protection",
      "type": "mcq",
      "text": "A colleague asks you what another colleague earns, since you process payroll documents. What do you say?",
      "opts": [
        "Tell them; everyone talks about pay",
        "Give a rough figure",
        "Show them the document",
        "Decline; salary information is confidential and not shared"
      ],
      "correct": 3,
      "explain": "Compensation is confidential. Access through your role does not permit disclosure.",
      "id": "o2q42"
    },
    {
      "sec": "Section F: Confidentiality and data protection",
      "type": "mcq",
      "text": "Under the Nigeria Data Protection Act 2023, how should personal data in the files you manage be treated?",
      "opts": [
        "Kept forever in case it is useful",
        "Shared freely inside the company",
        "Collected for a clear purpose, kept secure, accessed only by those who need it, and kept no longer than necessary",
        "Stored wherever is convenient"
      ],
      "correct": 2,
      "explain": "These principles apply to the staff, vendor and customer data an operations coordinator handles daily.",
      "id": "o2q43"
    },
    {
      "sec": "Section F: Confidentiality and data protection",
      "type": "mcq",
      "text": "You receive an email that looks like it is from the MD, asking you to buy gift cards urgently and send the codes. What do you do?",
      "opts": [
        "Buy them quickly; the MD asked",
        "Reply asking how many",
        "Do not act; verify with the MD through a separate known channel, since this is a common impersonation scam",
        "Buy them and ask for a refund later"
      ],
      "correct": 2,
      "explain": "Urgent gift card requests from 'the boss' are a classic fraud. Always verify independently.",
      "id": "o2q44"
    },
    {
      "sec": "Section F: Confidentiality and data protection",
      "type": "mcq",
      "text": "You need to send a file of staff details to the accountant. Which method is appropriate?",
      "opts": [
        "Share it securely through OneDrive with the accountant only, or as a password-protected file with the password sent separately",
        "Attach it unprotected to an email to several people",
        "Send it through WhatsApp",
        "Post it in a Teams channel for all staff"
      ],
      "correct": 0,
      "explain": "Personal data is sent only to those who need it, through secure means.",
      "id": "o2q45"
    },
    {
      "sec": "Section F: Confidentiality and data protection",
      "type": "mcq",
      "text": "A laptop containing company files is lost. What should happen first?",
      "opts": [
        "Wait to see if it turns up",
        "Buy a replacement quietly",
        "Report it immediately to the MD so the device can be blocked, passwords changed and any data breach assessed",
        "Tell only your team"
      ],
      "correct": 2,
      "explain": "Speed limits the damage. A breach may also have to be reported to the regulator within 72 hours.",
      "id": "o2q46"
    },
    {
      "sec": "Section F: Confidentiality and data protection",
      "type": "tf",
      "text": "It is acceptable to discuss a vendor's contract terms with a friend who works for a competing vendor.",
      "correct": "False",
      "explain": "Contract terms are confidential company information and must not be disclosed.",
      "id": "o2q47"
    },
    {
      "sec": "Section F: Confidentiality and data protection",
      "type": "tf",
      "text": "Leaving your computer unlocked while away from your desk is a security risk even in the office.",
      "correct": "True",
      "explain": "An unlocked screen gives anyone access to email, files and systems under your name.",
      "id": "o2q48"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "In a Word document being reviewed by three people, how do you show exactly what each reviewer changed?",
      "opts": [
        "Ask each person to use a different font colour",
        "Save three separate copies",
        "Compare printed versions by hand",
        "Turn on Track Changes, so edits are marked by author and can be accepted or rejected"
      ],
      "correct": 3,
      "explain": "Track Changes records every edit with its author and makes review controlled.",
      "id": "o2q49"
    },
    {
      "sec": "Section A: Microsoft 365 tools",
      "type": "mcq",
      "text": "Which Excel feature stops people typing inconsistent vendor names such as 'Apex', 'APEX Ltd' and 'Apex Supplies'?",
      "opts": [
        "Bold formatting",
        "Wrap text",
        "Data validation with a drop-down list of approved vendor names",
        "Merge cells"
      ],
      "correct": 2,
      "explain": "Consistent entries make SUMIFS and PivotTables accurate. Drop-down lists enforce them.",
      "id": "o2q50"
    },
    {
      "sec": "Section B: Records, filing and document control",
      "type": "mcq",
      "text": "How long should records be kept?",
      "opts": [
        "Forever, in case they are needed",
        "Until the folder is full",
        "One month",
        "In line with the company's retention schedule and legal requirements, then disposed of securely"
      ],
      "correct": 3,
      "explain": "Retention follows law and policy. Keeping personal data longer than needed breaches the NDPA; disposing too early can breach tax and company law.",
      "id": "o2q51"
    },
    {
      "sec": "Section C: Meetings, minutes and correspondence",
      "type": "mcq",
      "text": "The MD asks you to arrange a meeting 'sometime next week' with a client. What should the invitation include?",
      "opts": [
        "Only the date",
        "Only a Teams link",
        "The MD's personal phone number",
        "A clear subject, the purpose, date and time with time zone, location or Teams link, attendees, and any documents to read first"
      ],
      "correct": 3,
      "explain": "A complete invitation prevents confusion and wasted time.",
      "id": "o2q52"
    },
    {
      "sec": "Section D: Vendors, invoices and reporting",
      "type": "mcq",
      "text": "A vendor's price rose 40% at renewal without notice. What is the right step?",
      "opts": [
        "Pay it; renewals are automatic",
        "Cancel the service immediately",
        "Ignore it",
        "Check the contract terms, compare with alternatives, and give the MD a short summary with options before the renewal date"
      ],
      "correct": 3,
      "explain": "The coordinator's value is in preparing the decision: facts, options and deadlines.",
      "id": "o2q53"
    },
    {
      "sec": "Section E: Judgement, authority and escalation",
      "type": "mcq",
      "text": "A staff member asks you to approve their leave while the MD is away. What do you do?",
      "opts": [
        "Explain that leave approval sits with the MD or the designated approver, log the request, and pass it on",
        "Approve it",
        "Refuse it",
        "Ignore it until the MD returns"
      ],
      "correct": 0,
      "explain": "Knowing the limits of your authority, and routing requests correctly, is part of the role.",
      "id": "o2q54"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "Draft a short, professional email (four to six sentences) to a vendor, Apex Supplies Ltd, declining their request to increase their monthly fee by 25% from next month, and asking them to propose an alternative before the contract review in two weeks.",
      "sub": "Write clearly and politely, stay within your authority, and do not threaten to end the contract.",
      "placeholder": "Dear Apex Supplies Ltd, thank you for your letter...",
      "id": "o2q55"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "Write the minutes entry for this discussion: the team agreed to move the office internet contract from Provider A to Provider B from 1 November, Tunde will give notice to Provider A by 15 October, and the MD will sign Provider B's contract once legal has reviewed it.",
      "sub": "Record the decision and each action with its owner and date, neutrally and concisely.",
      "placeholder": "Decision: ...",
      "id": "o2q56"
    }
  ],
  "Social Media & Community Manager": [
    {
      "sec": "Section A: Platforms and formats",
      "type": "mcq",
      "text": "GoLive wants to reach finance and operations managers at Lagos businesses with 50 or more staff. Which platform should lead?",
      "opts": [
        "LinkedIn, where decision-makers at that level are reachable by job title and company size",
        "TikTok, because it has the most users",
        "Snapchat, for its younger audience",
        "Pinterest, for its visual format"
      ],
      "correct": 0,
      "explain": "Platform choice follows the audience. B2B decision-makers are best reached on LinkedIn, where targeting by role and company size is native.",
      "id": "m2q01"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "mcq",
      "text": "Which Instagram format disappears after 24 hours unless saved to Highlights?",
      "opts": [
        "Stories",
        "Reels",
        "Carousel posts",
        "Grid posts"
      ],
      "correct": 0,
      "explain": "Stories expire after 24 hours; Highlights keep the useful ones on the profile.",
      "id": "m2q02"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "mcq",
      "text": "A 60-second product explainer performs poorly as a static grid video on Instagram. What change is most likely to improve reach?",
      "opts": [
        "Post it at a higher resolution",
        "Add more hashtags to the caption",
        "Recut it as a vertical Reel with a strong hook in the first two seconds and captions",
        "Post the same video three times a day"
      ],
      "correct": 2,
      "explain": "Reels are distributed more widely and are watched with sound off. The first seconds decide whether anyone stays.",
      "id": "m2q03"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "mcq",
      "text": "What is the standard post length limit on X for accounts without a paid subscription?",
      "opts": [
        "140 characters",
        "500 characters",
        "280 characters",
        "Unlimited"
      ],
      "correct": 2,
      "explain": "Standard accounts are limited to 280 characters. Longer posts need a paid tier, so write for 280.",
      "id": "m2q04"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "mcq",
      "text": "Where should GoLive manage its Facebook and Instagram pages and ad accounts?",
      "opts": [
        "Through the MD's personal Facebook profile",
        "Through a shared password kept in WhatsApp",
        "In Meta Business Suite, with each team member given their own role, rather than through one shared personal login",
        "Through a freelancer's account"
      ],
      "correct": 2,
      "explain": "Business Suite roles keep access controlled and removable. Pages tied to a personal profile or shared login are lost when that person leaves.",
      "id": "m2q05"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "mcq",
      "text": "A LinkedIn post from the company page gets far less reach than the same post from the MD's personal profile. Why?",
      "opts": [
        "The company page is broken",
        "LinkedIn penalises Nigerian companies",
        "LinkedIn tends to distribute posts from people more widely than from company pages, so employee and leader posts extend reach",
        "The post had too few hashtags"
      ],
      "correct": 2,
      "explain": "Personal profiles usually outperform pages. A good strategy uses both, with leaders sharing and adding their own view.",
      "id": "m2q06"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "tf",
      "text": "Most people watch short-form video on social media with the sound off, so captions matter.",
      "correct": "True",
      "explain": "Captions make video understandable without sound and improve accessibility.",
      "id": "m2q07"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "tf",
      "text": "Posting identical content with identical captions on every platform is the most effective approach.",
      "correct": "False",
      "explain": "Each platform has its own audience, format and tone. Adapting content performs better than copying it.",
      "id": "m2q08"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "Which opening line is strongest for a LinkedIn post about Microsoft 365 security for SMEs?",
      "opts": [
        "'GoLive is a leading provider of Microsoft 365 solutions.'",
        "'Security is very important in today's digital world.'",
        "'Last month, a Lagos law firm lost access to every client email for four days. Here is what stopped it happening to our clients.'",
        "'Click here to learn about our services!!!'"
      ],
      "correct": 2,
      "explain": "A specific, relatable story earns attention. Generic statements and hard selling are scrolled past. (Any real case would need the client's permission.)",
      "id": "m2q09"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "Which call to action best suits a post aimed at generating leads?",
      "opts": [
        "'Like and share!'",
        "'We are the best.'",
        "'Book a free 20-minute Microsoft 365 assessment. Link in the comments.'",
        "'Contact us for more information about anything.'"
      ],
      "correct": 2,
      "explain": "A clear, low-effort next step tied to a business outcome converts. Vague calls to action do not.",
      "id": "m2q10"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "A caption for Nigerian SME owners reads stiff and corporate. What is the best adjustment?",
      "opts": [
        "Write in the clear, direct, professional English they use every day, with concrete examples from their business life",
        "Use heavy slang to seem relatable",
        "Add more technical terms to show expertise",
        "Make it longer"
      ],
      "correct": 0,
      "explain": "The register should match the audience: professional but plain. Heavy slang undermines a B2B brand; jargon excludes.",
      "id": "m2q11"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "You need an image for a post and find a perfect one on Google Images. What do you do?",
      "opts": [
        "Use it; everything on Google is free",
        "Use it and credit 'Google'",
        "Crop it so it is unrecognisable",
        "Use a properly licensed image, or create one in Canva with licensed elements, rather than using the Google result"
      ],
      "correct": 3,
      "explain": "Images found online are usually copyrighted. Using them without a licence exposes the company to claims.",
      "id": "m2q12"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "What makes a carousel post effective on LinkedIn or Instagram?",
      "opts": [
        "As much text as possible on each slide",
        "Twenty slides minimum",
        "Only the logo on the first slide",
        "A strong first slide that promises something, one idea per slide, and a clear final slide with the next step"
      ],
      "correct": 3,
      "explain": "Each slide must earn the swipe. The first sells the rest; the last converts.",
      "id": "m2q13"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "GoLive has a real customer success story. What must happen before publishing it?",
      "opts": [
        "Publish it; it is positive",
        "Publish it without the company name",
        "Get the customer's written permission, and confirm the facts and figures with them",
        "Post it and ask for permission afterwards"
      ],
      "correct": 2,
      "explain": "Customer stories need consent. Publishing without it risks the relationship and may breach data protection and confidentiality duties.",
      "id": "m2q14"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "tf",
      "text": "Using a popular song in a promotional video is allowed as long as the video is short.",
      "correct": "False",
      "explain": "Commercial use of music needs a licence regardless of length. Use the platform's commercial music library or licensed tracks.",
      "id": "m2q15"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "tf",
      "text": "A post should have one clear message and one clear action rather than several.",
      "correct": "True",
      "explain": "Focus converts. Several messages dilute each other.",
      "id": "m2q16"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "A post had 10,000 impressions and 6,000 reach. What is the difference?",
      "opts": [
        "They are the same measure",
        "Reach includes repeats; impressions do not",
        "Impressions count every view including repeats; reach counts unique accounts that saw it",
        "Impressions are clicks"
      ],
      "correct": 2,
      "explain": "Knowing the difference stops inflated reporting. Reach says how many people; impressions how many views.",
      "id": "m2q17"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "A post got 200 clicks from 8,000 impressions. What is its click-through rate?",
      "opts": [
        "0.25%",
        "2.5%",
        "25%",
        "4%"
      ],
      "correct": 1,
      "explain": "CTR is clicks divided by impressions: 200 divided by 8,000 is 0.025, or 2.5%.",
      "id": "m2q18"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "Management asks whether social media produced any business last month. Which report answers it?",
      "opts": [
        "Follower growth only",
        "Total likes",
        "Number of posts published",
        "Leads and enquiries attributed to social, using UTM-tagged links and the CRM, alongside cost where ads were run"
      ],
      "correct": 3,
      "explain": "The role reports on leads, not vanity metrics. UTM links show which posts sent visitors who became enquiries.",
      "id": "m2q19"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "What is a UTM parameter used for?",
      "opts": [
        "Shortening links",
        "Hiding a link from search engines",
        "Scheduling posts",
        "Tagging a link so website analytics can show which platform, campaign and post a visitor came from"
      ],
      "correct": 3,
      "explain": "UTM tags such as utm_source and utm_campaign let you attribute visits and leads to specific posts.",
      "id": "m2q20"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "Two versions of an ad differ in image, headline and audience at once. Version B wins. What can you conclude?",
      "opts": [
        "The image caused the difference",
        "The audience caused the difference",
        "Little about why it won, because three variables changed together; test one variable at a time",
        "Headlines never matter"
      ],
      "correct": 2,
      "explain": "A fair test changes one thing. Otherwise the result cannot be explained or repeated.",
      "id": "m2q21"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "Engagement is high on funny posts, but none of the enquiries came from them. What do you recommend?",
      "opts": [
        "Keep some lighter posts for reach, but weight the calendar towards content that produces enquiries, and report both",
        "Post only funny content, since engagement is high",
        "Stop all light content immediately",
        "Ignore the enquiry data"
      ],
      "correct": 0,
      "explain": "Engagement and business outcomes are different goals. A balanced calendar serves both, measured honestly.",
      "id": "m2q22"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "How should the best posting times for GoLive's audience be decided?",
      "opts": [
        "From a generic blog post about best times",
        "From GoLive's own analytics on when its followers are active, tested over several weeks",
        "By posting at midnight to avoid competition",
        "By asking one colleague"
      ],
      "correct": 1,
      "explain": "Audiences differ. Your own data beats general advice.",
      "id": "m2q23"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "tf",
      "text": "A rising follower count on its own proves the social media strategy is working.",
      "correct": "False",
      "explain": "Followers without engagement or enquiries show little. Outcomes matter more than audience size.",
      "id": "m2q24"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "tf",
      "text": "Engagement rate is commonly calculated as total engagements divided by reach.",
      "correct": "True",
      "explain": "It shows how much of the audience that saw the content interacted with it. Always state which denominator you use.",
      "id": "m2q25"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "mcq",
      "text": "A customer posts publicly: 'GoLive set up our email and it has been down all day. Terrible service.' What is the right first response?",
      "opts": [
        "Delete the comment",
        "Argue that the fault is probably theirs",
        "Ignore it until support has fixed it",
        "Reply publicly within the hour, acknowledging the problem, saying you are looking into it, and inviting them to DM their account details; then escalate internally"
      ],
      "correct": 3,
      "explain": "A prompt, calm public acknowledgement shows everyone watching that GoLive takes it seriously. Details move to private messages.",
      "id": "m2q26"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "mcq",
      "text": "A clearly abusive comment uses insults but contains no genuine complaint. What is appropriate?",
      "opts": [
        "Reply with an insult",
        "Leave it permanently to seem open",
        "Report the person to the police",
        "Hide or remove it under the page's published community rules, and document it"
      ],
      "correct": 3,
      "explain": "Abuse can be moderated under clear community guidelines. Genuine criticism, however, should be answered, not deleted.",
      "id": "m2q27"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "mcq",
      "text": "An old post from GoLive's account is being shared angrily because it can be read as offensive. What do you do first?",
      "opts": [
        "Delete it and say nothing",
        "Post a joke to lighten the mood",
        "Reply to every critic individually straight away",
        "Alert the MD immediately, stop scheduled posts, and agree a response before replying publicly"
      ],
      "correct": 3,
      "explain": "In a reputation incident, pause, escalate and agree one response. Deleting silently often looks like a cover-up.",
      "id": "m2q28"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "mcq",
      "text": "A prospect sends a DM asking about Microsoft 365 pricing late on a Friday. What should happen?",
      "opts": [
        "Leave it until Monday without replying",
        "Quote prices yourself from memory",
        "Acknowledge it promptly with a friendly reply and log it as a lead, passing it to sales with the details",
        "Tell them to email instead"
      ],
      "correct": 2,
      "explain": "DMs are leads. A fast acknowledgement and a clean handover protect them; quoting prices is the sales team's role.",
      "id": "m2q29"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "mcq",
      "text": "A customer complaint on social media turns out to be a misunderstanding on their part. How do you close it publicly?",
      "opts": [
        "Post proof that they were wrong",
        "Thank them, explain briefly and politely what happened, and confirm it is resolved, without making them look foolish",
        "Leave the thread unanswered",
        "Delete the thread"
      ],
      "correct": 1,
      "explain": "Graceful resolution in public wins more trust than winning the argument.",
      "id": "m2q30"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "tf",
      "text": "Deleting genuine negative reviews is an effective way to protect the brand.",
      "correct": "False",
      "explain": "Deleted criticism resurfaces as screenshots, looking worse. A good public response builds more trust.",
      "id": "m2q31"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "tf",
      "text": "Details such as account numbers or phone numbers should be moved from public comments to private messages.",
      "correct": "True",
      "explain": "Personal details must never be discussed publicly. Move the conversation to a private channel.",
      "id": "m2q32"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "mcq",
      "text": "What are content pillars?",
      "opts": [
        "The number of posts per day",
        "The company's logo and colours",
        "A small set of recurring themes that all content maps to, such as education, customer stories and product, keeping the calendar consistent",
        "A list of hashtags"
      ],
      "correct": 2,
      "explain": "Pillars give a calendar structure and keep the brand's message coherent.",
      "id": "m2q33"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "mcq",
      "text": "The MD asks for daily posting on all four platforms, but you can only produce quality content three times a week. What do you recommend?",
      "opts": [
        "Agree and post low-quality content daily",
        "Refuse without explanation",
        "Explain the trade-off with data, propose a realistic cadence per platform, and show how quality posts outperform frequent weak ones",
        "Post the same content everywhere daily"
      ],
      "correct": 2,
      "explain": "Honest capacity planning backed by evidence is more useful than overpromising.",
      "id": "m2q34"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "mcq",
      "text": "What is the main advantage of a monthly content calendar?",
      "opts": [
        "It aligns posts with business priorities and dates, allows approval in advance, and avoids last-minute weak content",
        "It removes the need to check analytics",
        "It guarantees viral posts",
        "It lets you post the same thing monthly"
      ],
      "correct": 0,
      "explain": "Planning ahead improves quality and makes approvals and campaigns manageable.",
      "id": "m2q35"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "mcq",
      "text": "Boosting a post versus using Ads Manager: which statement is accurate?",
      "opts": [
        "Boosting always outperforms Ads Manager",
        "Ads Manager gives more control over objectives, audiences, placements and testing than the Boost button",
        "Ads Manager cannot target by location",
        "They are identical"
      ],
      "correct": 1,
      "explain": "Boosting is quick but limited. Ads Manager is the right tool for lead-generation campaigns.",
      "id": "m2q36"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "mcq",
      "text": "A competitor's post went viral. What is the professional response?",
      "opts": [
        "Copy the post exactly",
        "Criticise the competitor publicly",
        "Understand why it worked and apply the lesson to GoLive's own voice and audience, rather than copying it",
        "Ignore competitors entirely"
      ],
      "correct": 2,
      "explain": "Learning from competitors is smart; copying is unoriginal and can breach copyright.",
      "id": "m2q37"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "tf",
      "text": "Every post should be tied to at least one business goal, such as awareness, leads or customer support.",
      "correct": "True",
      "explain": "Purposeful content is measurable. Posting without a goal makes reporting impossible.",
      "id": "m2q38"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "tf",
      "text": "A strong brand voice means changing tone completely depending on the mood of the day.",
      "correct": "False",
      "explain": "Consistency builds recognition. Tone adapts to context, but the voice stays recognisably GoLive.",
      "id": "m2q39"
    },
    {
      "sec": "Section F: Compliance, ethics and account security",
      "type": "mcq",
      "text": "A former freelancer still has admin access to GoLive's Facebook page. What do you do?",
      "opts": [
        "Leave it in case they are needed",
        "Change the page name",
        "Ask them nicely not to post",
        "Remove their access in Business Suite straight away, review who else has access, and confirm two-factor authentication is on"
      ],
      "correct": 3,
      "explain": "Access should end when the work ends. Stale admin access is a common route to page takeovers.",
      "id": "m2q40"
    },
    {
      "sec": "Section F: Compliance, ethics and account security",
      "type": "mcq",
      "text": "You receive a message claiming to be from Meta saying the page will be deleted unless you verify through a link. What do you do?",
      "opts": [
        "Click and verify quickly",
        "Do not click; check the page's status directly in Business Suite and report the message as phishing",
        "Forward it to the team to click",
        "Reply asking for more information"
      ],
      "correct": 1,
      "explain": "Fake 'Meta support' messages are a common way to steal page access. Verify only inside the official tools.",
      "id": "m2q41"
    },
    {
      "sec": "Section F: Compliance, ethics and account security",
      "type": "mcq",
      "text": "GoLive pays an influencer to post about its Microsoft 365 packages. What is required?",
      "opts": [
        "Nothing, if the influencer likes the product",
        "Only a hashtag the audience will not notice",
        "Disclosure only if more than N1m is paid",
        "The post must be clearly disclosed as a paid partnership, using the platform's label or equivalent wording"
      ],
      "correct": 3,
      "explain": "Paid promotion must be disclosed clearly. Hidden advertising misleads the audience and breaches advertising standards.",
      "id": "m2q42"
    },
    {
      "sec": "Section F: Compliance, ethics and account security",
      "type": "mcq",
      "text": "A delighted customer sends a screenshot of their invoice praising GoLive. Can it be posted?",
      "opts": [
        "Yes, as it is positive",
        "Only with the customer's permission and with personal and financial details removed",
        "Yes, if posted as a Story that disappears",
        "Yes, if the name is kept but the amount removed"
      ],
      "correct": 1,
      "explain": "Invoices contain personal and commercial data. Consent and redaction are needed under the NDPA and ordinary confidentiality.",
      "id": "m2q43"
    },
    {
      "sec": "Section F: Compliance, ethics and account security",
      "type": "mcq",
      "text": "Which body regulates advertising in Nigeria, including advertising on digital platforms?",
      "opts": [
        "The Nigerian Communications Commission only",
        "The Advertising Regulatory Council of Nigeria (ARCON)",
        "The Corporate Affairs Commission",
        "No body regulates digital advertising"
      ],
      "correct": 1,
      "explain": "ARCON regulates advertising, including digital. Campaign claims should be accurate and within its rules.",
      "id": "m2q44"
    },
    {
      "sec": "Section F: Compliance, ethics and account security",
      "type": "tf",
      "text": "Social media passwords should be shared with the whole team in a WhatsApp group so anyone can post in an emergency.",
      "correct": "False",
      "explain": "Each person should have their own access through business tools. Shared passwords cannot be revoked individually and leak easily.",
      "id": "m2q45"
    },
    {
      "sec": "Section F: Compliance, ethics and account security",
      "type": "tf",
      "text": "Two-factor authentication should be enabled on every account that can post for GoLive.",
      "correct": "True",
      "explain": "2FA stops most account takeovers even when a password is stolen.",
      "id": "m2q46"
    },
    {
      "sec": "Section A: Platforms and formats",
      "type": "mcq",
      "text": "GoLive wants to share a 90-second customer testimonial on LinkedIn. Which upload method usually performs best?",
      "opts": [
        "Post a YouTube link only",
        "Post a screenshot of the video",
        "Share a Google Drive link",
        "Upload the video natively to LinkedIn with captions, rather than posting a YouTube link"
      ],
      "correct": 3,
      "explain": "Platforms favour native video over links that take users away. Captions carry the message without sound.",
      "id": "m2q47"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "Which hashtag approach is most effective on LinkedIn?",
      "opts": [
        "Thirty hashtags in every post",
        "No hashtags ever, under any circumstances",
        "Three to five relevant hashtags that the target audience actually follows",
        "Only trending hashtags unrelated to the post"
      ],
      "correct": 2,
      "explain": "A few relevant hashtags help discovery. Excessive or irrelevant ones look like spam.",
      "id": "m2q48"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "mcq",
      "text": "A graphic has small text over a busy photo. What is the most important fix?",
      "opts": [
        "Add more text",
        "Use more colours",
        "Add the logo three times",
        "Increase the contrast and size of the text so it is readable on a phone screen"
      ],
      "correct": 3,
      "explain": "Most viewers are on phones. If the text cannot be read at a glance, the graphic fails.",
      "id": "m2q49"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "Link clicks rose but website enquiries did not. Where should you look?",
      "opts": [
        "At the post's colours",
        "At follower count",
        "At the landing page and the journey after the click, since the problem may be what visitors find, not the post",
        "Nowhere; clicks are the goal"
      ],
      "correct": 2,
      "explain": "Social can deliver the visit; the page must convert it. Reporting both shows where the funnel breaks.",
      "id": "m2q50"
    },
    {
      "sec": "Section C: Analytics and reporting",
      "type": "mcq",
      "text": "A campaign spent N150,000 on ads and produced 30 qualified leads. What was the cost per lead?",
      "opts": [
        "N5,000",
        "N4,500",
        "N50,000",
        "N500"
      ],
      "correct": 0,
      "explain": "150,000 divided by 30 is 5,000.",
      "id": "m2q51"
    },
    {
      "sec": "Section D: Community management and crisis",
      "type": "mcq",
      "text": "A customer's complaint on X is gaining retweets while you are off duty. What arrangement prevents this becoming a crisis?",
      "opts": [
        "Turning off notifications at weekends",
        "Deleting the account",
        "Replying only on Mondays",
        "An agreed escalation path and out-of-hours cover, so urgent public complaints are acknowledged quickly"
      ],
      "correct": 3,
      "explain": "Complaints do not keep office hours. A simple rota and escalation list keeps response times short.",
      "id": "m2q52"
    },
    {
      "sec": "Section E: Strategy and planning",
      "type": "mcq",
      "text": "What is the best way to repurpose a detailed blog article about Microsoft 365 security?",
      "opts": [
        "Paste the full article into one post",
        "Post the link once and forget it",
        "Turn its key points into a carousel, a short video tip, and a few single-idea posts spread across the month",
        "Rewrite it as a press release"
      ],
      "correct": 2,
      "explain": "One strong piece can feed many formats, each suited to its platform.",
      "id": "m2q53"
    },
    {
      "sec": "Section B: Content and copywriting",
      "type": "tf",
      "text": "Proofreading every post before publishing is part of protecting a B2B brand's credibility.",
      "correct": "True",
      "explain": "Errors in a company's public posts undermine confidence in its professionalism.",
      "id": "m2q54"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "Write a LinkedIn post (80 to 120 words) announcing that GoLive now offers Microsoft 365 migrations completed over a single weekend, aimed at owners of Nigerian businesses with 10 to 50 staff.",
      "sub": "Open with a strong hook, keep it professional and clear, and end with one call to action. Do not invent customer names or statistics.",
      "placeholder": "Moving your team to Microsoft 365 does not have to mean...",
      "id": "m2q55"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "A customer posts on Facebook: 'Paid GoLive two weeks ago and still no email setup. Is this a scam?' Write the public reply you would post, and one sentence on what you would do next internally.",
      "sub": "Stay calm and professional. Do not share personal or account details publicly, and do not promise a timeline you cannot confirm.",
      "placeholder": "Hello Mr Eze, we are sorry to hear this...",
      "id": "m2q56"
    }
  ],
  "Hosting Support Technician": [
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "A customer is moving their website to GoLive tomorrow and wants the switch to be as quick as possible for visitors. What should you do today?",
      "opts": [
        "Lower the TTL on the domain's A record, so that tomorrow's change is picked up by resolvers within minutes",
        "Change the nameservers today and the A record tomorrow",
        "Delete the old A record so browsers stop caching it",
        "Nothing; DNS changes always take 24 to 48 hours regardless of settings"
      ],
      "correct": 0,
      "explain": "Resolvers cache a record for its TTL. Lowering the TTL a day ahead means the old value expires quickly when the record changes. The '24 to 48 hours' rule is a myth rooted in long default TTLs.",
      "id": "h2q01"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "A customer wants www.example.com to point to their hosting while the bare domain example.com keeps its existing A record. Which record is appropriate for www?",
      "opts": [
        "A CNAME at the bare domain example.com",
        "A CNAME for www pointing to the hosting hostname, or an A record for www to the server IP",
        "An MX record for www",
        "A TXT record containing the server IP"
      ],
      "correct": 1,
      "explain": "A CNAME is fine on a subdomain such as www. It cannot sit at the zone apex alongside the SOA and NS records, which is why the bare domain uses an A record.",
      "id": "h2q02"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "A domain has two MX records: priority 10 pointing to mx1, and priority 20 pointing to mx2. How do sending servers use them?",
      "opts": [
        "They try mx2 first, because the higher number is preferred",
        "They try mx1 first, because the lower number is preferred, and fall back to mx2 if mx1 is unreachable",
        "They split mail evenly between the two",
        "Only mx2 is used; mx1 is ignored"
      ],
      "correct": 1,
      "explain": "MX preference: lower numbers are tried first. Equal numbers share the load.",
      "id": "h2q03"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "A customer changed their nameservers to GoLive's two hours ago. Their site loads for you but not for them. What is the most likely reason?",
      "opts": [
        "The website files are corrupted",
        "Their resolver is still caching the old nameserver delegation; it will clear as the TTL expires, and you can confirm by querying a public resolver",
        "Their SSL certificate has expired",
        "Nameserver changes are rejected unless made in cPanel"
      ],
      "correct": 1,
      "explain": "Delegation changes propagate as caches expire. Checking with a public resolver or a DNS lookup tool shows whether the new records are visible, which separates a propagation delay from a real fault.",
      "id": "h2q04"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "Which record type maps a hostname to an IPv6 address?",
      "opts": [
        "A",
        "PTR",
        "AAAA",
        "SRV"
      ],
      "correct": 2,
      "explain": "A maps to IPv4, AAAA to IPv6. PTR is reverse lookup from IP to name. SRV locates services.",
      "id": "h2q05"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "A customer wants to move their domain from another registrar to GoLive. What do you need from them first?",
      "opts": [
        "Their cPanel password",
        "A copy of their SSL certificate",
        "Their website files",
        "The domain unlocked at the current registrar and its transfer authorisation (EPP) code"
      ],
      "correct": 3,
      "explain": "Transfers need the domain unlocked and the authorisation code. Hosting details are separate. Domains are also usually locked for 60 days after registration or a previous transfer.",
      "id": "h2q06"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "Which tool gives the most reliable view of what the rest of the internet sees for a domain's DNS right now?",
      "opts": [
        "Pinging the domain from your own laptop",
        "Opening the site in your browser",
        "Querying the authoritative nameservers directly, for example with dig @ns1.provider.com example.com",
        "Checking the customer's cPanel zone editor only"
      ],
      "correct": 2,
      "explain": "The authoritative nameservers are the source of truth. Your own resolver and browser may be serving cached answers, and cPanel only helps if the domain actually uses those nameservers.",
      "id": "h2q07"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "tf",
      "text": "A CNAME record can safely be created at the same name as an MX record.",
      "correct": "False",
      "explain": "A CNAME cannot coexist with any other record at the same name. Doing so breaks mail and is rejected by most DNS software.",
      "id": "h2q08"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "tf",
      "text": "Lowering a record's TTL a day before changing it shortens how long the old value stays cached after the change.",
      "correct": "True",
      "explain": "Caches hold a record for its TTL. A lower TTL, set in advance, means the change is seen sooner.",
      "id": "h2q09"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "A customer's emails to Gmail are landing in spam, and their domain has no SPF record. What is the right first fix?",
      "opts": [
        "Publish a single SPF TXT record listing every service that sends mail for the domain",
        "Add a separate SPF record for each sending service",
        "Ask recipients to mark the emails as not spam",
        "Switch the domain to a new IP address"
      ],
      "correct": 0,
      "explain": "SPF authorises sending sources. A domain may have only one SPF record; several records make SPF fail outright.",
      "id": "h2q10"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "A domain's SPF record contains eleven include statements. Mail from it fails SPF checks at some receivers. Why?",
      "opts": [
        "SPF records must be under 50 characters",
        "SPF evaluation is limited to 10 DNS lookups; exceeding it returns a permanent error, so the record must be simplified",
        "Include statements are not allowed in SPF",
        "The record needs the ~all qualifier removed"
      ],
      "correct": 1,
      "explain": "The 10-lookup limit is one of the commonest silent SPF failures. Flattening or removing unused includes fixes it.",
      "id": "h2q11"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "Where is a DKIM public key published?",
      "opts": [
        "In the MX record",
        "At _dmarc.example.com",
        "In a TXT record at selector._domainkey.example.com",
        "In the SPF record"
      ],
      "correct": 2,
      "explain": "DKIM keys live under a selector name in the _domainkey subdomain. The sending server signs with the private key; receivers fetch the public one.",
      "id": "h2q12"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "A customer asks what DMARC p=none does.",
      "opts": [
        "It asks receivers to take no action on failing mail but to send reports, so the domain can monitor before enforcing",
        "It rejects all mail that fails SPF",
        "It disables SPF and DKIM checks",
        "It quarantines every message from the domain"
      ],
      "correct": 0,
      "explain": "p=none is monitoring mode. Moving to quarantine and then reject comes after reports show legitimate mail passes.",
      "id": "h2q13"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "A customer's server IP appears on a spam blacklist. What should happen before requesting delisting?",
      "opts": [
        "Request delisting immediately",
        "Change the domain name",
        "Find and stop the cause, such as a compromised mailbox or a script sending spam, so the listing does not simply return",
        "Disable the customer's email for a month"
      ],
      "correct": 2,
      "explain": "Delisting without fixing the cause leads to relisting, and repeated listings are harder to clear. Check the mail queue and recent logins first.",
      "id": "h2q14"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "A bounce reads: '550 5.7.1 Message rejected due to DMARC policy'. What does it indicate?",
      "opts": [
        "The recipient's mailbox is full",
        "The message failed DMARC alignment at the receiving side, so SPF or DKIM for the sending domain needs checking",
        "The sender typed the wrong address",
        "The message was too large"
      ],
      "correct": 1,
      "explain": "5.7.x codes are policy rejections. A DMARC rejection means neither SPF nor DKIM passed in alignment with the From domain.",
      "id": "h2q15"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "What does a PTR (reverse DNS) record for a mail server's IP help with?",
      "opts": [
        "It speeds up website loading",
        "It replaces the need for SPF",
        "It stores the DKIM key",
        "Receivers check that the sending IP resolves back to a sensible hostname, and many reject or penalise mail when it does not"
      ],
      "correct": 3,
      "explain": "Reverse DNS is a basic trust signal for mail servers. It is set by whoever controls the IP, usually the hosting provider.",
      "id": "h2q16"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "mcq",
      "text": "A customer on shared hosting sends a newsletter to 8,000 contacts from their cPanel mailbox and it fails partway. What is the most likely cause and advice?",
      "opts": [
        "Their mailbox password expired",
        "Shared hosting enforces hourly sending limits; bulk mail should go through a dedicated email marketing service",
        "The newsletter had too many images",
        "Their DNS is misconfigured"
      ],
      "correct": 1,
      "explain": "Per-hour sending caps protect shared IP reputation. Bulk and marketing mail belongs on a service built for it, with its own authentication.",
      "id": "h2q17"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "tf",
      "text": "A domain can publish two separate SPF records if it uses two email providers.",
      "correct": "False",
      "explain": "Only one SPF record is allowed. Multiple records cause a permanent error; the providers must be combined in one record.",
      "id": "h2q18"
    },
    {
      "sec": "Section B: Email authentication and deliverability",
      "type": "tf",
      "text": "DMARC can pass even if SPF fails, provided DKIM passes and is aligned with the From domain.",
      "correct": "True",
      "explain": "DMARC needs either SPF or DKIM to pass in alignment. A valid, aligned DKIM signature is enough.",
      "id": "h2q19"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "A customer's website shows errors and their email is bouncing at the same time. What should you check first?",
      "opts": [
        "Their SSL certificate",
        "Their disk quota, because a full account can stop both the site writing files and mail being delivered",
        "Their domain renewal date",
        "Whether they have the latest WordPress theme"
      ],
      "correct": 1,
      "explain": "One cause behind two symptoms is the efficient first check. A full quota affects site writes, sessions and mailbox delivery together.",
      "id": "h2q20"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "What file permissions are standard for website files and folders on a typical cPanel account?",
      "opts": [
        "777 for everything, to avoid permission errors",
        "644 for files and 755 for directories",
        "600 for files and 700 for directories",
        "755 for files and 644 for directories"
      ],
      "correct": 1,
      "explain": "644 and 755 let the web server read content without letting others write to it. 777 is a security risk and is blocked by many servers.",
      "id": "h2q21"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "A site returns a 500 Internal Server Error straight after the customer edited .htaccess. What do you do?",
      "opts": [
        "Reinstall the operating system",
        "Renew the SSL certificate",
        "Check the error log, then restore or correct the .htaccess change that introduced the fault",
        "Delete all files in public_html"
      ],
      "correct": 2,
      "explain": "A 500 after an .htaccess edit is almost always a syntax or unsupported directive. The error log names it; the fix is small.",
      "id": "h2q22"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "An account shows 'inode limit reached' although plenty of disk space remains. What does it mean?",
      "opts": [
        "The database is corrupted",
        "The server's RAM is full",
        "The domain has expired",
        "The account has too many files, often cache files, old backups or a full mail folder, even if they are small"
      ],
      "correct": 3,
      "explain": "Inodes count files and folders. Clearing cache directories and old mail usually resolves it.",
      "id": "h2q23"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "A server's load is very high and sites are slow. Which command gives the quickest view of what is consuming resources?",
      "opts": [
        "top (or htop), to see the processes using the most CPU and memory",
        "ls -la",
        "ping 8.8.8.8",
        "cat /etc/hosts"
      ],
      "correct": 0,
      "explain": "top shows live process usage, which points to the culprit: a runaway PHP process, a database query, or a backup.",
      "id": "h2q24"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "A customer needs a PHP script to run every night at 2am. Where is this set up in cPanel?",
      "opts": [
        "File Manager",
        "Zone Editor",
        "Email Routing",
        "Cron Jobs"
      ],
      "correct": 3,
      "explain": "Cron Jobs schedules commands at set times. Remember the server's time zone when choosing the schedule.",
      "id": "h2q25"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "Which method of logging in to a server over SSH is most secure?",
      "opts": [
        "Password login for root",
        "A shared password known to the whole team",
        "Key-based authentication, with password login disabled",
        "Telnet"
      ],
      "correct": 2,
      "explain": "Keys cannot be guessed by brute force. Password login, especially for root, is the main target of automated attacks.",
      "id": "h2q26"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "A customer asks you to 'just restore last night's backup' of their whole account. What should you check before doing it?",
      "opts": [
        "Nothing; restoring is always safe",
        "Whether their SSL is valid",
        "What has changed since the backup, such as new emails, orders or files, because a full restore will overwrite it",
        "Whether they have paid for this month"
      ],
      "correct": 2,
      "explain": "A full restore rolls everything back, including mail received and orders placed since. Often a selective restore of files or the database is what is needed.",
      "id": "h2q27"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "tf",
      "text": "Setting a folder's permissions to 777 is an acceptable quick fix for permission errors on a production website.",
      "correct": "False",
      "explain": "777 lets any user or process write to the folder, which is how malware gets in. The correct fix is the right owner and 644 or 755.",
      "id": "h2q28"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "tf",
      "text": "A full mailbox or account quota can cause incoming email to bounce.",
      "correct": "True",
      "explain": "When there is no space to store mail, delivery fails and senders receive bounces.",
      "id": "h2q29"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "A WordPress site shows a blank white page after a plugin update, and wp-admin is also blank. What is the fastest safe fix?",
      "opts": [
        "Reinstall WordPress from scratch",
        "Restore the whole account from last week's backup",
        "Rename the plugin's folder in wp-content/plugins using File Manager or SSH to deactivate it, then check the error log",
        "Delete the database"
      ],
      "correct": 2,
      "explain": "Renaming a plugin folder deactivates it without wp-admin. Logs first, elimination second, restore last, as the role description says.",
      "id": "h2q30"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "How do you see the actual PHP error behind a WordPress fault on a live site without showing errors to visitors?",
      "opts": [
        "Enable WP_DEBUG with WP_DEBUG_LOG in wp-config.php and WP_DEBUG_DISPLAY off, then read wp-content/debug.log",
        "Turn on display_errors for the whole server",
        "Ask the customer to describe the error",
        "Reinstall the theme"
      ],
      "correct": 0,
      "explain": "Logging to a file captures the error without displaying it publicly. Remember to turn debugging off afterwards.",
      "id": "h2q31"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "After installing SSL, a site shows a padlock warning on some pages. What is the usual cause?",
      "opts": [
        "The certificate is fake",
        "The domain's MX record is wrong",
        "The server clock is five minutes slow",
        "Mixed content: images, scripts or stylesheets still loading over http:// instead of https://"
      ],
      "correct": 3,
      "explain": "Browsers flag pages that load insecure resources. Updating the site URL and replacing hard-coded http links resolves it.",
      "id": "h2q32"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "An AutoSSL certificate fails to issue for a newly added domain. What is the most likely reason?",
      "opts": [
        "The customer has too many email accounts",
        "The server needs a reboot",
        "WordPress is out of date",
        "The domain does not yet point to this server, so the certificate authority's validation cannot reach it"
      ],
      "correct": 3,
      "explain": "Domain validation checks the domain resolves to the server requesting the certificate. Fix the DNS, wait for propagation, then re-run AutoSSL.",
      "id": "h2q33"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "How long are Let's Encrypt certificates valid, and what does that mean for support?",
      "opts": [
        "90 days, so renewal must be automated and a failed renewal becomes a ticket before expiry",
        "Five years, so no action is needed",
        "One day",
        "They never expire"
      ],
      "correct": 0,
      "explain": "Short lifetimes rely on automatic renewal. Monitoring renewals catches failures before visitors see warnings.",
      "id": "h2q34"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "A WordPress site was hacked and is redirecting visitors to a spam site. What is the right order of work?",
      "opts": [
        "Change the admin password and close the ticket",
        "Delete the redirecting line and move on",
        "Restore a backup without investigating",
        "Contain it, identify how the attacker got in, remove the malicious code and replace core, plugins and themes from clean sources, then change all passwords and salts"
      ],
      "correct": 3,
      "explain": "Removing the visible symptom leaves the backdoor. Without finding the entry point, usually an outdated plugin, the site is compromised again.",
      "id": "h2q35"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "A customer's WordPress admin is very slow while the public site is fine. Where do you look first?",
      "opts": [
        "The DNS TTL",
        "The SSL certificate",
        "Plugins running heavy admin tasks, and the database, for example with a query monitor or by disabling plugins one at a time",
        "The domain's MX records"
      ],
      "correct": 2,
      "explain": "Admin-only slowness points to plugin or database load rather than hosting-wide problems.",
      "id": "h2q36"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "tf",
      "text": "Deactivating all WordPress plugins is a reasonable first diagnostic step when a site breaks after an update.",
      "correct": "True",
      "explain": "It separates plugin faults from core or theme faults quickly. Reactivate one at a time to find the culprit.",
      "id": "h2q37"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "tf",
      "text": "A certificate issued only for example.com automatically covers www.example.com.",
      "correct": "False",
      "explain": "A certificate must list every hostname it protects. Issue it for both names, or use a wildcard where appropriate.",
      "id": "h2q38"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "mcq",
      "text": "A ticket reads: 'my website is down, fix it now!!' What is the best first reply?",
      "opts": [
        "Acknowledge quickly, confirm the site you are checking, share what you can already see, and give a time for your next update",
        "Ask them to calm down before you help",
        "Close it and ask them to open a proper ticket",
        "Wait until it is fixed before replying"
      ],
      "correct": 0,
      "explain": "A fast, specific acknowledgement lowers the temperature and sets expectations, even before the fix.",
      "id": "h2q39"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "mcq",
      "text": "You must reboot a shared server for security patches, affecting 60 customers. What is the right approach?",
      "opts": [
        "Reboot now; it only takes five minutes",
        "Schedule it out of business hours, notify affected customers in advance with the window and expected impact, and post an update when it is complete",
        "Reboot without notice at midnight",
        "Wait until a customer complains about security"
      ],
      "correct": 1,
      "explain": "Planned maintenance is communicated ahead, done in a quiet window, and closed off with confirmation. Surprises damage trust more than downtime does.",
      "id": "h2q40"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "mcq",
      "text": "A non-technical customer asks why their email stopped after they changed their domain's nameservers. How do you explain it?",
      "opts": [
        "Tell them it is too technical to explain",
        "Their email settings lived at the old DNS provider; moving the nameservers moved all records, so the email records need adding at the new provider",
        "Say the email server is broken",
        "Explain SPF alignment in detail"
      ],
      "correct": 1,
      "explain": "Plain language, one cause, one fix. Technical accuracy without jargon is the skill.",
      "id": "h2q41"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "mcq",
      "text": "You fixed an issue for a customer that you expect others will hit. What should you do after closing the ticket?",
      "opts": [
        "Nothing; the ticket is closed",
        "Email the fix to the customer's friends",
        "Write it up in the knowledge base, so the next person solves it in minutes",
        "Keep it in your personal notes"
      ],
      "correct": 2,
      "explain": "Documenting fixes is part of the job description: problems should be solved once.",
      "id": "h2q42"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "mcq",
      "text": "A customer insists their problem is GoLive's fault, but your checks show their developer broke the site. How do you respond?",
      "opts": [
        "Tell them their developer is incompetent",
        "Accept the blame to keep them happy",
        "Share what you found factually and without blame, offer the fix or the steps, and let the evidence speak",
        "Stop replying"
      ],
      "correct": 2,
      "explain": "Facts without blame resolve disputes. Accepting false blame creates expectations; blaming their developer creates enemies.",
      "id": "h2q43"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "mcq",
      "text": "Four tickets arrive: one site fully down, one email slow, one request for a new mailbox, and one question about pricing. What order do you take?",
      "opts": [
        "Site down, then slow email, then the new mailbox, then route the pricing question to sales",
        "In the order they arrived",
        "Pricing first, as it could be a sale",
        "New mailbox first, as it is quickest"
      ],
      "correct": 0,
      "explain": "Prioritise by impact. Pricing questions belong with sales, not in the support queue.",
      "id": "h2q44"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "tf",
      "text": "Telling a customer an issue is fixed before you have confirmed it is fixed is acceptable if you are confident.",
      "correct": "False",
      "explain": "Confirm, then report. A premature 'fixed' that turns out wrong costs more trust than a short delay.",
      "id": "h2q45"
    },
    {
      "sec": "Section E: Customer support and maintenance",
      "type": "tf",
      "text": "Every support action, including phone calls, should be recorded against the ticket.",
      "correct": "True",
      "explain": "Records protect the customer and the company and let colleagues pick up where you left off.",
      "id": "h2q46"
    },
    {
      "sec": "Section F: Security and judgement",
      "type": "mcq",
      "text": "A caller says they are a customer's new IT person and asks you to reset the cPanel password and send it to a Gmail address. What do you do?",
      "opts": [
        "Refuse to act on the call; verify through the account holder's registered contact details, and send access only to them",
        "Reset it; they know the domain name",
        "Reset it if they sound professional",
        "Send the old password instead"
      ],
      "correct": 0,
      "explain": "Social engineering is the commonest route into accounts. Verification must use contact details already on record, not ones the caller supplies.",
      "id": "h2q47"
    },
    {
      "sec": "Section F: Security and judgement",
      "type": "mcq",
      "text": "While fixing a site you find a PHP file in wp-content/uploads containing obfuscated code with eval(base64_decode(...)). What does it indicate and what do you do?",
      "opts": [
        "A likely web shell, meaning the site is compromised; escalate as a security incident rather than just deleting the file",
        "A normal WordPress cache file",
        "A licence file from a premium plugin",
        "A harmless leftover to ignore"
      ],
      "correct": 0,
      "explain": "PHP in uploads with obfuscated eval is a classic backdoor. It signals a compromise that needs investigation, not a quick delete.",
      "id": "h2q48"
    },
    {
      "sec": "Section F: Security and judgement",
      "type": "mcq",
      "text": "A customer asks you to add their developer as a full administrator on their hosting account permanently. What is best practice?",
      "opts": [
        "Share the account holder's own login",
        "Grant root access to the server",
        "Refuse all developer access",
        "Confirm with the account holder, grant only the access the developer needs, and agree when it will be removed"
      ],
      "correct": 3,
      "explain": "Least privilege and time-limited access reduce risk. Shared logins remove accountability.",
      "id": "h2q49"
    },
    {
      "sec": "Section F: Security and judgement",
      "type": "mcq",
      "text": "You accidentally delete a customer's folder while troubleshooting. What do you do?",
      "opts": [
        "Say nothing and hope they do not notice",
        "Blame the customer's plugin",
        "Tell your lead immediately, restore from backup if possible, and inform the customer honestly",
        "Restore silently and close the ticket"
      ],
      "correct": 2,
      "explain": "Early honesty contains the damage. Hiding it turns a mistake into a trust failure.",
      "id": "h2q50"
    },
    {
      "sec": "Section F: Security and judgement",
      "type": "mcq",
      "text": "A customer asks for another customer's website files 'because they used to work together'. What do you do?",
      "opts": [
        "Send them; they know each other",
        "Send a partial copy",
        "Decline; hosting data belongs to the account holder and can only be released to them or on their written authority",
        "Ask the other customer later"
      ],
      "correct": 2,
      "explain": "Customer data is confidential under the NDPA and GoLive's terms. Only the account holder can authorise access.",
      "id": "h2q51"
    },
    {
      "sec": "Section F: Security and judgement",
      "type": "tf",
      "text": "It is acceptable to keep customer passwords in a notes file on your laptop for convenience.",
      "correct": "False",
      "explain": "Credentials belong in the company's approved password manager. A lost laptop would expose every customer listed.",
      "id": "h2q52"
    },
    {
      "sec": "Section F: Security and judgement",
      "type": "tf",
      "text": "If a customer's site is hacked, changing passwords after removing the malicious code is still necessary.",
      "correct": "True",
      "explain": "Attackers may have captured credentials. Rotating passwords and security keys closes that route.",
      "id": "h2q53"
    },
    {
      "sec": "Section A: DNS and domains",
      "type": "mcq",
      "text": "A customer's domain expired yesterday and their site and email are down. What do you tell them first?",
      "opts": [
        "Wait a week and it will come back",
        "Buy a new domain name",
        "Renew the domain right away; services return once the registry and DNS update, and any grace period is short",
        "Move hosting provider"
      ],
      "correct": 2,
      "explain": "Expired domains stop resolving. Most registries allow a short grace period, after which recovery becomes expensive or impossible.",
      "id": "h2q54"
    },
    {
      "sec": "Section C: cPanel, Linux and server performance",
      "type": "mcq",
      "text": "A customer asks why their site is slow only between 9am and 10am each day. What is a likely cause to check?",
      "opts": [
        "Their SSL certificate",
        "A scheduled task such as a backup or cron job running at that time, competing for resources",
        "Their MX records",
        "Their domain registrar"
      ],
      "correct": 1,
      "explain": "Time-bound slowness points to something scheduled. Check cron jobs and backup schedules.",
      "id": "h2q55"
    },
    {
      "sec": "Section D: WordPress and SSL",
      "type": "mcq",
      "text": "A customer's site loads over http but shows 'too many redirects' after SSL is enabled. What is a common cause?",
      "opts": [
        "The certificate is from the wrong country",
        "The DNS TTL is too low",
        "Conflicting redirect rules, for example in .htaccess and in WordPress settings, sending the browser in a loop",
        "The mailbox is full"
      ],
      "correct": 2,
      "explain": "Redirect loops come from two layers both forcing a redirect. Remove the duplicate rule.",
      "id": "h2q56"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "A customer emails: 'Our emails to clients have been going to spam for two days and we are losing business. What is going on?' Your checks show their SPF record lists their old host, not GoLive. Write your reply.",
      "sub": "Explain the cause and the fix in plain language a non-technical business owner will understand, say when it will be resolved, and keep it professional. Aim for five to eight sentences.",
      "placeholder": "Dear Mrs Adebayo, thank you for letting us know...",
      "id": "h2q57"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "You are about to perform emergency maintenance on a server hosting 40 customer websites, which will cause about 20 minutes of downtime tonight at 11pm. Write the notice to affected customers.",
      "sub": "Include what is happening, when, the expected impact, and how they will know it is complete. Keep it calm and clear. Aim for five to eight sentences.",
      "placeholder": "Dear valued customer, we are writing to let you know...",
      "id": "h2q58"
    }
  ],
  "Sales & Support Associate": [
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A 40-person accounting firm wants the desktop Office apps and business email, and its partners want their laptops managed and protected, since staff carry client financial records. Which single plan is the correct starting recommendation?",
      "opts": [
        "Microsoft 365 Business Standard, with Defender for Business added later if budget allows",
        "Microsoft 365 Business Premium, which includes desktop apps, Intune device management and Defender for Business",
        "Microsoft 365 Business Basic for everyone, plus Business Premium for the partners only",
        "Microsoft 365 Apps for Business, with Exchange Online Plan 1 for mailboxes"
      ],
      "correct": 1,
      "explain": "Device management and threat protection for a firm handling client financial data is the requirement, and Business Premium is the plan that carries Intune and Defender for Business. Standard has the apps but neither of those. Mixing Basic and Premium leaves most staff unprotected.",
      "id": "s2q01"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A prospect with 350 staff asks for Microsoft 365 Business Standard for everyone. What is the correct response?",
      "opts": [
        "Quote 350 Business Standard licences",
        "Explain that the Business plans are limited to 300 users per organisation and propose an Enterprise plan such as Microsoft 365 E3 for the organisation, or a split",
        "Quote 300 Business Standard and 50 Business Basic to stay under the limit",
        "Recommend two separate tenants of 175 users each"
      ],
      "correct": 1,
      "explain": "Business Basic, Standard and Premium share a combined cap of 300 licences per tenant. Splitting plans does not raise it. Two tenants would break collaboration and administration. Over 300 users is Enterprise territory.",
      "id": "s2q02"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A client wants Microsoft 365 Copilot for its 20 Business Standard users. What must be true before Copilot can be sold to them?",
      "opts": [
        "Nothing; Copilot is included in Business Standard",
        "They must first upgrade everyone to Business Premium",
        "Copilot is an add-on licence that needs a qualifying base plan such as Business Basic, Standard or Premium, so it can be added to their existing plan",
        "Copilot is only available on Enterprise E5"
      ],
      "correct": 2,
      "explain": "Copilot for Microsoft 365 is a separate add-on that sits on a qualifying base licence. Business Standard qualifies, so no upgrade is needed. It is not included in any plan and is not restricted to E5.",
      "id": "s2q03"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A 6-person NGO needs a shared address, info@, that three staff answer from, without paying for a fourth mailbox. What do you set up?",
      "opts": [
        "A fourth Business Basic licence for the info@ mailbox",
        "A shared mailbox, which needs no licence up to 50 GB, with the three staff given access",
        "A distribution list that forwards to all three",
        "An Exchange Online Plan 1 licence assigned to info@"
      ],
      "correct": 1,
      "explain": "A shared mailbox is free up to 50 GB and gives a common inbox and sent items, which a distribution list does not. A licence is only needed if the shared mailbox needs more than 50 GB or features such as an archive or litigation hold.",
      "id": "s2q04"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "Which plan gives a user the desktop versions of Word, Excel and PowerPoint but does not include a business email mailbox?",
      "opts": [
        "Microsoft 365 Business Basic",
        "Microsoft 365 Apps for Business",
        "Microsoft 365 Business Standard",
        "Exchange Online Plan 1"
      ],
      "correct": 1,
      "explain": "Apps for Business is the desktop apps plus OneDrive, with no Exchange mailbox. Basic has a mailbox but web and mobile apps only. Standard has both. Exchange Online Plan 1 is a mailbox only.",
      "id": "s2q05"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A school asks whether Teams can run online classes for 400 students across 20 teachers. Which licensing route is correct?",
      "opts": [
        "Business Premium for everyone, since it has the most features",
        "Microsoft 365 Education plans (A1, A3 or A5), which are licensed for education customers and include Teams for Education",
        "Teams Essentials for the teachers and nothing for students",
        "Business Basic for the teachers; students can join Teams as guests"
      ],
      "correct": 1,
      "explain": "Education institutions qualify for the Microsoft 365 Education plans, which are priced for education and include Teams for Education features such as class teams and assignments. Business plans are the wrong family for a school.",
      "id": "s2q06"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A client on Business Basic complains that Outlook on their laptop will not open their mailbox. What is the most likely explanation?",
      "opts": [
        "Their mailbox has been suspended for non-payment",
        "Business Basic does not include the desktop Outlook app; they should use Outlook on the web or the mobile app, or move to Business Standard",
        "Their DNS records are wrong",
        "Their laptop needs Windows 11"
      ],
      "correct": 1,
      "explain": "Basic includes web and mobile apps only. Desktop Outlook, Word and Excel come with Standard and Premium. Suspension or DNS faults would affect web access too.",
      "id": "s2q07"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A client using Google Workspace wants their email history, calendars and contacts moved to Microsoft 365. Which statement is accurate when scoping the work?",
      "opts": [
        "An IMAP migration moves email, calendars and contacts together",
        "Email moves over IMAP or the Google Workspace migration tool in the Exchange admin centre; calendars and contacts need the Google Workspace migration method or a manual export, because IMAP carries mail only",
        "Google Drive files migrate automatically when the domain is moved",
        "Nothing can be migrated; the client starts with empty mailboxes"
      ],
      "correct": 1,
      "explain": "IMAP moves mail only. The Google Workspace migration in the Exchange admin centre can bring mail, calendar and contacts; Drive files need a separate migration. Scoping this wrongly is how a migration ends up with missing calendars.",
      "id": "s2q08"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "Which of these is included in Microsoft 365 Business Premium but not in Business Standard?",
      "opts": [
        "Teams",
        "1 TB of OneDrive storage per user",
        "Microsoft Defender for Business and Intune",
        "Desktop Office apps"
      ],
      "correct": 2,
      "explain": "Both plans have Teams, 1 TB OneDrive and the desktop apps. Premium adds the security and device management layer: Defender for Business, Intune, Entra ID P1 with Conditional Access, and Purview information protection.",
      "id": "s2q09"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A client asks why the same Microsoft 365 plan costs more on a month-to-month term than on an annual term. What is the accurate explanation?",
      "opts": [
        "GoLive adds a handling fee to monthly terms",
        "Microsoft's monthly-term pricing carries a premium over the annual commitment, in exchange for the flexibility to cancel or reduce each month",
        "The monthly price includes VAT and the annual price does not",
        "There is no difference; the client has misread the proposal"
      ],
      "correct": 1,
      "explain": "Under Microsoft's New Commerce Experience, month-to-month terms cost more than annual commitments (typically about 20% more) because they can be cancelled or reduced monthly. Annual paid monthly costs the same as annual paid upfront, but cannot be reduced during the term.",
      "id": "s2q10"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "A client on an annual commitment, three months in, asks to reduce from 25 licences to 15 because two staff left. What is correct?",
      "opts": [
        "Reduce to 15 immediately; they only pay for what they use",
        "The annual commitment cannot be reduced mid-term; the licences can be reassigned to other staff, and the count can be reduced at renewal",
        "Reduce to 15 and charge a 50% cancellation fee",
        "Cancel the subscription and start a new one for 15"
      ],
      "correct": 1,
      "explain": "Annual commitments can be increased at any time but not reduced until renewal, apart from a short cancellation window right after purchase. The right advice is to reassign the licences and note the reduction for renewal.",
      "id": "s2q11"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "mcq",
      "text": "After a client buys 10 licences, they realise the next day that they chose Business Standard when they needed Business Premium. What is the best course?",
      "opts": [
        "Tell them they are committed for a year",
        "Use the short cancellation window that applies immediately after a New Commerce purchase to cancel or adjust, then place the correct order; check the window has not passed",
        "Add 10 Premium licences on top and leave the Standard ones running",
        "Contact Microsoft support on the client's behalf to swap the SKU free of charge"
      ],
      "correct": 1,
      "explain": "New Commerce subscriptions have a short cancellation window (seven days) after purchase with a pro-rated refund. Acting inside that window fixes the mistake at no cost. Running both plans doubles the bill.",
      "id": "s2q12"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "tf",
      "text": "A Microsoft 365 Business Basic licence allows a user to install Word, Excel and PowerPoint on their laptop.",
      "correct": "False",
      "explain": "Basic includes web and mobile apps only. Installable desktop apps come with Apps for Business, Business Standard and Business Premium.",
      "id": "s2q13"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "tf",
      "text": "Multi-factor authentication is available on every Microsoft 365 plan at no extra cost.",
      "correct": "True",
      "explain": "MFA is available on every plan at no extra cost, through security defaults or, on Premium and Enterprise plans, through Conditional Access.",
      "id": "s2q14"
    },
    {
      "sec": "Section A: Microsoft 365 licensing and products",
      "type": "tf",
      "text": "When a client's subscription is cancelled, their mailbox data is deleted immediately.",
      "correct": "False",
      "explain": "Microsoft retains the data for a period after cancellation (the subscription passes through disabled and then deprovisioned stages) before deletion. The client has time to export or renew, but should not rely on that window.",
      "id": "s2q15"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "On a first call, a hotel general manager says: \"Just tell me your cheapest email package.\" What is the strongest response?",
      "opts": [
        "Quote Business Basic on the spot; it is what they asked for",
        "Ask a few questions first: how many staff, whether they use shared devices at reception, whether guest data is handled, and what they use today, then recommend",
        "Explain that cheapest is a false economy and recommend Business Premium",
        "Send the full price list and let them choose"
      ],
      "correct": 1,
      "explain": "The cheapest email package for a hotel with shared front-desk PCs and guest data may be the wrong one, and quoting it commits you before you know. Qualifying takes two minutes and produces a recommendation the client can trust.",
      "id": "s2q16"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "A prospect is comparing GoLive with a competitor quoting a lower per-user price for the same Microsoft plan. Which response is both honest and commercially sound?",
      "opts": [
        "Match the price to win the deal",
        "Explain that the Microsoft licence is the same wherever it is bought, then set out what GoLive's price includes that a licence-only quote does not: migration, setup, local-currency invoicing and support, and ask what their quote includes",
        "Say the competitor is probably not an authorised partner",
        "Offer a 15% discount on the spot"
      ],
      "correct": 1,
      "explain": "The licence itself is identical; the difference is what surrounds it. Making that concrete and asking what the competitor includes reframes the comparison. Matching or discounting on the spot is outside your authority and undervalues the service.",
      "id": "s2q17"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "A prospect says: \"Our WhatsApp group works fine; why would we pay for Teams?\" Which is the most effective reply?",
      "opts": [
        "Teams is more professional than WhatsApp",
        "Ask what happens to a conversation when a staff member leaves, and to a document sent in the group six months ago, then show how Teams keeps company communication and files in the company's control",
        "Point out that WhatsApp is insecure",
        "Agree that WhatsApp is enough and focus on email"
      ],
      "correct": 1,
      "explain": "The gap WhatsApp cannot close is ownership: chats and files leave with the employee's phone. Asking those two questions makes the prospect discover the problem themselves, which persuades better than assertion.",
      "id": "s2q18"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "Which of these prospects should you spend the most time on this week?",
      "opts": [
        "A 3-person start-up asking for Business Basic, ready to buy today",
        "A 60-person logistics company that has asked for a proposal for Business Premium for all staff plus a migration from Google Workspace, with a decision expected this month",
        "A 20-person firm that asked for pricing four months ago and never replied",
        "A friend's 8-person business that wants a discount"
      ],
      "correct": 1,
      "explain": "Effort follows value and likelihood. The logistics company is the largest, has a stated need, and a decision date. The start-up should still be closed quickly, since it is easy, but not at the expense of the large opportunity.",
      "id": "s2q19"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "A prospect's IT person is enthusiastic, but the managing director has not been in any conversation. What should you do before sending the proposal?",
      "opts": [
        "Send the proposal to the IT person and let them sell it internally",
        "Ask the IT person who signs off spending of this size and request a short call that includes that person, so the proposal addresses what the decision-maker cares about",
        "Email the managing director directly without telling the IT person",
        "Reduce the price so the IT person can approve it alone"
      ],
      "correct": 1,
      "explain": "Deals stall when the economic buyer has never been in the room. Involving them through the champion, rather than around them, keeps the IT person onside and gives the proposal a real audience.",
      "id": "s2q20"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "A prospect asks a technical question you cannot answer with certainty: whether a specific legacy accounting application will work with the new setup. What do you do?",
      "opts": [
        "Say yes; most things work",
        "Say you will confirm with the technical team and give a time by which you will come back, then do so",
        "Say no to be safe",
        "Suggest they test it themselves after buying"
      ],
      "correct": 1,
      "explain": "A confident wrong answer becomes a broken promise. Committing to a time to come back, and keeping it, builds more trust than guessing. Saying no loses a deal you might have won.",
      "id": "s2q21"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "A proposal was sent 6 days ago. GoLive proposals are valid for 5 days, and the prospect has not replied. What is the right follow-up?",
      "opts": [
        "Wait; chasing looks desperate",
        "Call, ask whether they have any questions, and let them know the proposal has expired and you can reissue it at current pricing if they are ready to proceed",
        "Send the same proposal again with a discount",
        "Mark the lead as lost"
      ],
      "correct": 1,
      "explain": "A call surfaces the real objection, which email rarely does. The expiry is a reason to talk, not a threat: pricing moves with the exchange rate, so reissuing is a genuine service. Discounting unprompted trains prospects to wait.",
      "id": "s2q22"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "A church with 15 staff and 200 volunteers asks for Microsoft 365. What qualifying question matters most before you recommend a plan?",
      "opts": [
        "Whether they prefer Outlook or Gmail",
        "Whether they are a registered non-profit, since Microsoft offers non-profit pricing, and which of the 215 people actually need a licensed mailbox rather than occasional access",
        "Which bank they use",
        "How many laptops they own"
      ],
      "correct": 1,
      "explain": "Eligibility for non-profit pricing changes the cost substantially, and the licence count depends on who needs a mailbox; volunteers often do not. Both questions shape the proposal more than anything else.",
      "id": "s2q23"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "A prospect says they will decide after the end of their financial year in two months. What is the best next step?",
      "opts": [
        "Close the lead and re-open it in two months",
        "Agree a specific follow-up date, ask what would need to be true for them to proceed then, and offer a small, useful step in the meantime, such as a licence audit of what they use today",
        "Call weekly until they decide",
        "Offer a discount for signing now"
      ],
      "correct": 1,
      "explain": "A dated next step keeps the deal alive without pressure, and a useful interim step keeps you in the conversation. Weekly calls annoy; discounts for artificial urgency erode margin.",
      "id": "s2q24"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "mcq",
      "text": "During a call, a prospect volunteers that they process patients' medical records. Which recommendation follows?",
      "opts": [
        "Business Basic, to keep costs down for a clinic",
        "Business Premium, because the data loss prevention, device management and encryption features protect sensitive personal data, which the NDPA treats as requiring stronger safeguards",
        "Any plan, since Microsoft is secure by default",
        "Advise them to keep medical records on paper"
      ],
      "correct": 1,
      "explain": "Health data is sensitive personal data under the NDPA 2023. Premium's protection features are the substantive answer. This is also a moment to note it for the proposal narrative, since it justifies the plan.",
      "id": "s2q25"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "tf",
      "text": "A prospect who says 'it is too expensive' is usually telling you that they do not yet see enough value, not that they cannot pay.",
      "correct": "True",
      "explain": "Price objections are most often value objections. The productive response is to revisit what the package includes and what problem it solves, not to reach for a discount.",
      "id": "s2q26"
    },
    {
      "sec": "Section B: Consultative selling and qualification",
      "type": "tf",
      "text": "Once a client has signed and paid, the Associate's involvement ends and the client is handed to Microsoft.",
      "correct": "False",
      "explain": "GoLive remains the client's partner: support, renewals, licence changes and upsell all run through GoLive. The relationship after signature is where recurring revenue and commission come from.",
      "id": "s2q27"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "A GoLive proposal for 8 users of Standard Cloud Office shows a monthly total of N178,467 excluding VAT. What is the total including VAT?",
      "opts": [
        "N178,467, because software is VAT-exempt",
        "N191,852",
        "N196,314",
        "N187,390"
      ],
      "correct": 1,
      "explain": "VAT in Nigeria is 7.5%: 178,467 multiplied by 1.075 is 191,852. Software licences and services are not VAT-exempt.",
      "id": "s2q28"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "A prospect asks for 10% off to sign today. You believe the deal is winnable. What do you do?",
      "opts": [
        "Give the discount; 90% of a deal is better than none",
        "Say you are not able to authorise a discount yourself, ask what would make the decision today apart from price, and take the request to the Managing Director for a written decision",
        "Offer 5% as a compromise",
        "Tell them GoLive never discounts"
      ],
      "correct": 1,
      "explain": "Under the Commission and Bonus Addendum, no discount, credit term or special pricing may be promised without the MD's written approval. Exploring what else matters often removes the need for a discount; if not, the MD decides.",
      "id": "s2q29"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "A client on a monthly commitment asks why GoLive invoices the first three months in advance. What is the accurate answer?",
      "opts": [
        "It is a Microsoft rule",
        "It is GoLive's standard first payment for monthly commitments, stated on the proposal, which covers the setup period and reduces payment risk on new accounts; thereafter billing is monthly",
        "It is negotiable if they ask nicely",
        "It is a deposit that is refunded after a year"
      ],
      "correct": 1,
      "explain": "The three-months-in-advance first payment is GoLive's own term, printed on every monthly-commitment proposal. Presenting it as policy, with the reason, keeps it from becoming a negotiation.",
      "id": "s2q30"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "Your proposal quoted Naira at the exchange rate on the day it was issued. Eight days later the client wants to pay, and the Naira has weakened noticeably. What is correct?",
      "opts": [
        "Accept the old Naira figure; a quote is a quote",
        "The proposal expired after 5 days, so it is reissued at the current rate; explain that GoLive's costs are in dollars and the validity period protects both sides",
        "Charge the difference on the next invoice without telling them",
        "Refuse the sale"
      ],
      "correct": 1,
      "explain": "The 5-day validity exists precisely for exchange-rate movement. Honouring an expired quote at a worse rate erodes the margin the business runs on; reissuing, with the reason, is the honest course.",
      "id": "s2q31"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "A client emails asking for a copy of GoLive's Microsoft distributor cost price so they can see the margin. What do you do?",
      "opts": [
        "Send it; transparency builds trust",
        "Decline politely: distributor pricing is confidential commercial information, and explain that GoLive's proposal states what the client pays and what it includes",
        "Send a rounded figure",
        "Ask the MD to send it"
      ],
      "correct": 1,
      "explain": "Distributor cost and margin structure are Proprietary Information under the confidentiality agreement every employee signs. The client is entitled to their price, not GoLive's cost.",
      "id": "s2q32"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "A client verbally agrees to 12 licences of Secure Business Cloud. What must happen before you record the deal as won?",
      "opts": [
        "Nothing; a verbal yes is a sale",
        "The proposal must be accepted, payment received, and the licences provisioned; until then it is at the negotiating or quote-sent stage in the CRM",
        "Move it to won so the pipeline looks healthy",
        "Ask the client to confirm on WhatsApp"
      ],
      "correct": 1,
      "explain": "Won means paid and activated. Recording it earlier misstates the pipeline, and the commission scheme only recognises a sale once payment is received and the service is delivered.",
      "id": "s2q33"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "Why does GoLive calculate commission on gross profit rather than on revenue?",
      "opts": [
        "To pay staff less",
        "Because the Microsoft licence cost passes through to the distributor; only the margin and services are GoLive's earnings, so commission on revenue would reward selling at no profit",
        "Because Microsoft requires it",
        "Because revenue is harder to measure"
      ],
      "correct": 1,
      "explain": "A sale at a discount that wipes out the margin earns the company nothing. Commission on gross profit aligns the Associate with profitable deals and with the service components that carry the best margin.",
      "id": "s2q34"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "mcq",
      "text": "A prospect asks you to confirm in writing that migration will be complete within 48 hours of payment. You believe it usually is. What do you do?",
      "opts": [
        "Confirm it; it is usually true",
        "Do not commit to a timeline in writing without the MD's approval; say the typical timeline, note that it depends on the source system and the DNS cutover window, and confirm the plan after technical review",
        "Promise 24 hours to win the deal",
        "Say migrations take a week to be safe"
      ],
      "correct": 1,
      "explain": "The Addendum bars committing the company to implementation timelines or guarantees without written approval. 'Usually' is not a promise; state the typical case honestly and let the plan set the date.",
      "id": "s2q35"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "tf",
      "text": "GoLive charges in Naira; the US dollar figure on a proposal is shown for reference only.",
      "correct": "True",
      "explain": "Naira is the charging currency; the dollar figure is shown for reference at the day's rate. The proposal states the currency the client pays in.",
      "id": "s2q36"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "tf",
      "text": "A discount agreed verbally with a client is binding on GoLive once the client relies on it.",
      "correct": "False",
      "explain": "The Associate has no authority to grant discounts, so a verbal promise does not bind the company; but it does damage trust when withdrawn. That is why the rule is never to make one.",
      "id": "s2q37"
    },
    {
      "sec": "Section C: Pricing, proposals and commercial discipline",
      "type": "tf",
      "text": "Renewals actively managed by the Associate can earn commission after the first year.",
      "correct": "True",
      "explain": "The post-confirmation schedule pays a percentage of gross profit on renewals the Associate actively manages, which is why keeping in touch with clients before renewal matters.",
      "id": "s2q38"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "A client emails at 9:10 that 'email is down for everyone'. You cannot fix it yourself. What is the right first action?",
      "opts": [
        "Forward the email to the technical team and wait",
        "Reply within minutes to acknowledge, say it is being investigated, ask two or three clarifying questions (all users or some, since when, any error message), and tell them when you will next update them; then escalate with those details",
        "Tell them to restart their computers",
        "Wait until you have a fix, then reply"
      ],
      "correct": 1,
      "explain": "Silence is the worst part of an outage for a client. Acknowledging fast, gathering the details the engineers need, and committing to an update time turns a crisis into a managed incident, even before anything is fixed.",
      "id": "s2q39"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "The client's outage turns out to be caused by their own domain registrar deleting the MX record. Whose fault is it, and what do you say?",
      "opts": [
        "Tell the client it is their fault and close the ticket",
        "Explain what happened plainly and without blame, help them restore the record or do it with them, and suggest how to prevent it, such as locking the DNS records",
        "Fix it silently and say nothing",
        "Bill them for the time"
      ],
      "correct": 1,
      "explain": "The client wants their email back and to understand why it broke. Cause without blame, a fix, and a prevention step is what a partner does. Whether to bill is the MD's decision, not the Associate's.",
      "id": "s2q40"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "A migration you quoted as two days took five, and the client is angry. Which reply is best?",
      "opts": [
        "Explain that migrations are unpredictable",
        "Apologise for the delay without excuses, say what caused it and what has been done to finish it, confirm the current status, and say what GoLive will do differently; then ask the MD whether any goodwill gesture is appropriate",
        "Offer a refund immediately",
        "Point out that the contract does not guarantee a timeline"
      ],
      "correct": 1,
      "explain": "Service recovery is apology, explanation, status and prevention, in that order. Refunds and credits are for the MD to decide. Citing the contract at an angry client ends the relationship.",
      "id": "s2q41"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "A client asks you to reset the password on their managing director's mailbox because 'he is travelling and cannot get in'. What do you do?",
      "opts": [
        "Reset it and send the new password by WhatsApp",
        "Do not reset it on a third party's request; verify with the account holder directly through a known channel, or route the request through the client's own designated admin contact, and log it",
        "Reset it if the caller sounds genuine",
        "Refuse and end the call"
      ],
      "correct": 1,
      "explain": "This is exactly how account takeovers happen. Password changes go to the account holder through a verified channel or to the client's authorised admin, never on a colleague's say-so. Logging it protects everyone.",
      "id": "s2q42"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "You receive four support requests at once: a new-user setup due tomorrow, a client who cannot send email, a request for an invoice copy, and a question about adding Copilot. In what order do you handle them?",
      "opts": [
        "In the order received",
        "Cannot send email first, since it stops work; the invoice copy next because it takes two minutes; then the new-user setup; then the Copilot question, which is a sales conversation to schedule",
        "Copilot first, since it is a sales opportunity",
        "New-user setup first, since it has a deadline"
      ],
      "correct": 1,
      "explain": "Triage by impact and effort: stop the bleeding, clear what is trivial, then the dated work, then the conversation that deserves proper time. Chasing the sales opportunity while a client cannot work damages the account you already have.",
      "id": "s2q43"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "A client's SLA is a 95% response rate within the agreed time. Which practice most reliably protects it?",
      "opts": [
        "Replying to everything with 'noted' immediately",
        "A short acknowledgement to every request on receipt, with an expected time for a full answer, logged in the CRM, so nothing sits unanswered even when the answer takes longer",
        "Working late on Fridays",
        "Asking clients to phone instead of emailing"
      ],
      "correct": 1,
      "explain": "Response is not resolution. An acknowledgement with an expected time meets the SLA, sets expectations, and creates the record the month-end SLA check is made against.",
      "id": "s2q44"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "A client's staff member says the new Outlook 'lost' folders that existed in Gmail. Before escalating, what is the most useful thing to check?",
      "opts": [
        "Whether they have paid this month",
        "Whether the folders were Gmail labels that migrated but are collapsed or under a different parent, and whether the migration report lists them, so the escalation carries facts rather than 'folders lost'",
        "Whether they restarted Outlook",
        "Nothing; escalate immediately"
      ],
      "correct": 1,
      "explain": "Gmail labels become folders on migration and are often present but not where the user expects. Checking the report and the folder tree resolves many cases outright and makes the rest a precise escalation.",
      "id": "s2q45"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "mcq",
      "text": "A long-standing client mentions in passing that they are 'looking at options' for next year's renewal. What do you do?",
      "opts": [
        "Nothing; renewals are automatic",
        "Treat it as a live retention risk: log it in the CRM, ask what is prompting the review, book a proper conversation before the renewal date, and tell the MD",
        "Offer a discount immediately",
        "Wait for them to raise it formally"
      ],
      "correct": 1,
      "explain": "A renewal remark is a signal, and renewals the Associate actively manages carry commission. Understanding the cause early is how a renewal is saved; a reflex discount is neither necessary nor within authority.",
      "id": "s2q46"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "tf",
      "text": "It is acceptable to tell a client a problem is fixed once the ticket has been passed to the technical team.",
      "correct": "False",
      "explain": "Passed on is not fixed. Telling the client it is resolved before it is destroys credibility the first time it fails again. Report status accurately and confirm resolution with the client.",
      "id": "s2q47"
    },
    {
      "sec": "Section D: Customer support and service recovery",
      "type": "tf",
      "text": "Every support interaction, including phone calls, should be logged in the CRM.",
      "correct": "True",
      "explain": "The CRM is the record the company runs on: SLA performance, testimonials, commission attribution and renewals are all verified from it. A call that is not logged did not happen, as far as the records show.",
      "id": "s2q48"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "You receive an email that appears to be from Microsoft Partner Center saying GoLive's CSP account will be suspended unless you sign in through the link within 24 hours. What do you do?",
      "opts": [
        "Sign in quickly; suspension would be serious",
        "Do not click; report it to the MD and the technical team, and check Partner Center by typing the address yourself, since urgency plus a link is the standard phishing pattern",
        "Reply asking whether it is genuine",
        "Forward it to the client"
      ],
      "correct": 1,
      "explain": "Urgency, a threat and a link are the signature of phishing. Partner credentials give access to every client tenant, so the stakes are higher than a personal account. Check through a known route, never the link.",
      "id": "s2q49"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "A client sends you their staff list with names, phone numbers and salary bands to help size a proposal. Where may it be stored?",
      "opts": [
        "Your personal Gmail, so you can work on it at home",
        "GoLive's own systems only, such as the CRM or company OneDrive, with access limited to those who need it; it is personal data GoLive now processes under the NDPA",
        "A WhatsApp group with the technical team",
        "Anywhere convenient; it is the client's data, not GoLive's"
      ],
      "correct": 1,
      "explain": "Once received, GoLive is processing personal data and is accountable for it. The confidentiality agreement and NDPA both require it to stay in company systems with limited access. Personal email and WhatsApp are prohibited.",
      "id": "s2q50"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "Under the Nigeria Data Protection Act 2023, what is the correct action if a client's personal data held by GoLive is accessed by an unauthorised person?",
      "opts": [
        "Fix the gap quietly and say nothing",
        "Report it to the MD immediately; GoLive must assess it and, where required, notify the Nigeria Data Protection Commission within 72 hours and inform affected data subjects",
        "Tell the client only if they ask",
        "Post a notice on the website"
      ],
      "correct": 1,
      "explain": "The NDPA sets a 72-hour notification duty to the Commission for breaches that are likely to cause harm, and a duty to inform affected individuals. That decision is the MD's, which is why it must reach the MD at once.",
      "id": "s2q51"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "A client asks you to give their new IT contractor global admin rights on their Microsoft 365 tenant 'for the afternoon'. What is correct?",
      "opts": [
        "Grant it; it is their tenant",
        "Confirm the request with the client's authorised contact, grant the minimum role needed for the task rather than global admin, and remove it when the work is done, with the change logged",
        "Refuse; contractors should never have access",
        "Give them GoLive's own admin login instead"
      ],
      "correct": 1,
      "explain": "Least privilege and time-limited access are the rule. Global admin can delete the tenant. Sharing GoLive's partner credentials is never acceptable; a compromised partner login exposes every client.",
      "id": "s2q52"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "A prospect offers you N50,000 personally to 'make sure the discount goes through'. What do you do?",
      "opts": [
        "Accept it; it is a private matter",
        "Decline, explain that pricing decisions are not yours to make, and report the offer to the MD in writing",
        "Decline but say nothing",
        "Accept it and pass it to GoLive as a deposit"
      ],
      "correct": 1,
      "explain": "This is an attempted bribe. Declining is necessary; reporting it protects you if the prospect later claims you accepted, and lets the company decide how to handle the account.",
      "id": "s2q53"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "You are leaving GoLive. Which of these may you take with you?",
      "opts": [
        "The client list, since you built the relationships",
        "A copy of the pricing catalogue for reference",
        "Your personal copies of your payslips and employment documents",
        "The proposal templates"
      ],
      "correct": 2,
      "explain": "The confidentiality agreement permits personal copies of compensation and employment records. Client lists, pricing and templates are Proprietary Information and must be returned. Taking them is a breach with legal consequences.",
      "id": "s2q54"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "A client wants to know where their Microsoft 365 data is physically stored, because their board asked about data leaving Nigeria. What is the accurate answer?",
      "opts": [
        "All data stays on servers in Lagos",
        "Data is held in Microsoft's cloud regions outside Nigeria; the NDPA permits cross-border transfer where adequate safeguards apply, and Microsoft's terms and certifications provide those; offer to share Microsoft's data location documentation",
        "The data is stored on GoLive's server",
        "Nobody knows where cloud data is kept"
      ],
      "correct": 1,
      "explain": "Microsoft has no Nigerian datacentre region. Honesty here matters: the correct answer is about safeguards under the NDPA, backed by Microsoft's documentation, not a false claim of local storage.",
      "id": "s2q55"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "mcq",
      "text": "A colleague asks to borrow your portal login because theirs is locked. What do you do?",
      "opts": [
        "Share it; you trust them",
        "Do not share it; help them reset their own access through the MD, since every action in the portal is attributed to the account that performed it",
        "Share it but change the password afterwards",
        "Log in for them and leave the session open"
      ],
      "correct": 1,
      "explain": "Credentials are personal by policy and by the confidentiality agreement. Shared logins break the audit trail that commission attribution, SLA records and security investigations depend on.",
      "id": "s2q56"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "tf",
      "text": "It is acceptable to discuss a client's proposal figures with a friend who works at a competitor, as long as no documents are shared.",
      "correct": "False",
      "explain": "Proposal figures, pricing and client information are Proprietary Information whether written or spoken. Disclosure is a breach of the confidentiality agreement.",
      "id": "s2q57"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "tf",
      "text": "Under the NDPA, personal data about a prospect should not be kept for longer than the purpose it was collected for requires.",
      "correct": "True",
      "explain": "The NDPA requires data to be kept no longer than needed for its purpose. Prospect data should follow GoLive's retention practice and be removed when the purpose lapses.",
      "id": "s2q58"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "tf",
      "text": "If you accidentally send a proposal to the wrong client, the correct action is to tell the MD at once rather than hoping it goes unnoticed.",
      "correct": "True",
      "explain": "A misdirected document is a data incident. Reporting it immediately allows recall, an apology, and an assessment of whether it must be reported; hiding it makes a small problem a serious one.",
      "id": "s2q59"
    },
    {
      "sec": "Section E: Security, data protection and conduct",
      "type": "tf",
      "text": "Using a personal AI tool to draft a client email is fine if the client's name and figures are pasted in for accuracy.",
      "correct": "False",
      "explain": "Pasting client data into a personal tool sends it outside GoLive's systems, which the confidentiality agreement prohibits. Draft without the identifying details, or use only company-approved tools.",
      "id": "s2q60"
    },
    {
      "sec": "Section F: Written answers",
      "type": "text",
      "text": "A prospect, a 15-person law firm, emails: \"Your proposal is N40,000 a month more than another partner quoted for the same Microsoft licences. Match it or we will go with them.\" Write your reply email.",
      "sub": "Write clearly and professionally, in the way you would actually send it. Stay within your authority; do not offer a discount. Aim for five to eight sentences.",
      "placeholder": "Dear Mr Adeyemi, thank you for coming back to me...",
      "id": "s2q61"
    },
    {
      "sec": "Section F: Written answers",
      "type": "text",
      "text": "A client's migration to Microsoft 365 has slipped by three days and their staff cannot yet send email from the new system. Write the update you would send to the client's managing director this morning.",
      "sub": "Be honest about the status without making excuses. Say what is being done, when they will next hear from you, and do not promise a completion time you cannot guarantee. Aim for five to eight sentences.",
      "placeholder": "Dear Mrs Okafor, I am writing to update you on...",
      "id": "s2q62"
    }
  ],
  "Administrative Assistant": [
    {
      "sec": "Section A: Diary and time management",
      "type": "mcq",
      "text": "The MD works from a time zone five hours behind Lagos. A Lagos client asks for a meeting at 9am Lagos time. What should you do?",
      "opts": [
        "Book 9am; the client asked for it",
        "Book it and tell the MD to join at 4am",
        "Ask the client to call the MD directly",
        "Propose a time that falls in both working days, such as 2pm or 3pm Lagos time, and show both local times in the invitation"
      ],
      "correct": 3,
      "explain": "Good diary management protects the MD's working hours and makes the time unambiguous for everyone by stating both zones.",
      "id": "a2q01"
    },
    {
      "sec": "Section A: Diary and time management",
      "type": "mcq",
      "text": "Two meetings are requested for the same slot: the company's bank relationship manager about a facility renewal, and a supplier wanting to introduce a new product. Which do you give the slot to?",
      "opts": [
        "Whoever asked first",
        "The supplier, as it might save money",
        "Both, as a joint meeting",
        "The bank facility renewal, since it has a deadline and financial consequence; offer the supplier another time"
      ],
      "correct": 3,
      "explain": "Prioritise by consequence and deadline, not by order of request.",
      "id": "a2q02"
    },
    {
      "sec": "Section A: Diary and time management",
      "type": "mcq",
      "text": "The MD's diary has back-to-back meetings from 9am to 5pm. What should an assistant build in?",
      "opts": [
        "More meetings in the gaps",
        "Nothing; a full diary shows productivity",
        "Short buffers between meetings and a protected block for preparation and follow-up",
        "Lunch meetings only"
      ],
      "correct": 2,
      "explain": "Back-to-back diaries leave no time to prepare or act on decisions. Buffers keep meetings useful.",
      "id": "a2q03"
    },
    {
      "sec": "Section A: Diary and time management",
      "type": "mcq",
      "text": "A meeting the MD must attend is moved at short notice. What is the complete response?",
      "opts": [
        "Update the calendar only",
        "Tell the MD only",
        "Wait for the MD to notice",
        "Update the calendar, inform all attendees, move any linked preparation, and tell the MD what changed and why"
      ],
      "correct": 3,
      "explain": "A reschedule has knock-on effects. Closing every loop prevents confusion.",
      "id": "a2q04"
    },
    {
      "sec": "Section A: Diary and time management",
      "type": "mcq",
      "text": "The MD asks you to 'keep Friday afternoon clear'. A senior client asks for Friday at 3pm. What do you do?",
      "opts": [
        "Book it; the client is senior",
        "Refuse the client outright",
        "Book it and tell the MD afterwards",
        "Offer the client other times first; if only Friday works, ask the MD before booking"
      ],
      "correct": 3,
      "explain": "A standing instruction holds unless the MD changes it. Asking is quicker than repairing a broken commitment.",
      "id": "a2q05"
    },
    {
      "sec": "Section A: Diary and time management",
      "type": "mcq",
      "text": "Which tool in Outlook helps most when booking a meeting for several busy managers?",
      "opts": [
        "The Scheduling Assistant, showing everyone's availability side by side",
        "An out-of-office reply",
        "A distribution list",
        "The Rules wizard"
      ],
      "correct": 0,
      "explain": "It avoids long email exchanges by showing free and busy times directly.",
      "id": "a2q06"
    },
    {
      "sec": "Section A: Diary and time management",
      "type": "tf",
      "text": "A calendar invitation should state the purpose of the meeting and what attendees should prepare, not only the time.",
      "correct": "True",
      "explain": "Purpose and preparation make meetings shorter and more productive.",
      "id": "a2q07"
    },
    {
      "sec": "Section A: Diary and time management",
      "type": "tf",
      "text": "When the MD travels across time zones, calendar entries should be adjusted so appointments still show at the correct local time.",
      "correct": "True",
      "explain": "Outlook converts time zones automatically if entries are created correctly; checking avoids missed meetings.",
      "id": "a2q08"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "mcq",
      "text": "The MD receives 120 emails a day. What is the most useful way to help?",
      "opts": [
        "Forward all 120 with no comment",
        "Delete anything that looks unimportant",
        "Reply to everything in the MD's name",
        "Sort and summarise daily: what needs the MD's decision, what you can handle or delegate, and what is for information only"
      ],
      "correct": 3,
      "explain": "The assistant's value is filtering and framing, so the MD spends time only on what needs the MD.",
      "id": "a2q09"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "mcq",
      "text": "You draft a reply for the MD to a regulator's letter. What must happen before it is sent?",
      "opts": [
        "Send it if it seems accurate",
        "Send it and copy the MD",
        "The MD reviews and approves it; anything in the MD's name, especially to a regulator, needs explicit approval",
        "Ask a colleague to check and send it"
      ],
      "correct": 2,
      "explain": "Official correspondence commits the company. Drafting is your role; approval is the MD's.",
      "id": "a2q10"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "mcq",
      "text": "Which is the most professional opening for a formal letter to a government agency?",
      "opts": [
        "'Hi there,'",
        "'Dear Sir or Madam,' or the named officer's title, followed by a subject line stating the matter and reference number",
        "'To whom it may concern' with no subject",
        "'Good day, hope you are well' as the only opening"
      ],
      "correct": 1,
      "explain": "A formal salutation and a clear subject with the reference number make the letter easy to route and answer.",
      "id": "a2q11"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "mcq",
      "text": "An email thread about a supplier dispute has 18 replies. The MD asks 'what is the position?'. What do you send?",
      "opts": [
        "The full thread",
        "Your personal opinion of the supplier",
        "A reply saying 'it is complicated'",
        "A short summary: the issue, what each side has said, what is agreed, what is outstanding, and the decision needed"
      ],
      "correct": 3,
      "explain": "Summaries save the MD reading 18 emails and lead straight to the decision.",
      "id": "a2q12"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "mcq",
      "text": "Which sentence is written in a clear, professional register?",
      "opts": [
        "'Pls see attached, revert asap!!'",
        "'Attached herewith please find enclosed the agreement which is attached.'",
        "'FYI the thing we talked about.'",
        "'Please find attached the signed agreement. Kindly confirm receipt by Friday.'"
      ],
      "correct": 3,
      "explain": "Clear, courteous and specific. Avoid slang, abbreviations and redundant phrasing.",
      "id": "a2q13"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "mcq",
      "text": "A caller insists on speaking to the MD immediately but will not say why. What do you do?",
      "opts": [
        "Put them through to the MD's personal phone",
        "Hang up",
        "Politely explain the MD is unavailable, take their name, number and purpose, and say you will pass the message on",
        "Give them the MD's personal number"
      ],
      "correct": 2,
      "explain": "Gatekeeping protects the MD's time and privacy. A proper message is passed on promptly.",
      "id": "a2q14"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "tf",
      "text": "Proofreading names, dates and figures in a letter is more important than its formatting.",
      "correct": "True",
      "explain": "A wrong name, date or amount can cause real harm; formatting problems are cosmetic.",
      "id": "a2q15"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "tf",
      "text": "It is acceptable to sign the MD's name on routine letters without asking, if it saves time.",
      "correct": "False",
      "explain": "Only the MD, or someone they have authorised in writing, signs in the MD's name.",
      "id": "a2q16"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "What should a briefing pack for the MD's meeting with a potential partner include?",
      "opts": [
        "The purpose and desired outcome, background on the organisation and attendees, key figures, open issues, and suggested questions",
        "Only the meeting time",
        "The partner's entire website printed out",
        "Minutes from unrelated meetings"
      ],
      "correct": 0,
      "explain": "A good brief lets the MD walk in prepared in five minutes.",
      "id": "a2q17"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "After a management meeting, three managers each agreed to deliver something by Friday. What is your role?",
      "opts": [
        "Nothing; they are managers",
        "Record each action with its owner and date in the tracker, send a reminder before Friday, and report to the MD what is done and what is late",
        "Do the three tasks yourself",
        "Remind them every hour"
      ],
      "correct": 1,
      "explain": "Following up agreed actions is the oversight support an MD relies on. It turns decisions into results.",
      "id": "a2q18"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "A manager misses a deadline recorded in the action tracker for the second time. What do you do?",
      "opts": [
        "Tell other staff about it",
        "Ask them for a revised date and any obstacle, update the tracker, and flag it factually to the MD",
        "Remove the action from the tracker",
        "Reprimand the manager yourself"
      ],
      "correct": 1,
      "explain": "The assistant surfaces facts for the MD; performance matters are the MD's to address.",
      "id": "a2q19"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "What is the best format for tracking actions from many meetings?",
      "opts": [
        "Notes scattered across emails",
        "A separate document per meeting nobody revisits",
        "One tracker listing each action, owner, due date, status and source meeting, reviewed weekly with the MD",
        "Memory"
      ],
      "correct": 2,
      "explain": "A single tracker makes status visible and nothing is lost between meetings.",
      "id": "a2q20"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "Minutes of a board meeting should be:",
      "opts": [
        "A word-for-word transcript",
        "A summary of the chair's opinions",
        "Accurate, neutral records of decisions and actions, approved at the next meeting and filed securely",
        "Shared publicly on social media"
      ],
      "correct": 2,
      "explain": "Board minutes are official records. Accuracy, neutrality and secure filing matter.",
      "id": "a2q21"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "The MD asks for a weekly one-page update. What belongs on it?",
      "opts": [
        "Every email received",
        "Staff birthdays",
        "Decisions needed, deadlines in the coming fortnight, overdue actions, and notable changes since last week",
        "The same text every week"
      ],
      "correct": 2,
      "explain": "One page of exceptions and decisions is more useful than a full account of activity.",
      "id": "a2q22"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "tf",
      "text": "A meeting that ends without agreed actions, owners and dates is likely to need repeating.",
      "correct": "True",
      "explain": "Without clear actions, nothing moves and the same discussion recurs.",
      "id": "a2q23"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "tf",
      "text": "An assistant should only follow up actions if the MD asks each time.",
      "correct": "False",
      "explain": "Routine follow-up of agreed actions is part of the role; the MD should not have to request it.",
      "id": "a2q24"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "mcq",
      "text": "What is a compliance calendar?",
      "opts": [
        "The MD's holiday plan",
        "A list of public holidays",
        "A marketing content plan",
        "A schedule of every statutory filing, licence, permit and contract renewal date, with reminders set well before each deadline"
      ],
      "correct": 3,
      "explain": "Missing a statutory deadline can bring penalties. A calendar with early reminders prevents it.",
      "id": "a2q25"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "mcq",
      "text": "The company's annual return must be filed with the Corporate Affairs Commission. When should the reminder be set?",
      "opts": [
        "Several weeks before the deadline, so documents and approvals can be gathered in time",
        "On the deadline day",
        "The day after the deadline",
        "Only if the MD asks"
      ],
      "correct": 0,
      "explain": "Filings need information from several people. Early reminders allow for delays.",
      "id": "a2q26"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "mcq",
      "text": "Which file name follows good records practice?",
      "opts": [
        "minutes.pdf",
        "new minutes FINAL (2).pdf",
        "scan001.pdf",
        "2026-10-05_BoardMinutes_Q3_Approved.pdf"
      ],
      "correct": 3,
      "explain": "A date-first, descriptive name sorts correctly and shows the content and status.",
      "id": "a2q27"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "mcq",
      "text": "A signed contract, an original certificate and an insurance policy arrive. How should they be kept?",
      "opts": [
        "Left in the MD's inbox",
        "Scanned to the agreed secure folder with standard names, originals stored securely, and their key dates added to the calendar",
        "Kept in your desk drawer only",
        "Photographed on your phone"
      ],
      "correct": 1,
      "explain": "Official documents need a findable digital copy, a safe original and their dates tracked.",
      "id": "a2q28"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "mcq",
      "text": "The company's Microsoft 365 and domain subscriptions renew on different dates. Where should these be tracked?",
      "opts": [
        "In the compliance calendar alongside licences and filings, with the renewal owner and cost",
        "Nowhere; they renew automatically",
        "Only in the bank statement",
        "In your personal notes"
      ],
      "correct": 0,
      "explain": "Automatic renewals still need tracking: failed payments and unwanted renewals both cost money.",
      "id": "a2q29"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "mcq",
      "text": "You find three versions of the same policy document in different folders. What is correct?",
      "opts": [
        "Delete the two older-looking ones",
        "Leave all three",
        "Email all three to everyone",
        "Confirm the current approved version, keep it in the agreed location, and archive the others clearly marked as superseded"
      ],
      "correct": 3,
      "explain": "One authoritative version prevents people acting on outdated documents.",
      "id": "a2q30"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "tf",
      "text": "Keeping official records only in your personal email account is acceptable if you are organised.",
      "correct": "False",
      "explain": "Official records belong in company systems so they are secure, backed up and available to others.",
      "id": "a2q31"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "tf",
      "text": "Reminders for statutory deadlines should be set early enough to allow for delays in gathering documents.",
      "correct": "True",
      "explain": "Deadlines are missed at the gathering stage, not the submission stage.",
      "id": "a2q32"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "mcq",
      "text": "You see a confidential salary document on the MD's desk while arranging papers. What do you do?",
      "opts": [
        "Read it; you work for the MD",
        "Mention the figures to a trusted colleague",
        "Leave it undisturbed or file it securely as instructed, and never discuss its contents",
        "Photocopy it for your records"
      ],
      "correct": 2,
      "explain": "Discretion is the core of the role. Access through proximity is not permission to read or share.",
      "id": "a2q33"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "mcq",
      "text": "A manager asks you to 'find out what the MD thinks' about their promotion. What do you do?",
      "opts": [
        "Politely decline and suggest they raise it with the MD directly",
        "Look through the MD's emails for them",
        "Ask the MD on their behalf and report back",
        "Guess and tell them"
      ],
      "correct": 0,
      "explain": "The assistant is not a channel for confidential information. Staff matters go directly to the MD.",
      "id": "a2q34"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "mcq",
      "text": "An email that appears to come from the MD asks you to transfer N800,000 urgently to a new supplier account. What do you do?",
      "opts": [
        "Verify with the MD through a separate, known channel before doing anything; urgent payment requests by email are a common fraud",
        "Transfer it; the MD asked",
        "Reply to the email to confirm",
        "Transfer half to be safe"
      ],
      "correct": 0,
      "explain": "Executive impersonation fraud targets assistants. Independent verification is the control.",
      "id": "a2q35"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "mcq",
      "text": "A supplier offers you a gift voucher 'as thanks for helping with the MD's diary'. What do you do?",
      "opts": [
        "Accept it quietly",
        "Accept it and book them more meetings",
        "Ask for a larger voucher",
        "Decline politely or declare it to the MD, following the company's policy on gifts"
      ],
      "correct": 3,
      "explain": "Gifts from people seeking access can create obligations. Transparency protects you and the company.",
      "id": "a2q36"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "mcq",
      "text": "The MD is unreachable and a lawyer's letter arrives demanding a response within 48 hours. What do you do?",
      "opts": [
        "Reply fully yourself",
        "Ignore it until the MD returns",
        "Forward it to all staff",
        "Acknowledge receipt without commenting on the substance, log the deadline, and keep trying to reach the MD or the person the MD has designated"
      ],
      "correct": 3,
      "explain": "Acknowledge, record the deadline and escalate. Legal substance is never answered by the assistant.",
      "id": "a2q37"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "mcq",
      "text": "You make a mistake in a document the MD has already sent to a client. What do you do?",
      "opts": [
        "Hope nobody notices",
        "Correct your copy only",
        "Blame the template",
        "Tell the MD straight away, explain the error, and propose a correction"
      ],
      "correct": 3,
      "explain": "Early disclosure lets the MD decide how to correct it before the client acts on the error.",
      "id": "a2q38"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "tf",
      "text": "An administrative assistant may approve expenses or payments on the MD's behalf if the amount is small.",
      "correct": "False",
      "explain": "Approval authority rests with the MD or those formally authorised, regardless of amount.",
      "id": "a2q39"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "tf",
      "text": "Information learned in the MD's office should be treated as confidential unless the MD says otherwise.",
      "correct": "True",
      "explain": "Assume confidentiality by default; the MD decides what can be shared.",
      "id": "a2q40"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "mcq",
      "text": "The MD wants a document shared with an external lawyer so only that lawyer can open it. Which OneDrive option is right?",
      "opts": [
        "Share with specific people, entering the lawyer's email address",
        "'Anyone with the link'",
        "Make the folder public",
        "Send it through WhatsApp"
      ],
      "correct": 0,
      "explain": "Specific-people links require the recipient to verify, so a forwarded link will not open for others.",
      "id": "a2q41"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "mcq",
      "text": "Someone saved over the MD's board presentation. What is the quickest recovery?",
      "opts": [
        "Restore the earlier version from the file's version history in OneDrive or SharePoint",
        "Recreate it from memory",
        "Ask IT to restore the whole server",
        "Nothing can be done"
      ],
      "correct": 0,
      "explain": "Version history keeps earlier copies that can be restored in moments.",
      "id": "a2q42"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "mcq",
      "text": "Which Excel feature makes deadlines within 14 days turn red automatically in a tracker?",
      "opts": [
        "Sorting by date each morning",
        "Conditional formatting using a rule based on TODAY()",
        "Bold text",
        "Freeze panes"
      ],
      "correct": 1,
      "explain": "Conditional formatting updates itself daily, so the tracker always shows what is urgent.",
      "id": "a2q43"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "mcq",
      "text": "You need delegate access so you can manage the MD's calendar and send invitations on the MD's behalf. How is that normally set up?",
      "opts": [
        "The MD shares their password with you",
        "You create a copy of the MD's calendar",
        "You use a personal Gmail calendar",
        "The MD grants you delegate permissions on the calendar in Outlook, rather than sharing the MD's password"
      ],
      "correct": 3,
      "explain": "Delegate access keeps actions traceable to you and avoids password sharing.",
      "id": "a2q44"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "mcq",
      "text": "Which PowerPoint practice makes a board presentation clearer?",
      "opts": [
        "As much text as fits on each slide",
        "Different fonts on every slide",
        "One main point per slide, readable font sizes, and figures shown in simple charts rather than dense tables",
        "Animations on every bullet"
      ],
      "correct": 2,
      "explain": "Clarity helps the board decide; decoration distracts.",
      "id": "a2q45"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "mcq",
      "text": "In Word, how do you show the MD exactly what you changed in a draft contract?",
      "opts": [
        "Highlight everything in yellow",
        "Save a new copy without telling them",
        "Turn on Track Changes, so each edit is marked and can be accepted or rejected",
        "Describe the changes from memory"
      ],
      "correct": 2,
      "explain": "Track Changes records every edit and lets the reviewer decide.",
      "id": "a2q46"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "tf",
      "text": "Two people can edit the same Word document stored in OneDrive at the same time.",
      "correct": "True",
      "explain": "Co-authoring allows simultaneous editing with changes saved automatically.",
      "id": "a2q47"
    },
    {
      "sec": "Section F: Microsoft 365 in practice",
      "type": "tf",
      "text": "Sharing the MD's Microsoft 365 password with you is the correct way to give you access to the MD's mailbox.",
      "correct": "False",
      "explain": "Access should be granted through delegate or shared-mailbox permissions, never by sharing passwords.",
      "id": "a2q48"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "The MD asks you to check whether decisions from last month's management meeting were carried out. What is the best approach?",
      "opts": [
        "Ask one manager for a general impression",
        "Assume everything was done",
        "Go through the tracker item by item, confirm status with each owner, and give the MD a short report of what is done, in progress and stalled",
        "Reopen the whole meeting"
      ],
      "correct": 2,
      "explain": "Oversight means verifying delivery against decisions, item by item, and reporting exceptions.",
      "id": "a2q49"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "mcq",
      "text": "Before a quarterly review, the MD wants each department's key figures in one place. What do you do?",
      "opts": [
        "Collect whatever arrives and forward it",
        "Request the figures from each owner with a clear template and deadline, check they are complete and consistent, and compile a single summary",
        "Estimate the missing numbers yourself",
        "Ask the departments to present without preparation"
      ],
      "correct": 1,
      "explain": "A common template and a completeness check turn scattered inputs into something the MD can review quickly.",
      "id": "a2q50"
    },
    {
      "sec": "Section D: Records, deadlines and compliance calendar",
      "type": "mcq",
      "text": "A licence the company needs to operate expires in six weeks, and renewal requires documents from three departments. When do you start?",
      "opts": [
        "A week before expiry",
        "On the expiry date",
        "Now: request the documents with a deadline two to three weeks ahead, so there is time to chase and resubmit",
        "After it expires, since renewals are routine"
      ],
      "correct": 2,
      "explain": "The lead time is set by the slowest contributor, not by the filing itself.",
      "id": "a2q51"
    },
    {
      "sec": "Section E: Judgement, discretion and authority",
      "type": "mcq",
      "text": "A department head asks you to delay passing a critical report to the MD 'until they have fixed a few things'. What do you do?",
      "opts": [
        "Pass it on as agreed, noting that a revised version is coming, or let the MD decide whether to wait; do not withhold it on your own",
        "Hold it indefinitely",
        "Edit the report yourself",
        "Tell other staff about the problems in it"
      ],
      "correct": 0,
      "explain": "The assistant must not filter what the MD sees for someone else's benefit. The MD decides.",
      "id": "a2q52"
    },
    {
      "sec": "Section B: Correspondence and drafting",
      "type": "mcq",
      "text": "You are asked to draft a memo announcing a new expense approval rule to all staff. What makes it effective?",
      "opts": [
        "A long history of past policies",
        "Legal language throughout",
        "A clear subject, what is changing and from when, why, what staff must do, and whom to ask",
        "Only the rule, with no date or contact"
      ],
      "correct": 2,
      "explain": "Staff act on memos that tell them plainly what to do and from when.",
      "id": "a2q53"
    },
    {
      "sec": "Section C: Meetings, briefings and follow-up",
      "type": "tf",
      "text": "Following up on agreed actions with managers should be done courteously and factually, without taking over their work.",
      "correct": "True",
      "explain": "The assistant tracks and reminds; the owner remains responsible for delivering.",
      "id": "a2q54"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "The MD is travelling next week and asks you to prepare a one-page summary for Monday morning of what needs their attention while away: two contracts awaiting signature, a CAC filing due in ten days, and a manager's overdue report. Write the summary.",
      "sub": "Make it clear what needs a decision, by when, and what you will handle. Keep it to what fits on one page.",
      "placeholder": "For your attention while travelling, week of...",
      "id": "a2q55"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "Draft a reply, for the MD's approval, to a supplier who has written asking why their invoice of three weeks ago has not been paid. The invoice is awaiting a delivery confirmation from the operations team.",
      "sub": "Be courteous and factual, do not commit to a payment date the MD has not agreed, and keep it to five to seven sentences.",
      "placeholder": "Dear Mr Okonkwo, thank you for your email regarding...",
      "id": "a2q56"
    }
  ],
  "Full Stack Engineer": [
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "What does `typeof null` evaluate to in JavaScript?",
      "opts": [
        "`\"null\"`",
        "`\"undefined\"`",
        "`\"object\"`",
        "It throws a TypeError"
      ],
      "correct": 2,
      "explain": "A long-standing language quirk. Check for null explicitly with `value === null`.",
      "id": "e2q01"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "What is the difference between `x ?? 'default'` and `x || 'default'`?",
      "opts": [
        "They are identical",
        "`??` falls back for every falsy value; `||` only for null",
        "`??` falls back only when `x` is null or undefined; `||` also falls back for `0`, `''` and `false`",
        "`??` is only valid in TypeScript"
      ],
      "correct": 2,
      "explain": "Using `||` for defaults silently replaces legitimate zeros and empty strings.",
      "id": "e2q02"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "Given `const items = [1, 2]; items.push(3);` what happens?",
      "opts": [
        "It works: `const` prevents reassigning the variable, not changing the array it points to",
        "TypeError: assignment to constant",
        "It silently does nothing",
        "It creates a new array"
      ],
      "correct": 0,
      "explain": "`const` binds the name; objects and arrays it refers to remain mutable.",
      "id": "e2q03"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "`Promise.all([a(), b(), c()])` where `b()` rejects. What happens?",
      "opts": [
        "It waits for all three and returns only the successes",
        "It retries `b()` automatically",
        "The combined promise rejects as soon as `b()` rejects; use `Promise.allSettled` to get every outcome",
        "It resolves with `undefined` for `b()`"
      ],
      "correct": 2,
      "explain": "`Promise.all` fails fast. `allSettled` is the choice when each result matters independently.",
      "id": "e2q04"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "TypeScript rejects `rows as Employee[]` with 'Conversion of type ... may be a mistake', although the data is correct at runtime. What does the error mean?",
      "opts": [
        "The code has a runtime bug",
        "TypeScript does not allow arrays in assertions",
        "The two types do not overlap enough for a direct assertion; asserting through `unknown` makes the intent explicit, though a proper type or validation is better",
        "The file must be renamed to .js"
      ],
      "correct": 2,
      "explain": "Assertions between insufficiently related types need `as unknown as T`. A typed query or runtime validation avoids the assertion entirely.",
      "id": "e2q05"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "Which type should an external API response be given before it is validated?",
      "opts": [
        "`unknown`, which forces the value to be checked or narrowed before use",
        "`any`, to avoid compiler errors",
        "`never`",
        "`object`"
      ],
      "correct": 0,
      "explain": "`unknown` keeps the compiler honest about unvalidated data; `any` switches checking off.",
      "id": "e2q06"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "What does `Partial<User>` produce?",
      "opts": [
        "A type with only the first half of the properties",
        "A type with all of `User`'s properties made optional",
        "An array of users",
        "A type with all properties required"
      ],
      "correct": 1,
      "explain": "Useful for update payloads where any subset of fields may be sent.",
      "id": "e2q07"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "mcq",
      "text": "In an `async` function, what happens if an awaited promise rejects and there is no `try/catch`?",
      "opts": [
        "The error is silently ignored",
        "The process always exits immediately",
        "The async function's own promise rejects with that error, which the caller must handle",
        "The function returns `undefined`"
      ],
      "correct": 2,
      "explain": "Unhandled rejections propagate to the caller. Route handlers need error handling at the boundary.",
      "id": "e2q08"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "tf",
      "text": "`0.1 + 0.2 === 0.3` evaluates to true in JavaScript.",
      "correct": "False",
      "explain": "Floating-point representation makes it 0.30000000000000004. Money should be handled in integer minor units or with a decimal library.",
      "id": "e2q09"
    },
    {
      "sec": "Section A: TypeScript and JavaScript",
      "type": "tf",
      "text": "An `async` function always returns a Promise.",
      "correct": "True",
      "explain": "Even a plain `return value` is wrapped in a resolved Promise.",
      "id": "e2q10"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "In the Next.js App Router, which component can use `useState` and `useEffect`?",
      "opts": [
        "Any component, since all are client components",
        "Only components in the `pages` directory",
        "Only layout files",
        "A component in a file marked with `'use client'` at the top"
      ],
      "correct": 3,
      "explain": "App Router components are Server Components by default; hooks need a Client Component.",
      "id": "e2q11"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "How is an API route defined in the App Router?",
      "opts": [
        "A default-exported handler in `pages/api` only",
        "A `.json` file in `public`",
        "A `route.ts` file in `app/api/...` exporting functions named after HTTP methods, such as `GET` and `POST`",
        "A `middleware.ts` file per route"
      ],
      "correct": 2,
      "explain": "Route handlers export one function per HTTP method.",
      "id": "e2q12"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "A page reads from the database but is rendered once at build time and never changes. Which export makes it render on every request?",
      "opts": [
        "`export const runtime = 'edge'`",
        "`export default async`",
        "`export const dynamic = 'force-dynamic'`",
        "`export const revalidate = 31536000`"
      ],
      "correct": 2,
      "explain": "Without a dynamic signal, a page can be statically rendered at build and served stale.",
      "id": "e2q13"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "Which environment variables are exposed to the browser in Next.js?",
      "opts": [
        "All variables in `.env.local`",
        "Only those prefixed `NEXT_PUBLIC_`, which are inlined into client bundles at build time",
        "None, ever",
        "Any variable read inside a Client Component"
      ],
      "correct": 1,
      "explain": "Secrets must never carry the `NEXT_PUBLIC_` prefix, since the value ships to every visitor.",
      "id": "e2q14"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "A list renders with `items.map((item, i) => <Row key={i} ... />)` and rows show the wrong data after deletion. Why?",
      "opts": [
        "Keys are optional and not the cause",
        "`map` cannot render components",
        "The component needs `useMemo`",
        "Using the array index as `key` makes React reuse the wrong components when items move; use a stable unique id"
      ],
      "correct": 3,
      "explain": "Keys identify items across renders; index keys break when the list order changes.",
      "id": "e2q15"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "A `useEffect` fetching data runs in an infinite loop. What is the most common cause?",
      "opts": [
        "Effects cannot fetch data",
        "It sets state that is in its own dependency array, or depends on an object recreated on every render",
        "The component is a Server Component",
        "`useEffect` must always have an empty array"
      ],
      "correct": 1,
      "explain": "State set inside an effect that the effect depends on retriggers it endlessly.",
      "id": "e2q16"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "In Next.js 15 and later, how are `params` accessed in a dynamic route handler such as `app/api/items/[id]/route.ts`?",
      "opts": [
        "`params.id` directly, synchronously",
        "From `req.query.id`",
        "`params` is a Promise, so it is awaited: `const { id } = await params`",
        "From `process.env.id`"
      ],
      "correct": 2,
      "explain": "Recent Next.js versions made route params asynchronous.",
      "id": "e2q17"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "mcq",
      "text": "Why should state never be mutated directly, as in `state.items.push(x)` followed by `setState(state)`?",
      "opts": [
        "React compares references; mutating in place keeps the same reference, so it may not re-render",
        "It is a syntax error",
        "It deletes the state",
        "React throws an exception"
      ],
      "correct": 0,
      "explain": "Create a new array or object: `setItems([...items, x])`.",
      "id": "e2q18"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "tf",
      "text": "A Server Component can read from the database directly without an API route.",
      "correct": "True",
      "explain": "Server Components run on the server, so they can query the database; the data must not include secrets passed to client components.",
      "id": "e2q19"
    },
    {
      "sec": "Section B: React and Next.js",
      "type": "tf",
      "text": "Putting a secret API key in a `NEXT_PUBLIC_` variable is safe if it is only used in one component.",
      "correct": "False",
      "explain": "The value is embedded in the JavaScript sent to browsers, where anyone can read it.",
      "id": "e2q20"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "mcq",
      "text": "A Node.js route handler reads a 200 MB file with `fs.readFileSync` on every request. What is the problem?",
      "opts": [
        "Nothing; Node.js is multi-threaded for requests",
        "It only affects Windows servers",
        "The synchronous call blocks the event loop, stalling every other request; stream the file or use async I/O",
        "Files cannot be read in route handlers"
      ],
      "correct": 2,
      "explain": "Node serves requests on one event loop. Blocking calls in request paths degrade the whole server.",
      "id": "e2q21"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "mcq",
      "text": "A Laravel page listing 100 orders runs 101 database queries. What is the fix?",
      "opts": [
        "Eager-load the relationship with `Order::with('customer')->get()` to avoid the N+1 query problem",
        "Add more RAM",
        "Cache the page forever",
        "Switch to MongoDB"
      ],
      "correct": 0,
      "explain": "Lazy-loading a relationship per row triggers one query each. Eager loading fetches them together.",
      "id": "e2q22"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "mcq",
      "text": "What does Laravel's `$fillable` property protect against?",
      "opts": [
        "SQL injection",
        "Cross-site scripting",
        "Mass assignment: users setting fields they should not, such as `is_admin`, through request data",
        "Slow queries"
      ],
      "correct": 2,
      "explain": "Only whitelisted attributes can be mass-assigned from request input.",
      "id": "e2q23"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "mcq",
      "text": "A payment gateway sends a webhook to your API. What must the handler do before trusting it?",
      "opts": [
        "Trust it if the JSON parses",
        "Check the sender's IP only",
        "Reply with the customer's details",
        "Verify the webhook's signature with the shared secret, and handle repeats idempotently, since the same event may arrive more than once"
      ],
      "correct": 3,
      "explain": "Unsigned webhooks can be forged; retries mean duplicates must not double-apply.",
      "id": "e2q24"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "mcq",
      "text": "Which HTTP status fits a request with a valid session for a user who lacks permission for the resource?",
      "opts": [
        "401 Unauthorized",
        "404 Not Found",
        "500 Internal Server Error",
        "403 Forbidden"
      ],
      "correct": 3,
      "explain": "401 means not authenticated; 403 means authenticated but not permitted.",
      "id": "e2q25"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "mcq",
      "text": "An integration needs to call Microsoft Graph from a background job with no user signed in. Which OAuth flow applies?",
      "opts": [
        "Device code flow",
        "Client credentials, with application permissions granted by an administrator and limited to what the job needs",
        "Implicit flow",
        "Sharing an administrator's password in the job"
      ],
      "correct": 1,
      "explain": "App-only access uses client credentials; least-privilege application permissions limit the damage if the secret leaks.",
      "id": "e2q26"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "mcq",
      "text": "A POST endpoint that creates an invoice is sometimes called twice by a client on a slow connection. What design prevents duplicate invoices?",
      "opts": [
        "Asking users not to double-click",
        "Adding a delay before insert",
        "Deleting duplicates in a nightly job",
        "An idempotency key, or a unique constraint on a natural key, so a repeated request returns the original result"
      ],
      "correct": 3,
      "explain": "Idempotency must be enforced server-side; the client cannot be relied on.",
      "id": "e2q27"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "tf",
      "text": "Returning a full error stack trace to API clients in production helps them debug and is good practice.",
      "correct": "False",
      "explain": "Stack traces reveal internals to attackers. Log details server-side and return a safe message.",
      "id": "e2q28"
    },
    {
      "sec": "Section C: APIs, Node.js and Laravel",
      "type": "tf",
      "text": "Rate limiting a login endpoint helps defend against password-guessing attacks.",
      "correct": "True",
      "explain": "Limiting attempts per account and per IP makes brute force impractical.",
      "id": "e2q29"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "mcq",
      "text": "A MongoDB query filtering on `email` is slow on a large collection. What is the first thing to check?",
      "opts": [
        "Whether the server has an SSD",
        "The MongoDB version number",
        "Whether an index exists on `email`, using `explain()` to confirm the query uses it",
        "Whether the documents are too small"
      ],
      "correct": 2,
      "explain": "Without an index, every document is scanned. `explain()` shows the plan.",
      "id": "e2q30"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "mcq",
      "text": "How should the database guarantee that no two users share an email address?",
      "opts": [
        "A check in the signup form only",
        "A nightly script that deletes duplicates",
        "A unique index on the email field, not only a check in application code",
        "Using email as a display name"
      ],
      "correct": 2,
      "explain": "Application checks race under concurrency; a unique index enforces it at the database.",
      "id": "e2q31"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "mcq",
      "text": "What does Mongoose's `.lean()` do?",
      "opts": [
        "Deletes unused fields from the database",
        "Returns plain JavaScript objects instead of full documents, which is faster when you only read data",
        "Compresses the collection",
        "Makes the query run on a replica"
      ],
      "correct": 1,
      "explain": "Lean results skip document hydration; they lack methods such as `save()`.",
      "id": "e2q32"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "mcq",
      "text": "Which query is safe from SQL injection?",
      "opts": [
        "String concatenation with the user's input",
        "Concatenation after removing quote characters",
        "A parameterised query: `SELECT * FROM users WHERE email = ?` with the value passed separately",
        "Any query run from PHP"
      ],
      "correct": 2,
      "explain": "Parameters are never interpreted as SQL. Escaping by hand is error-prone.",
      "id": "e2q33"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "mcq",
      "text": "Money must move from one account balance to another so that both updates happen or neither does. What is needed?",
      "opts": [
        "A database transaction",
        "Two separate updates in sequence",
        "A cron job to fix mismatches",
        "A larger index"
      ],
      "correct": 0,
      "explain": "Transactions give atomicity; separate writes can leave inconsistent balances if one fails.",
      "id": "e2q34"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "mcq",
      "text": "In MySQL, how do you see whether a slow query uses an index?",
      "opts": [
        "Run it twice",
        "Check the table's row count only",
        "Prefix it with `EXPLAIN` and read the access type and key used",
        "Restart MySQL"
      ],
      "correct": 2,
      "explain": "EXPLAIN reveals full table scans and missing indexes.",
      "id": "e2q35"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "mcq",
      "text": "Under the NDPA 2023, what is good practice for personal data in the database?",
      "opts": [
        "Keep everything forever in case it is useful",
        "Store it in a public bucket for easy access",
        "Copy production data to every developer's laptop",
        "Store only what is needed, restrict access, encrypt sensitive fields where appropriate, and delete it when its purpose ends"
      ],
      "correct": 3,
      "explain": "Minimisation, access control and retention limits apply to what engineers build, not only to policy.",
      "id": "e2q36"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "tf",
      "text": "Adding an index always makes every operation on a collection faster.",
      "correct": "False",
      "explain": "Indexes speed reads that use them but cost storage and slow writes. Index for real query patterns.",
      "id": "e2q37"
    },
    {
      "sec": "Section D: Databases: MongoDB and MySQL",
      "type": "tf",
      "text": "Deleting production data should be preceded by a verified backup.",
      "correct": "True",
      "explain": "Irreversible operations need a tested way back.",
      "id": "e2q38"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "How should user passwords be stored?",
      "opts": [
        "Encrypted with AES so they can be recovered",
        "Hashed with a slow, salted password algorithm such as argon2id or bcrypt",
        "Hashed with SHA-256",
        "In plain text in a secured table"
      ],
      "correct": 1,
      "explain": "Fast hashes can be brute-forced at scale; password algorithms are deliberately slow and salted.",
      "id": "e2q39"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "A page displays a user-supplied company name with `innerHTML`. What is the risk and fix?",
      "opts": [
        "No risk; company names are harmless",
        "SQL injection; use an ORM",
        "CSRF; add a CAPTCHA",
        "Cross-site scripting: a name containing a script runs in other users' browsers; escape output or use `textContent`"
      ],
      "correct": 3,
      "explain": "Any user-controlled string rendered as HTML is an XSS vector.",
      "id": "e2q40"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "What is the safest place for a session token in a browser application?",
      "opts": [
        "`localStorage`",
        "An `HttpOnly`, `Secure`, `SameSite` cookie, which scripts cannot read",
        "A global JavaScript variable",
        "The URL query string"
      ],
      "correct": 1,
      "explain": "HttpOnly cookies are out of reach of injected scripts; tokens in localStorage or URLs leak easily.",
      "id": "e2q41"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "An upload endpoint accepts CVs. Which set of controls is appropriate?",
      "opts": [
        "Trust the file extension",
        "Save uploads into `public/` for easy access",
        "Limit size, allow only expected types, sanitise the file name, store outside the web root, and serve through an authorised route",
        "Allow any file and scan it later"
      ],
      "correct": 2,
      "explain": "Uploaded files in a web-served folder can be executed or fetched by anyone; each control closes a known attack.",
      "id": "e2q42"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "When checking an HMAC token signature, why use a constant-time comparison such as `crypto.timingSafeEqual`?",
      "opts": [
        "It is faster",
        "It encrypts the token",
        "A normal comparison can leak through response timing how many characters matched, allowing the signature to be guessed",
        "It works with longer strings"
      ],
      "correct": 2,
      "explain": "Timing attacks are practical against naive comparisons of secrets.",
      "id": "e2q43"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "A secret was accidentally committed to a public GitHub repository and then removed in the next commit. What must be done?",
      "opts": [
        "Revoke and rotate the secret immediately; removing it from the code does not remove it from the history",
        "Nothing; it has been removed",
        "Make the repository private",
        "Force-push to hide the commit"
      ],
      "correct": 0,
      "explain": "Assume a published secret is compromised. Rotation is the only real fix.",
      "id": "e2q44"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "Does a CORS policy protect an API from unauthorised use?",
      "opts": [
        "Yes; it blocks all non-browser clients",
        "Yes, if set to `*`",
        "No; CORS only controls which browser origins may read responses. APIs still need authentication and authorisation",
        "Only for POST requests"
      ],
      "correct": 2,
      "explain": "Scripts, servers and tools ignore CORS entirely.",
      "id": "e2q45"
    },
    {
      "sec": "Section E: Security",
      "type": "mcq",
      "text": "Which is the principle of least privilege applied to a service account?",
      "opts": [
        "Give it administrator rights to avoid errors",
        "Share one account between all services",
        "Grant only the permissions the service needs for its task, and nothing broader",
        "Use a developer's personal account"
      ],
      "correct": 2,
      "explain": "Narrow permissions limit the damage if the credentials are stolen.",
      "id": "e2q46"
    },
    {
      "sec": "Section E: Security",
      "type": "tf",
      "text": "Two-factor authentication on administrator accounts significantly reduces the risk from stolen passwords.",
      "correct": "True",
      "explain": "A stolen password alone is no longer enough to sign in.",
      "id": "e2q47"
    },
    {
      "sec": "Section E: Security",
      "type": "tf",
      "text": "It is acceptable to disable certificate verification in production HTTP calls if a partner's certificate causes errors.",
      "correct": "False",
      "explain": "Disabling verification exposes traffic to interception. Fix the trust chain instead.",
      "id": "e2q48"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "mcq",
      "text": "A bad commit has already been pushed to `main`, which others have pulled. What is the right way to undo it?",
      "opts": [
        "`git revert <commit>`, which adds a new commit undoing the change without rewriting shared history",
        "`git reset --hard` and force-push",
        "Delete the repository and re-clone",
        "Edit the files on the server directly"
      ],
      "correct": 0,
      "explain": "Rewriting shared history breaks everyone else's copies; revert is safe.",
      "id": "e2q49"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "mcq",
      "text": "Where should a GitHub Actions workflow get the credentials it needs to deploy?",
      "opts": [
        "Hard-coded in the workflow file",
        "From a text file in the repository",
        "From encrypted repository or environment secrets, referenced as `${{ secrets.NAME }}`",
        "Typed in by hand at each run"
      ],
      "correct": 2,
      "explain": "Secrets stay out of the codebase and are masked in logs.",
      "id": "e2q50"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "mcq",
      "text": "Behind Nginx as a reverse proxy, the application generates `http://` links although the site uses HTTPS. What is usually missing?",
      "opts": [
        "An SSL certificate on the app's port",
        "The `X-Forwarded-Proto` header from Nginx, so the application knows the original request was HTTPS",
        "A larger worker pool",
        "A CNAME record"
      ],
      "correct": 1,
      "explain": "The app sees plain HTTP from the proxy unless the proxy passes the original scheme.",
      "id": "e2q51"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "mcq",
      "text": "On a Cloudflare-managed domain, how must the MX record's target host be configured?",
      "opts": [
        "Proxied (orange cloud), for protection",
        "DNS only (grey cloud), since Cloudflare's proxy handles web traffic, not mail",
        "Deleted, as Cloudflare handles mail",
        "As a CNAME to Cloudflare"
      ],
      "correct": 1,
      "explain": "Proxying mail hostnames breaks email delivery.",
      "id": "e2q52"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "mcq",
      "text": "How is a running Node.js app restarted with PM2 after a deployment?",
      "opts": [
        "`kill -9` on every node process",
        "Rebooting the server",
        "`npm start` in a new terminal",
        "`pm2 restart <name>` (or `pm2 reload <name>` for a graceful reload)"
      ],
      "correct": 3,
      "explain": "PM2 manages the process, its logs and restarts; killing processes by hand loses that.",
      "id": "e2q53"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "mcq",
      "text": "Static asset files with content hashes in their names can be cached for a year. Why is that not safe for the HTML page itself?",
      "opts": [
        "The HTML references the current asset names; if it is cached, browsers keep loading old assets after a deploy",
        "HTML files are too small to cache",
        "Browsers never cache HTML",
        "It is safe; cache everything for a year"
      ],
      "correct": 0,
      "explain": "Long caching suits content-addressed files. HTML must be revalidated so new deployments are seen.",
      "id": "e2q54"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "mcq",
      "text": "Which file permission suits a `.env` file containing secrets on a Linux server?",
      "opts": [
        "`777`",
        "`644`, readable by all users",
        "`600`, readable and writable only by the owner the application runs as",
        "`755`"
      ],
      "correct": 2,
      "explain": "Secrets should be readable only by the account that needs them.",
      "id": "e2q55"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "tf",
      "text": "Running `npm ci` in a deployment installs exactly what `package-lock.json` specifies.",
      "correct": "True",
      "explain": "`npm ci` fails if the manifest and lock file disagree, which makes builds reproducible.",
      "id": "e2q56"
    },
    {
      "sec": "Section F: Git, CI/CD and Linux operations",
      "type": "tf",
      "text": "Force-pushing to a shared main branch is a safe way to tidy up commit history.",
      "correct": "False",
      "explain": "It overwrites commits others depend on. Tidy history on your own branch before merging.",
      "id": "e2q57"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "Review this Next.js route handler and list the problems you see, most serious first, with a one-line fix for each:\n```\nexport async function GET(req) {\n  const id = new URL(req.url).searchParams.get('id')\n  const user = await db.collection('users').findOne({ _id: id })\n  return Response.json(user)\n}\n```",
      "sub": "Consider authentication and authorisation, data exposure, input handling and error cases. Bullet points are fine.",
      "placeholder": "1. ...",
      "id": "e2q58"
    },
    {
      "sec": "Section G: Written answers",
      "type": "text",
      "text": "After a deploy, some users still see an old version of a page while others see the new one. The server returns the new HTML. Describe how you would investigate, in order, and what you would check at each step.",
      "sub": "Explain your reasoning, not just a list of tools. Aim for six to ten sentences.",
      "placeholder": "First, I would confirm...",
      "id": "e2q59"
    }
  ]
}

export const BANKS: Record<string, RoleBank> = {
  'Operations Coordinator':           { minutes: 35, draw: 25,   version: 'ops-v2',     questions: QUESTIONS['Operations Coordinator'] },
  'Social Media & Community Manager': { minutes: 35, draw: 25,   version: 'social-v2',  questions: QUESTIONS['Social Media & Community Manager'] },
  'Hosting Support Technician':       { minutes: 35, draw: 25,   version: 'hosting-v2', questions: QUESTIONS['Hosting Support Technician'] },
  'Sales & Support Associate':        { minutes: 35, draw: 25,   version: 'sales-v2',   questions: QUESTIONS['Sales & Support Associate'] },
  'Administrative Assistant':         { minutes: 35, draw: 25,   version: 'admin-v1',   questions: QUESTIONS['Administrative Assistant'] },
  'Full Stack Engineer':              { minutes: 40, draw: 25,   version: 'engineer-v1', questions: QUESTIONS['Full Stack Engineer'] },
}

export const getBank = (role: string): RoleBank | null => BANKS[role] || null
