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
      "id": "q1",
      "sec": "Section A: Administrative skills",
      "type": "mcq",
      "text": "You receive three tasks simultaneously: 1) a vendor awaits a signed contract, 2) the MD needs meeting notes sent within the hour, 3) a new team member needs their email account set up. How do you prioritise?",
      "opts": [
        "Set up the email account first: it is the most technical task",
        "Send meeting notes first (fixed deadline), then contract, then email setup",
        "Ask the MD to decide priority",
        "Do all three at the same time to save time"
      ],
      "correct": 1,
      "explain": "Meeting notes have a defined 1-hour deadline. The contract is second. Email setup is routine and can wait. Spotting the fixed deadline and working backwards from it is the key skill."
    },
    {
      "id": "q2",
      "sec": "Section A: Administrative skills",
      "type": "mcq",
      "text": "A vendor emails about an unpaid 30-day invoice. The MD is in a meeting. You find the invoice was never forwarded internally. What do you do?",
      "opts": [
        "Forward to accounts and update the vendor that payment is being processed",
        "Wait for the MD before taking any action",
        "Tell the vendor it is not your responsibility",
        "Delete and re-send the email"
      ],
      "correct": 0,
      "explain": "Forwarding an internal document and giving the vendor a factual update is within the coordinator's authority. Waiting is not productive."
    },
    {
      "id": "q3",
      "sec": "Section A: Administrative skills",
      "type": "tf",
      "text": "An Operations Coordinator can sign contracts on behalf of the company if the MD is unavailable and the deadline is urgent.",
      "correct": "False",
      "explain": "Signing authority must be formally delegated in writing. Without delegation, a coordinator cannot sign binding documents regardless of urgency."
    },
    {
      "id": "q4",
      "sec": "Section B: Microsoft 365 & Digital tools",
      "type": "mcq",
      "text": "You need to share a 25MB file with an external partner but the email limit is 20MB. What is the best Microsoft 365 solution?",
      "opts": [
        "Ask the partner to create a WeTransfer account",
        "Upload the file to OneDrive and share a link",
        "Compress with WinRAR and retry",
        "Split into two separate emails"
      ],
      "correct": 1,
      "explain": "OneDrive sharing is the correct Microsoft 365 answer: secure, traceable, and requires no third-party tools."
    },
    {
      "id": "q5",
      "sec": "Section B: Microsoft 365 & Digital tools",
      "type": "mcq",
      "text": "A meeting is scheduled for 3pm Lagos time (WAT). EST is 6 hours behind WAT. What time do you tell the Indianapolis participants?",
      "opts": [
        "9am EST",
        "9pm EST",
        "3pm EST",
        "6am EST"
      ],
      "correct": 0,
      "explain": "3pm WAT minus 6 hours = 9am EST. This matters for coordinating GoLive's Nigeria and US operations."
    },
    {
      "id": "q6",
      "sec": "Section B: Microsoft 365 & Digital tools",
      "type": "mcq",
      "text": "Which Microsoft 365 app is best for tracking vendor contracts with renewal dates, values, and status?",
      "opts": [
        "Microsoft Word",
        "Microsoft PowerPoint",
        "Microsoft Excel",
        "Microsoft Teams"
      ],
      "correct": 2,
      "explain": "Excel is correct for structured tabular data with sortable and filterable fields."
    },
    {
      "id": "q7",
      "sec": "Section C: Professional judgement",
      "type": "mcq",
      "text": "While writing meeting minutes you notice a decision was made that you personally disagree with. What do you do?",
      "opts": [
        "Leave it out of the minutes",
        "Record it accurately in the minutes as decided",
        "Add a personal note of disagreement",
        "Tell a colleague before circulating"
      ],
      "correct": 1,
      "explain": "Minutes are a factual record, not personal commentary. Record what was decided accurately."
    },
    {
      "id": "q8",
      "sec": "Section C: Professional judgement",
      "type": "mcq",
      "text": "A colleague asks for another staff member's salary details, saying it is \"just between us.\" You have access to this information. What do you do?",
      "opts": [
        "Share since you trust the colleague",
        "Decline: HR information is confidential",
        "Check with the MD first",
        "Share only if they promise not to tell anyone"
      ],
      "correct": 1,
      "explain": "Confidentiality is non-negotiable. Access to information does not equal permission to share it."
    },
    {
      "id": "q9",
      "sec": "Section C: Professional judgement",
      "type": "tf",
      "text": "If a task is not specifically listed in your job description, it is acceptable to decline to do it.",
      "correct": "False",
      "explain": "Job descriptions outline core responsibilities but are not exhaustive. Flexibility is expected, especially in an early-stage company."
    },
    {
      "id": "q10",
      "sec": "Section D: Written communication",
      "type": "text",
      "text": "Draft a short professional email (3–5 sentences) to a vendor called Apex Supplies Ltd, informing them that your company will not be renewing a contract expiring at the end of this month.",
      "sub": "Write clearly, politely, and professionally. This will be reviewed by the interviewer.",
      "placeholder": "Dear Apex Supplies Ltd..."
    },
    {
      "id": "q11",
      "sec": "Section D: Written communication",
      "type": "text",
      "text": "A new team member, John, is starting on Monday. Write a short internal message (3 sentences) to notify existing staff.",
      "sub": "Write clearly and professionally. This will be reviewed by the interviewer.",
      "placeholder": "Hi team..."
    },
    {
      "id": "q12",
      "sec": "Section E: Situation handling",
      "type": "mcq",
      "text": "You are alone in the office when someone arrives claiming to be a CAC inspector and demands company registration documents immediately. What do you do?",
      "opts": [
        "Hand over all documents to avoid trouble",
        "Ask for official ID, note their name and badge number, and call the MD before providing any documents",
        "Say the MD is unavailable and ask them to return another day",
        "Give documents and call the MD afterwards"
      ],
      "correct": 1,
      "explain": "Verify identity before releasing company documents. A legitimate inspector will understand a brief verification pause."
    },
    {
      "id": "q13",
      "sec": "Section E: Situation handling",
      "type": "mcq",
      "text": "You notice a recurring office supply invoice charged 20% above the agreed contract rate. What is your first step?",
      "opts": [
        "Pay it and mention it to the MD next week",
        "Contact the vendor about the discrepancy before the invoice is paid",
        "Approve it since the amount is not large",
        "Assume the contract rate has been updated"
      ],
      "correct": 1,
      "explain": "Flag the discrepancy to the vendor before payment. This is exactly the kind of detail the Operations Coordinator role exists to catch."
    },
    {
      "id": "q14",
      "sec": "Section E: Situation handling",
      "type": "tf",
      "text": "If you are unsure whether a task is within your authority, the best approach is to attempt it and explain afterwards if something goes wrong.",
      "correct": "False",
      "explain": "When uncertain about authority, ask before acting. Acting outside authority on contracts or financial matters can have irreversible consequences."
    },
    {
      "id": "q15",
      "sec": "Section F: Reasoning",
      "type": "mcq",
      "text": "You receive simultaneous \"urgent\" requests from GoLive Forge (book a meeting room) and B2B Services (prepare a vendor proposal). How do you handle it?",
      "opts": [
        "Complete the B2B request first: it is client-facing",
        "Ask each team which deadline is actually fixed versus which is perceived urgency, then sequence accordingly",
        "Flip a coin since both are equally important",
        "Tell both teams you cannot help simultaneously and ask them to resubmit tomorrow"
      ],
      "correct": 1,
      "explain": "Asking about actual vs. perceived urgency is the correct operational response. The coordinator's job is to triage effectively."
    },
    {
      "id": "q16",
      "sec": "Section G: Advanced administration",
      "type": "mcq",
      "text": "The MD asks you to prepare a report showing how much the company has spent on vendor services in Q2, but the invoices are spread across three different email inboxes and a physical folder. How do you approach this?",
      "opts": [
        "Ask the MD to gather the information himself since it is too disorganised",
        "Create a systematic approach: work through each source in turn, log each invoice into a spreadsheet with vendor name, date, amount, and category, then reconcile the total before presenting",
        "Estimate the total based on what you can find quickly",
        "Only report on the digital invoices since the physical ones are too difficult to include"
      ],
      "correct": 1,
      "explain": "Systematic collation across multiple sources is a core operations skill. Every invoice must be accounted for: estimating or excluding physical records would produce an inaccurate report that could affect financial decisions."
    },
    {
      "id": "q17",
      "sec": "Section G: Advanced administration",
      "type": "mcq",
      "text": "You discover that a recurring supplier contract automatically renews in 7 days at a cost of ₦480,000. The MD has not reviewed it. What do you do?",
      "opts": [
        "Let it renew: it is not your decision to cancel it",
        "Immediately flag it to the MD in writing with the contract details, renewal date, cost, and a clear recommendation that they review it before the renewal date",
        "Cancel the renewal without asking: GoLive can always re-subscribe later",
        "Wait until the MD asks about it"
      ],
      "correct": 1,
      "explain": "Contract renewals with significant cost implications must be surfaced to the decision-maker in advance with enough time to act. Flagging with full details is the coordinator's job: the decision belongs to the MD."
    },
    {
      "id": "q18",
      "sec": "Section G: Advanced administration",
      "type": "mcq",
      "text": "You are managing meeting logistics for a client pitch. Two hours before the meeting, the video conferencing link stops working. The client is remote. What do you do?",
      "opts": [
        "Cancel the meeting and apologise",
        "Immediately try an alternative platform (Google Meet, WhatsApp video, phone call as last resort), email the client with the new link before they attempt to join, and notify the MD",
        "Wait for the IT team to fix the original link",
        "Tell the client the meeting is delayed until tomorrow"
      ],
      "correct": 1,
      "explain": "Crisis management under time pressure is a key test of an operations coordinator. The goal is continuity: find a working alternative fast and communicate proactively to the client before they experience the problem."
    },
    {
      "id": "q19",
      "sec": "Section G: Advanced administration",
      "type": "tf",
      "text": "A well-written set of meeting minutes should include your personal interpretation of what each agenda item means for the company.",
      "correct": "False",
      "explain": "Minutes are a factual record of what was discussed, decided, and assigned. Personal interpretation, commentary, and analysis have no place in minutes: they belong in a separate memo or report if needed."
    },
    {
      "id": "q20",
      "sec": "Section G: Advanced administration",
      "type": "mcq",
      "text": "GoLive is onboarding a new corporate client. You need to set up a shared folder structure in OneDrive that the client's team and GoLive's team can both access. Which approach is correct?",
      "opts": [
        "Share your personal OneDrive folder with the client's email addresses",
        "Create a shared SharePoint folder under the GoLive tenant, set appropriate permissions for internal and external users, and share a controlled access link with the client",
        "Email all documents back and forth: shared folders are too complex",
        "Use WhatsApp to share documents with the client"
      ],
      "correct": 1,
      "explain": "SharePoint with controlled external sharing is the correct Microsoft 365 approach for client collaboration. Sharing personal OneDrive creates governance and data control issues. Email is not suitable for ongoing document collaboration."
    },
    {
      "id": "q21",
      "sec": "Section H: Compliance & data handling",
      "type": "mcq",
      "text": "A client asks you to send them a copy of GoLive's internal staff salary structure to help them benchmark their own team. What do you do?",
      "opts": [
        "Send it since they are a valued client",
        "Decline politely and explain that internal HR data is confidential: offer to help them find publicly available salary benchmarking data instead",
        "Ask the MD and send it if they say yes",
        "Send only the junior staff salaries, not the senior ones"
      ],
      "correct": 1,
      "explain": "Internal HR data is strictly confidential and is never shared externally regardless of the relationship with the requester. Offering an alternative shows professionalism without compromising the company."
    },
    {
      "id": "q22",
      "sec": "Section H: Compliance & data handling",
      "type": "mcq",
      "text": "You receive an email that appears to be from GoLive's bank asking you to confirm account details by clicking a link. The email address is \"alerts@firstbankng-secure.com.\" What do you do?",
      "opts": [
        "Click the link and confirm the details as requested",
        "Do not click anything: mark the email as suspicious, report it to the MD, and verify directly with the bank using a phone number from the bank's official website",
        "Forward it to the MD and let them handle it",
        "Reply to the email asking if it is legitimate"
      ],
      "correct": 1,
      "explain": "This is a phishing email. The domain \"firstbankng-secure.com\" is not a legitimate bank domain. Never click links in suspicious emails. Always verify by calling the institution directly using contact details from their official website, not from the email itself."
    },
    {
      "id": "q23",
      "sec": "Section H: Compliance & data handling",
      "type": "tf",
      "text": "Under Nigeria's NDPA 2023, an organisation is required to notify affected individuals if their personal data is breached.",
      "correct": "True",
      "explain": "The Nigeria Data Protection Act 2023 requires organisations to notify both the Nigeria Data Protection Commission (NDPC) and affected data subjects of a breach within 72 hours of becoming aware of it. As Operations Coordinator you would be expected to understand this requirement."
    },
    {
      "id": "q24",
      "sec": "Section I: Reasoning under pressure",
      "type": "mcq",
      "text": "It is 4:30pm on a Friday. You have three things left: 1) a staff timesheet report due to the MD by 5pm, 2) a vendor who needs a purchase order approved by end of day or they cannot deliver Monday, 3) a client who called about a billing query. The MD is unreachable. What is your sequence?",
      "opts": [
        "Handle the billing query first since the client is waiting",
        "Approve the purchase order first (operational dependency for Monday delivery), send the timesheet report (hard deadline with the MD), then log the billing query with a note that it will be addressed Monday morning",
        "Work on the timesheet: it is the most important internal document",
        "Call the vendor back on Monday morning"
      ],
      "correct": 1,
      "explain": "The purchase order has an operational consequence for Monday: if it is not approved, delivery fails. The timesheet has a hard 5pm deadline. The billing query, while important, can be logged and addressed first thing Monday without immediate harm. Sequence by consequence."
    },
    {
      "id": "q25",
      "sec": "Section I: Reasoning under pressure",
      "type": "mcq",
      "text": "The MD asks you to draft a formal letter to a government ministry on company letterhead. You have never done this before and are unsure of the correct format. What do you do?",
      "opts": [
        "Draft something and hope for the right format",
        "Research the correct formal letter format for Nigerian government correspondence, draft the letter, clearly label it as a draft, and ask the MD to review before it is sent",
        "Tell the MD you cannot do it because you lack experience",
        "Copy a letter from the internet and change the names"
      ],
      "correct": 1,
      "explain": "Research, draft, label clearly, seek review: this is the correct approach for any unfamiliar task with formal or legal implications. Submitting an unchecked letter to a government ministry on company letterhead could have consequences. The MD's review before sending is non-negotiable."
    }
  ],
  "Social Media & Community Manager": [
    {
      "id": "q1",
      "sec": "Section A: Platform knowledge",
      "type": "mcq",
      "text": "Which Microsoft 365 application would you use to schedule and post approved social media content directly to LinkedIn from within the Microsoft ecosystem?",
      "opts": [
        "Microsoft Teams",
        "Microsoft Viva Engage",
        "SharePoint",
        "Microsoft Whiteboard"
      ],
      "correct": 1,
      "explain": "Viva Engage (formerly Yammer) is Microsoft's community and social platform within M365. For external scheduling, tools like Buffer or Hootsuite are used: but within M365, Viva Engage handles internal social and community features."
    },
    {
      "id": "q2",
      "sec": "Section A: Platform knowledge",
      "type": "mcq",
      "text": "GoLive wants to reach corporate decision-makers about Microsoft 365 services. Which platform should be the primary channel for this B2B audience?",
      "opts": [
        "Instagram Reels",
        "TikTok",
        "LinkedIn",
        "Snapchat"
      ],
      "correct": 2,
      "explain": "LinkedIn is the correct channel for B2B technology services targeting corporate decision-makers in Nigeria and internationally."
    },
    {
      "id": "q3",
      "sec": "Section A: Platform knowledge",
      "type": "tf",
      "text": "Posting at the same time every day, regardless of when your audience is most active, is the best approach for maximising engagement.",
      "correct": "False",
      "explain": "Post timing should be based on platform analytics showing when your specific audience is most active. This varies by platform, audience location, and day of week."
    },
    {
      "id": "q4",
      "sec": "Section A: Platform knowledge",
      "type": "mcq",
      "text": "A post on GoLive's LinkedIn page gets a comment from a prospect asking for pricing. What is the best response?",
      "opts": [
        "Ignore it: pricing should not be discussed publicly",
        "Reply with the full price list in the comments",
        "Thank them publicly and direct them to DM or a contact form for a proper conversation",
        "Delete the comment to keep the page clean"
      ],
      "correct": 2,
      "explain": "Acknowledge publicly to show responsiveness, but move the sales conversation to a private channel. Public pricing discussions can create complications and are better handled personally."
    },
    {
      "id": "q5",
      "sec": "Section A: Platform knowledge",
      "type": "mcq",
      "text": "What does \"reach\" mean in social media analytics?",
      "opts": [
        "The number of times your post was clicked",
        "The number of unique accounts that saw your post",
        "The total number of likes and comments",
        "The number of times your post was saved"
      ],
      "correct": 1,
      "explain": "Reach is the number of unique accounts that saw a piece of content. Impressions (total views, including multiple views by the same account) is different from reach."
    },
    {
      "id": "q6",
      "sec": "Section B: Content creation",
      "type": "mcq",
      "text": "GoLive is launching a new Microsoft 365 package. You need to create a LinkedIn post that explains the value without using technical jargon. The post should be:",
      "opts": [
        "Long, detailed, and technical: LinkedIn professionals appreciate depth",
        "Short, benefit-focused, and end with a clear call to action",
        "Written entirely in hashtags so it trends",
        "Copied from Microsoft's own website to ensure accuracy"
      ],
      "correct": 1,
      "explain": "LinkedIn posts that perform best are concise, benefit-led, and tell the reader what to do next. Technical depth belongs in articles or documents, not feed posts."
    },
    {
      "id": "q7",
      "sec": "Section B: Content creation",
      "type": "tf",
      "text": "Using 30 hashtags on every LinkedIn post significantly increases reach and is best practice.",
      "correct": "False",
      "explain": "LinkedIn recommends 3–5 relevant hashtags per post. Overloading hashtags looks spammy and can reduce reach. Quality and relevance matter more than quantity."
    },
    {
      "id": "q8",
      "sec": "Section B: Content creation",
      "type": "mcq",
      "text": "Your manager asks for a content calendar for the next month. What should it include?",
      "opts": [
        "Just the post text for each day",
        "Post date, platform, content type, topic, copy draft, visual description, and status",
        "Only the images: copy can be written on the day",
        "A list of hashtags to use across all posts"
      ],
      "correct": 1,
      "explain": "A proper content calendar is a planning and coordination tool. It needs enough detail for anyone to pick it up and execute: date, platform, content type, topic, copy, visual direction, and approval status."
    },
    {
      "id": "q9",
      "sec": "Section B: Content creation",
      "type": "mcq",
      "text": "A follower posts a negative comment on GoLive's Instagram saying the hosting service went down and they lost a client. What do you do first?",
      "opts": [
        "Delete the comment before anyone else sees it",
        "Reply publicly apologising and acknowledging the issue, then escalate internally to the technical team",
        "Ignore it: one comment will not affect the brand",
        "Argue with the commenter and explain it was not GoLive's fault"
      ],
      "correct": 1,
      "explain": "Respond publicly and promptly to show the brand takes feedback seriously, then escalate to the right team internally. Deleting complaints and arguing both damage trust significantly."
    },
    {
      "id": "q10",
      "sec": "Section C: Brand & strategy",
      "type": "text",
      "text": "Write a short LinkedIn post (50–80 words) announcing that GoLive Digital Solutions is now an authorised Microsoft Cloud Solution Provider (CSP) in Nigeria. The audience is Nigerian business owners and IT decision-makers.",
      "sub": "Write professionally and in a tone that is confident but not boastful. Include one call to action.",
      "placeholder": "We are excited to announce..."
    },
    {
      "id": "q11",
      "sec": "Section C: Brand & strategy",
      "type": "text",
      "text": "A client tags GoLive in an Instagram story praising the team for a smooth Microsoft 365 migration. Write a short reply (2–3 sentences) to their story.",
      "sub": "Keep it warm, professional, and on-brand.",
      "placeholder": "Thank you so much..."
    },
    {
      "id": "q12",
      "sec": "Section D: Judgement",
      "type": "mcq",
      "text": "Your manager asks you to post something immediately about a news story that appears to show a competitor in a bad light. What do you do?",
      "opts": [
        "Post it immediately: speed is everything in social media",
        "Check the story source, verify accuracy, assess reputational risk, then consult the MD before posting anything",
        "Share it to your personal account instead",
        "Repost it without comment so GoLive cannot be blamed"
      ],
      "correct": 1,
      "explain": "Reactive posts about competitors carry significant reputational risk. Verify facts, assess tone, and get senior approval before publishing anything that could be seen as attacking a competitor."
    },
    {
      "id": "q13",
      "sec": "Section D: Judgement",
      "type": "mcq",
      "text": "You notice GoLive's Instagram engagement has dropped 40% over the last two weeks with no change to posting frequency. What is your first step?",
      "opts": [
        "Post more frequently to compensate",
        "Check Instagram Insights to identify whether reach, impressions, or saves also dropped: then form a hypothesis before changing strategy",
        "Switch entirely to TikTok",
        "Ask followers in the comments what happened"
      ],
      "correct": 1,
      "explain": "Data analysis before action is the correct approach. A drop in engagement could be caused by algorithm changes, audience fatigue, poor content-timing, or platform-wide issues. Diagnose first."
    },
    {
      "id": "q14",
      "sec": "Section D: Judgement",
      "type": "tf",
      "text": "It is acceptable to repost competitor content on GoLive's official pages without permission as long as you credit the original creator.",
      "correct": "False",
      "explain": "Reposting competitor content on brand pages is poor practice regardless of credit: it amplifies their message, not yours. Content should always serve GoLive's brand objectives."
    },
    {
      "id": "q15",
      "sec": "Section E: Reasoning",
      "type": "mcq",
      "text": "GoLive has three arms: GoLive Naija, GoLive Forge, and B2B Services. As Social Media Manager, how would you approach content across these arms?",
      "opts": [
        "Create one generic GoLive feed and post the same content for all arms",
        "Create distinct content pillars for each arm within a unified GoLive brand voice: so each audience gets relevant content while the brand feels cohesive",
        "Run three completely separate social media accounts with no connection",
        "Only post about B2B Services since it generates the most revenue"
      ],
      "correct": 1,
      "explain": "Content pillars per business arm within a single brand identity is the correct strategy. It keeps the brand cohesive while ensuring each audience segment sees content relevant to their needs."
    },
    {
      "id": "q16",
      "sec": "Section F: Analytics & performance",
      "type": "mcq",
      "text": "GoLive's LinkedIn engagement rate drops from 4.2% to 1.8% over 6 weeks despite no change in posting frequency or content type. What is your first investigative step?",
      "opts": [
        "Immediately double posting frequency",
        "Check LinkedIn Analytics for changes in reach, follower demographics, and post-type performance: then cross-reference with any LinkedIn algorithm update announcements during that period",
        "Switch the entire content strategy to video immediately",
        "Ask the MD to approve a paid promotion budget"
      ],
      "correct": 1,
      "explain": "Data-led diagnosis before action is essential. A drop this significant could be algorithm-driven, audience saturation, or content fatigue. You need to understand the cause before prescribing a solution: otherwise you risk compounding the problem."
    },
    {
      "id": "q17",
      "sec": "Section F: Analytics & performance",
      "type": "mcq",
      "text": "A LinkedIn post about GoLive's Microsoft 365 services gets 850 impressions but only 4 likes and 0 comments. What does this tell you and what do you do next?",
      "opts": [
        "The content is performing well: 850 people saw it",
        "The content reached people but failed to drive engagement: analyse the hook, CTA, and format. Test a rewrite with a stronger opening line and a direct question to provoke responses",
        "Delete the post and try again",
        "Pay to boost the post immediately"
      ],
      "correct": 1,
      "explain": "High impressions with low engagement signals a reach problem solved but a resonance problem remaining. The content is being shown but not connecting. The fix is creative: stronger hook, more relatable framing, or a question that invites response."
    },
    {
      "id": "q18",
      "sec": "Section F: Analytics & performance",
      "type": "tf",
      "text": "A 5% engagement rate on an Instagram business page with 2,000 followers is considered below average for that audience size.",
      "correct": "False",
      "explain": "5% is actually a strong engagement rate for Instagram. Average engagement rates for business accounts typically sit between 1–3%. Anything above 3–5% is considered above average. Understanding benchmarks by platform and audience size is essential for accurate performance reporting."
    },
    {
      "id": "q19",
      "sec": "Section G: Crisis & reputation",
      "type": "mcq",
      "text": "A disgruntled former employee posts publicly on Twitter/X accusing GoLive of unfair treatment and names the MD directly. The post is gaining traction. What is your recommended response strategy?",
      "opts": [
        "Respond publicly defending the company immediately",
        "Do not respond publicly: escalate to the MD immediately, document the post, monitor for spread, and advise the MD that a measured private response or legal review may be appropriate depending on the severity of the claims",
        "Report the post to Twitter and block the account",
        "Repost the claims on GoLive's account with a rebuttal"
      ],
      "correct": 1,
      "explain": "Responding publicly to a disgruntled employee escalates and amplifies the situation. The correct approach is to escalate, document, monitor, and advise: not to engage publicly. Legal and HR implications must be assessed before any external response."
    },
    {
      "id": "q20",
      "sec": "Section G: Crisis & reputation",
      "type": "mcq",
      "text": "GoLive is about to launch a major Microsoft 365 campaign when a major data breach at Microsoft makes international news. How do you adjust the campaign?",
      "opts": [
        "Launch as planned: the breach has nothing to do with GoLive",
        "Pause the campaign immediately, assess whether the breach affects the specific products being promoted, and propose a revised message that addresses security proactively rather than ignoring the context",
        "Cancel the campaign entirely",
        "Post about the breach to show GoLive is aware of current events"
      ],
      "correct": 1,
      "explain": "Launching a cloud security-adjacent campaign during a high-profile breach without acknowledging the context looks tone-deaf. Pausing, assessing relevance, and pivoting the messaging to address security head-on turns the moment into a trust-building opportunity."
    },
    {
      "id": "q21",
      "sec": "Section H: Content strategy & planning",
      "type": "mcq",
      "text": "The MD asks you to build a 3-month content plan for GoLive across LinkedIn and Instagram. What framework do you use to structure it?",
      "opts": [
        "Post whatever feels relevant each week",
        "Build content pillars mapped to GoLive's three business arms (Naija, Forge, B2B), assign a posting cadence per platform, plan content types (educational, promotional, behind-the-scenes, client stories), and schedule around key dates and product launches",
        "Use the same content on both platforms since it saves time",
        "Focus only on promotional content since the goal is sales"
      ],
      "correct": 1,
      "explain": "Content pillars aligned to business objectives, platform-specific cadence, and content type variety is the correct strategic framework. Identical cross-posting ignores platform-specific audience behaviour. Random posting lacks strategic intent."
    },
    {
      "id": "q22",
      "sec": "Section H: Content strategy & planning",
      "type": "mcq",
      "text": "You are tasked with growing GoLive's LinkedIn follower count from 500 to 2,000 in 6 months organically. Which combination of tactics is most likely to achieve this?",
      "opts": [
        "Post daily and hope the algorithm rewards consistency",
        "Publish high-value thought leadership content consistently, engage actively in comments on relevant industry posts, encourage team members to share and engage with company posts, optimise the company page for SEO, and use relevant hashtags strategically",
        "Buy followers from a third-party provider",
        "Run giveaways offering cash prizes to new followers"
      ],
      "correct": 1,
      "explain": "Organic LinkedIn growth requires a multi-pronged approach: great content, active engagement, employee amplification, and page optimisation. Bought followers are a violation of LinkedIn's terms and damage credibility. Giveaways attract low-quality followers with no business intent."
    },
    {
      "id": "q23",
      "sec": "Section H: Content strategy & planning",
      "type": "tf",
      "text": "Repurposing a long-form blog post into multiple shorter social media posts, an infographic, and a short video is a poor use of content because it dilutes the original message.",
      "correct": "False",
      "explain": "Content repurposing is best practice: it maximises the value of high-quality content by adapting it to different formats and platform behaviours. A single blog post can generate weeks of social content without diluting the message. Each format reaches a different consumption preference."
    },
    {
      "id": "q24",
      "sec": "Section I: Brand voice & judgement",
      "type": "mcq",
      "text": "GoLive's MD asks you to post a strong opinion piece on LinkedIn about a controversial government technology policy. You personally disagree with the MD's position. What do you do?",
      "opts": [
        "Refuse to post it",
        "Post it as written since it is the MD's content and not your personal view: you are publishing on behalf of the company, not yourself",
        "Post your own counter-opinion on the GoLive page instead",
        "Ask the MD to post it from their personal profile instead of the company page"
      ],
      "correct": 1,
      "explain": "As Social Media Manager you publish on behalf of the brand, not yourself. The MD's position is the company's position. If you have concerns, raise them privately before publishing: but the final call belongs to leadership, not you. Publishing a counter-opinion on the company page would be a serious professional breach."
    },
    {
      "id": "q25",
      "sec": "Section I: Brand voice & judgement",
      "type": "mcq",
      "text": "You are given a monthly content budget of ₦150,000 for paid promotion. LinkedIn CPM in Nigeria averages ₦8,000. Instagram averages ₦3,500. You want to reach corporate decision-makers for the B2B Services arm and young creatives for GoLive Forge. How do you split the budget?",
      "opts": [
        "Split 50/50 between both platforms for fairness",
        "Allocate the majority to LinkedIn for the B2B decision-maker audience and a smaller portion to Instagram for GoLive Forge's creative audience: based on where each target segment is most active and most reachable cost-effectively",
        "Spend it all on Instagram since it is cheaper per impression",
        "Ask the MD to increase the budget before making any allocation decisions"
      ],
      "correct": 1,
      "explain": "Budget allocation should follow audience behaviour. Corporate decision-makers are on LinkedIn: higher CPM but better targeting. Young creatives are on Instagram: lower CPM, broader reach. Allocating by target segment rather than splitting equally or choosing the cheapest platform is the correct strategic approach."
    }
  ],
  "Hosting Support Technician": [
    {
      "id": "q1",
      "sec": "Section A: DNS & domains",
      "type": "mcq",
      "text": "A client's website is showing a \"domain not found\" error after they transferred their domain to GoLive Naija. The domain was transferred yesterday. What is the most likely cause?",
      "opts": [
        "GoLive's server is down",
        "DNS propagation has not completed yet: this can take up to 48 hours",
        "The client needs to buy the domain again",
        "The website files need to be re-uploaded"
      ],
      "correct": 1,
      "explain": "DNS propagation after a domain transfer can take 24–48 hours globally. This is normal and the client should be reassured, not panicked."
    },
    {
      "id": "q2",
      "sec": "Section A: DNS & domains",
      "type": "mcq",
      "text": "A client wants their email to route to Google Workspace. Which DNS record type do you need to update?",
      "opts": [
        "A record",
        "CNAME record",
        "MX record",
        "TXT record"
      ],
      "correct": 2,
      "explain": "MX (Mail Exchange) records control where email for a domain is delivered. Changing MX records to point to Google's mail servers routes email to Google Workspace."
    },
    {
      "id": "q3",
      "sec": "Section A: DNS & domains",
      "type": "tf",
      "text": "An A record maps a domain name to an IPv4 address.",
      "correct": "True",
      "explain": "An A record (Address record) maps a hostname to its IPv4 address. This is how domain names resolve to the server's IP address."
    },
    {
      "id": "q4",
      "sec": "Section A: DNS & domains",
      "type": "mcq",
      "text": "A client asks why their website is showing as \"Not Secure\" in the browser. What is the most likely cause?",
      "opts": [
        "Their internet connection is slow",
        "Their SSL certificate has expired or is not installed",
        "Their website has too many images",
        "Their hosting plan has expired"
      ],
      "correct": 1,
      "explain": "A \"Not Secure\" warning in browsers means the site is either not using HTTPS or the SSL certificate is missing, expired, or incorrectly configured."
    },
    {
      "id": "q5",
      "sec": "Section A: DNS & domains",
      "type": "mcq",
      "text": "What does TTL stand for in DNS, and what does it control?",
      "opts": [
        "Total Transfer Limit: controls file upload sizes",
        "Time To Live: controls how long DNS records are cached before being refreshed",
        "Transfer Time Limit: controls how long domain transfers take",
        "Traffic Threshold Level: controls server load"
      ],
      "correct": 1,
      "explain": "TTL (Time To Live) is the duration in seconds that a DNS record is cached by resolvers. Lower TTL means changes propagate faster but increase DNS query load."
    },
    {
      "id": "q6",
      "sec": "Section B: Hosting & cPanel",
      "type": "mcq",
      "text": "A client calls saying their website loads very slowly. After checking, you see the server CPU is at 95%. What is your immediate first step?",
      "opts": [
        "Tell the client to restart their computer",
        "Identify which processes or scripts are consuming the most CPU using the server's resource monitor, then escalate to senior technical staff",
        "Immediately migrate the client to a new server without investigation",
        "Increase the client's hosting plan without investigating the cause"
      ],
      "correct": 1,
      "explain": "Diagnose before acting. Identify the specific process causing the spike: it could be a rogue plugin, a traffic surge, or a malware script. Document findings before escalating."
    },
    {
      "id": "q7",
      "sec": "Section B: Hosting & cPanel",
      "type": "mcq",
      "text": "A client wants to create a new email address using their domain (e.g. info@theircompany.com). Where in cPanel do you set this up?",
      "opts": [
        "File Manager",
        "Email Accounts",
        "MySQL Databases",
        "Softaculous Apps Installer"
      ],
      "correct": 1,
      "explain": "Email Accounts in cPanel is where you create, manage, and configure email addresses for a domain hosted on the server."
    },
    {
      "id": "q8",
      "sec": "Section B: Hosting & cPanel",
      "type": "tf",
      "text": "If a client's hosting account is suspended for non-payment, their website and email stop working immediately.",
      "correct": "True",
      "explain": "A suspended hosting account takes all associated services offline: website, email, databases, and subdomains: until the account is reactivated after payment."
    },
    {
      "id": "q9",
      "sec": "Section B: Hosting & cPanel",
      "type": "mcq",
      "text": "A client reports that their website was working yesterday but now shows a blank white page. What are the first two things you check?",
      "opts": [
        "Check if the domain has expired, then check error logs for PHP or application errors",
        "Reinstall the website from scratch",
        "Call the client back and tell them to wait 24 hours",
        "Increase the server RAM immediately"
      ],
      "correct": 0,
      "explain": "A blank white page (White Screen of Death) in web hosting is typically caused by a PHP error or a failed plugin/theme update. Error logs reveal the exact cause quickly."
    },
    {
      "id": "q10",
      "sec": "Section C: Customer support",
      "type": "text",
      "text": "A client submits a ticket at 2am saying their business email is not working and they are losing customers. Write a professional support response acknowledging the issue and setting expectations.",
      "sub": "Be empathetic, clear about next steps, and professional. Do not over-promise resolution time.",
      "placeholder": "Dear [Client name]..."
    },
    {
      "id": "q11",
      "sec": "Section C: Customer support",
      "type": "text",
      "text": "You are ending your day shift and handing over to the night shift technician. Write a brief handover note covering: 2 open tickets, a scheduled maintenance window at 11pm, and a client who called twice about a slow website.",
      "sub": "Be concise and structured so the night shift technician has everything they need.",
      "placeholder": "Handover note: [Date]..."
    },
    {
      "id": "q12",
      "sec": "Section D: Judgement",
      "type": "mcq",
      "text": "During your shift a server monitoring alert fires showing disk usage at 98% on a shared hosting server. You are not authorised to delete files without approval. What do you do?",
      "opts": [
        "Ignore it: 98% is not 100%",
        "Immediately escalate to your senior technician and document the alert with timestamp, server name, and disk usage figure",
        "Delete the largest files you can find to free up space",
        "Restart the server to clear cache"
      ],
      "correct": 1,
      "explain": "Disk usage at 98% is a critical alert: at 100% the server stops functioning. Escalate immediately with full documentation. Do not take unauthorised action on shared hosting servers."
    },
    {
      "id": "q13",
      "sec": "Section D: Judgement",
      "type": "mcq",
      "text": "A client calls and claims their account was hacked and demands you reset their password immediately over the phone. What do you do?",
      "opts": [
        "Reset the password immediately to help the client",
        "Verify the caller's identity against account records first, then follow the official password reset procedure: never reset based on an unverified phone call",
        "Tell them to submit a ticket and hang up",
        "Give them the current password so they can log in"
      ],
      "correct": 1,
      "explain": "Social engineering attacks often come as urgent password reset requests. Always verify identity against account records before any security action. An unverified phone request should never trigger a password reset."
    },
    {
      "id": "q14",
      "sec": "Section D: Judgement",
      "type": "tf",
      "text": "If a client's website is hacked and contains malware, your first action should be to take the site offline immediately to prevent the malware from spreading to other hosted sites.",
      "correct": "True",
      "explain": "Malware on shared hosting can spread to other accounts on the same server. Isolating the compromised site immediately is the correct first step, followed by investigation, cleaning, and notification."
    },
    {
      "id": "q15",
      "sec": "Section E: Reasoning",
      "type": "mcq",
      "text": "GoLive Naija runs 24-hour hosting support across a day shift (8am–8pm) and night shift (8pm–6am). A client submits a critical ticket at 7:45pm. You are the day shift technician with 15 minutes left. What do you do?",
      "opts": [
        "Log off at 8pm: it is not your problem after your shift ends",
        "Immediately start working the ticket, brief the incoming night shift technician on its status before you leave, and ensure it is marked as in-progress",
        "Tell the client to wait until tomorrow morning",
        "Only look at the ticket if it takes less than 15 minutes to fix"
      ],
      "correct": 1,
      "explain": "A critical ticket 15 minutes before shift end must be triaged and handed over: not ignored. Start it, document what you have done, and give the night shift technician a clear brief. Client continuity is the priority."
    },
    {
      "id": "q16",
      "sec": "Section F: Email authentication & security",
      "type": "mcq",
      "text": "A client reports their emails are landing in recipients' spam folders despite having a valid MX record. Which DNS record is most likely missing or misconfigured?",
      "opts": [
        "A record",
        "CNAME record",
        "SPF, DKIM, or DMARC record",
        "NS record"
      ],
      "correct": 2,
      "explain": "SPF, DKIM, and DMARC are email authentication records that verify a sending domain is legitimate. Without them, emails from the domain are treated as suspicious by receiving mail servers. This is one of the most common causes of legitimate email landing in spam."
    },
    {
      "id": "q17",
      "sec": "Section F: Email authentication & security",
      "type": "mcq",
      "text": "What does DMARC stand for and what does it do?",
      "opts": [
        "Domain Mail Authentication Record Certification: certifies your domain with email providers",
        "Domain-based Message Authentication, Reporting and Conformance: tells receiving servers how to handle emails that fail SPF or DKIM checks",
        "Dynamic Mail Access and Relay Control: controls email forwarding",
        "Domain Management and Record Configuration: manages all DNS records"
      ],
      "correct": 1,
      "explain": "DMARC tells receiving mail servers what to do when an email fails SPF or DKIM authentication: reject it, quarantine it, or deliver it. It also enables reporting so domain owners can see who is sending email on their behalf."
    },
    {
      "id": "q18",
      "sec": "Section F: Email authentication & security",
      "type": "tf",
      "text": "A wildcard SSL certificate (*.golivecompany.com) covers both golivecompany.com and all its subdomains such as mail.golivecompany.com and cloud.golivecompany.com.",
      "correct": "False",
      "explain": "A wildcard certificate covers subdomains (*.golivecompany.com = mail.golivecompany.com, cloud.golivecompany.com) but does NOT cover the apex/root domain (golivecompany.com) by default. A separate SAN entry or additional certificate is required for the root domain."
    },
    {
      "id": "q19",
      "sec": "Section G: Server & performance",
      "type": "mcq",
      "text": "A shared hosting server has 200 active websites. One website is suddenly experiencing a traffic spike from a viral social media post. How could this affect other websites on the same server?",
      "opts": [
        "It has no effect: each website is isolated",
        "The traffic spike consumes server CPU and RAM resources shared across all 200 sites, potentially causing slowdowns or timeouts on unrelated websites: this is the risk of shared hosting over VPS or dedicated hosting",
        "Only websites in the same cPanel account are affected",
        "The viral website will automatically be migrated to a separate server"
      ],
      "correct": 1,
      "explain": "Shared hosting means shared resources. A traffic spike on one account can degrade performance for all other accounts on the same server. This is why high-traffic or business-critical websites should be on VPS or dedicated hosting with guaranteed resource allocation."
    },
    {
      "id": "q20",
      "sec": "Section G: Server & performance",
      "type": "mcq",
      "text": "A client's website loads in 12 seconds. After investigation you find their homepage has 45 uncompressed images totalling 18MB. What is your recommended fix?",
      "opts": [
        "Tell the client to use a faster internet connection",
        "Compress and resize the images using tools like TinyPNG or ShortPixel, implement lazy loading so images below the fold only load when scrolled to, and recommend converting images to WebP format",
        "Upgrade the client's hosting plan to a higher tier",
        "Delete half the images from the page"
      ],
      "correct": 1,
      "explain": "Image optimisation is the single most impactful performance fix for image-heavy pages. Compression, proper sizing, lazy loading, and modern formats (WebP) can reduce page load from 12 seconds to under 3 seconds without removing any content."
    },
    {
      "id": "q21",
      "sec": "Section G: Server & performance",
      "type": "mcq",
      "text": "A client wants to set up a subdomain \"shop.theirdomain.com\" pointing to a Shopify store. What DNS record do you create?",
      "opts": [
        "An MX record pointing to Shopify's servers",
        "A CNAME record pointing shop.theirdomain.com to Shopify's provided CNAME value (e.g. shops.myshopify.com)",
        "An A record pointing to the main website's IP address",
        "A TXT record with the Shopify verification code"
      ],
      "correct": 1,
      "explain": "Subdomains pointing to third-party platforms use CNAME records. Shopify provides a CNAME target value during custom domain setup. An A record would only work if pointing to a static IP, which Shopify does not use for custom storefronts."
    },
    {
      "id": "q22",
      "sec": "Section H: Advanced troubleshooting",
      "type": "mcq",
      "text": "A client reports that their website shows the correct content in Nigeria but shows an old cached version of the page to visitors in the UK. What is the most likely cause?",
      "opts": [
        "The website has two different versions for different countries",
        "A CDN (Content Delivery Network) is serving a cached version from a UK edge server that has not been purged since the last update",
        "The UK visitors' browsers have old cookies",
        "The domain DNS is not propagating correctly in Europe"
      ],
      "correct": 1,
      "explain": "CDN edge servers cache website content geographically. If the cache is not purged after a content update, visitors in different regions see different versions. The fix is to trigger a cache purge from the CDN control panel (Cloudflare, BunnyCDN, etc.) after every significant content update."
    },
    {
      "id": "q23",
      "sec": "Section H: Advanced troubleshooting",
      "type": "mcq",
      "text": "A client's WordPress site is infected with malware that is redirecting visitors to a gambling website. The client is panicking. What are your steps in order?",
      "opts": [
        "Restore from the most recent backup immediately without any other steps",
        "1) Take the site offline to prevent further visitor harm, 2) notify the client, 3) identify and remove the malicious code using a malware scanner, 4) harden the installation (update WordPress, plugins, change passwords, remove unknown admin users), 5) restore or clean the site, 6) scan again before bringing it back online",
        "Tell the client to delete their website and start again",
        "Change the WordPress admin password and hope the malware stops"
      ],
      "correct": 1,
      "explain": "Malware remediation has a specific sequence: isolate, identify, clean, harden, verify, restore. Taking it offline first prevents ongoing harm to visitors. Simply restoring from backup without removing the vulnerability means the site will be reinfected immediately."
    },
    {
      "id": "q24",
      "sec": "Section I: Shift operations",
      "type": "mcq",
      "text": "During your shift you receive 8 support tickets simultaneously: 3 are \"website down\" reports, 2 are email configuration requests, 2 are billing queries, and 1 is a general enquiry. How do you triage?",
      "opts": [
        "Work through them in the order they were received",
        "Prioritise the 3 \"website down\" tickets first (highest business impact), then email configuration (blocks business communication), then billing queries (financial impact), then general enquiry: escalate if the website down tickets require senior intervention",
        "Handle the easiest ones first to clear the queue quickly",
        "Assign all tickets to the next shift"
      ],
      "correct": 1,
      "explain": "Triage by business impact, not arrival order. A website down is the highest severity: it means a business is losing revenue and credibility every minute. Email configuration is second because it blocks communication. Billing queries are third. General enquiries have the least urgency."
    },
    {
      "id": "q25",
      "sec": "Section I: Shift operations",
      "type": "mcq",
      "text": "It is 3am on your night shift. The server monitoring system alerts you that a shared hosting server's RAM is at 92% and rising. You do not have permission to restart services unilaterally. There is no response from your senior on WhatsApp. What do you do?",
      "opts": [
        "Restart the server immediately to prevent it crashing",
        "Document the alert with full details and timestamp, attempt to reach the senior via phone call (not just WhatsApp), escalate to the next available contact in the escalation chain, and monitor the situation closely every 5 minutes: do not take unauthorised action on a live production server",
        "Go to sleep and document it in the morning handover",
        "Wait and see if it resolves itself"
      ],
      "correct": 1,
      "explain": "A live shared hosting server at 92% RAM is critical but does not yet require unauthorised action. Escalate aggressively through all available channels: phone call, not just WhatsApp. Document everything. If RAM hits 100% and the senior is still unreachable, most escalation policies allow for defined emergency actions: but only if documented in the escalation procedure."
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
  ]
}

export const BANKS: Record<string, RoleBank> = {
  'Operations Coordinator':           { minutes: 30, draw: null, version: 'ops-v1',     questions: QUESTIONS['Operations Coordinator'] },
  'Social Media & Community Manager': { minutes: 30, draw: null, version: 'social-v1',  questions: QUESTIONS['Social Media & Community Manager'] },
  'Hosting Support Technician':       { minutes: 30, draw: null, version: 'hosting-v1', questions: QUESTIONS['Hosting Support Technician'] },
  'Sales & Support Associate':        { minutes: 35, draw: 25,   version: 'sales-v2',   questions: QUESTIONS['Sales & Support Associate'] },
}

export const getBank = (role: string): RoleBank | null => BANKS[role] || null
