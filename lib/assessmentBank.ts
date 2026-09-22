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
      "id": "q1",
      "sec": "Section A: Microsoft 365 product knowledge",
      "type": "mcq",
      "text": "A client currently uses Gmail and Google Drive for their 5-person team. They want to switch to Microsoft 365. Which plan would you recommend as the starting point and why?",
      "opts": [
        "Microsoft 365 Business Premium: it is the most comprehensive plan",
        "Microsoft 365 Business Basic: it provides Exchange Online email, Teams, SharePoint, and OneDrive at the lowest cost, suitable for a small team starting out",
        "Microsoft 365 F1: it is the cheapest plan available",
        "Microsoft 365 Apps for Business: it includes the desktop Office apps without email"
      ],
      "correct": 1,
      "explain": "Business Basic is the correct entry point for a small team migrating from Google: it covers email, Teams, SharePoint, and OneDrive at the lowest cost. Premium adds security features that are justified at higher risk profiles or larger organisations."
    },
    {
      "id": "q2",
      "sec": "Section A: Microsoft 365 product knowledge",
      "type": "mcq",
      "text": "A client asks: \"What is Microsoft Teams and do I need it if I already use WhatsApp for team communication?\" How do you respond?",
      "opts": [
        "Tell them Teams and WhatsApp are the same thing",
        "Explain that Teams is a professional collaboration platform that integrates with their Microsoft 365 files, meetings, and email: giving them searchable history, file sharing, and video calls in one secure place that WhatsApp cannot offer for business",
        "Tell them Teams is only for video calls",
        "Tell them WhatsApp is better and they should keep using it"
      ],
      "correct": 1,
      "explain": "The correct response positions Teams's business value: integration, searchability, security, and compliance: versus WhatsApp's limitations for professional use."
    },
    {
      "id": "q3",
      "sec": "Section A: Microsoft 365 product knowledge",
      "type": "tf",
      "text": "A Microsoft 365 Business Basic licence includes the full desktop versions of Word, Excel, and PowerPoint installed on the user's computer.",
      "correct": "False",
      "explain": "Business Basic is web and mobile only: it does not include the installed desktop Office applications. Business Standard and above include the full desktop apps."
    },
    {
      "id": "q4",
      "sec": "Section A: Microsoft 365 product knowledge",
      "type": "mcq",
      "text": "A client has 12 staff members. They want Microsoft 365 Business Standard. As a CSP, GoLive purchases at the distributor price and sells to the client. What is your role in provisioning their licences?",
      "opts": [
        "The client must buy directly from Microsoft",
        "GoLive orders the licences through the distributor (4Sight/Pax8), provisions them in the client's tenant, and invoices the client at the agreed reseller price",
        "GoLive has no role: the distributor deals with the client directly",
        "The client buys the licences and GoLive installs them for free"
      ],
      "correct": 1,
      "explain": "As a CSP Indirect Reseller, GoLive orders from the distributor, provisions the licences in the client tenant, and manages the ongoing relationship. This is the core of the CSP business model."
    },
    {
      "id": "q5",
      "sec": "Section A: Microsoft 365 product knowledge",
      "type": "mcq",
      "text": "A client asks what happens to their data if they stop paying for Microsoft 365. What do you tell them?",
      "opts": [
        "Their data is deleted immediately when payment stops",
        "Microsoft keeps their data for 90 days after subscription expiry in a disabled state before permanent deletion: they can export or reactivate within that window",
        "Their data is transferred to a free OneDrive account automatically",
        "Nothing happens: they can access everything indefinitely"
      ],
      "correct": 1,
      "explain": "Microsoft retains data for 90 days in a disabled state after subscription lapse. This grace period allows recovery but clients should be advised to export data if they plan to leave."
    },
    {
      "id": "q6",
      "sec": "Section B: Sales process",
      "type": "mcq",
      "text": "A prospect says: \"Microsoft 365 is too expensive for our small business.\" How do you respond?",
      "opts": [
        "Agree with them and suggest they try a free alternative",
        "Immediately offer a discount",
        "Break down the per-user monthly cost (as low as $6/user/month for Business Basic) against what they currently spend on separate email, storage, and communication tools: showing the consolidated value",
        "Tell them to come back when they have more budget"
      ],
      "correct": 2,
      "explain": "The correct response reframes cost as value and uses the price breakdown to show M365's total cost is often lower than the sum of separate tools the client is already paying for."
    },
    {
      "id": "q7",
      "sec": "Section B: Sales process",
      "type": "mcq",
      "text": "You sent a proposal to a prospect 5 days ago and have not heard back. What do you do?",
      "opts": [
        "Wait another 2 weeks before following up",
        "Send one polite follow-up email referencing the proposal, asking if they have questions and offering a brief call to walk through it",
        "Call them every day until they respond",
        "Mark the lead as lost and move on"
      ],
      "correct": 1,
      "explain": "One timely, value-added follow-up is the correct approach. Reference the proposal specifically, offer to help with questions, and keep it brief. Multiple daily calls are intrusive and damage the relationship."
    },
    {
      "id": "q8",
      "sec": "Section B: Sales process",
      "type": "tf",
      "text": "Once a client has signed up for Microsoft 365 through GoLive, your involvement with that client ends: the distributor handles everything from that point.",
      "correct": "False",
      "explain": "As the CSP reseller, GoLive owns the ongoing client relationship: renewals, support escalations, licence changes, and upsell conversations. The distributor handles backend provisioning, not the client relationship."
    },
    {
      "id": "q9",
      "sec": "Section B: Sales process",
      "type": "mcq",
      "text": "A current GoLive Microsoft 365 client emails saying they want to reduce their licences from 20 to 8 because they made redundancies. What is your first step?",
      "opts": [
        "Reduce the licences immediately without asking any questions",
        "Acknowledge the request, check whether they are on an annual or monthly commitment (annual commitments cannot reduce mid-term: seats can only be added, not removed), then advise accordingly",
        "Tell them they cannot reduce licences under any circumstances",
        "Immediately cancel their entire subscription"
      ],
      "correct": 1,
      "explain": "Annual NCE commitments allow adding licences but not reducing them mid-term. You must check the commitment type first before advising the client: giving wrong information could cause a billing dispute."
    },
    {
      "id": "q10",
      "sec": "Section C: Communication",
      "type": "text",
      "text": "A prospect contacted GoLive via the website enquiry form asking about Microsoft 365 for their 15-person logistics company. Write a professional first-response email introducing GoLive and asking 2–3 qualifying questions.",
      "sub": "Be warm, professional, and concise. Position GoLive credibly without overwhelming them with information.",
      "placeholder": "Dear [Name]..."
    },
    {
      "id": "q11",
      "sec": "Section C: Communication",
      "type": "text",
      "text": "A client is unhappy because their Microsoft 365 email setup took 3 days longer than the 2-day turnaround you quoted them. They are threatening to cancel. Write a short email response.",
      "sub": "Acknowledge the issue, take responsibility where appropriate, and focus on resolution rather than excuses.",
      "placeholder": "Dear [Client name]..."
    },
    {
      "id": "q12",
      "sec": "Section D: Judgement",
      "type": "mcq",
      "text": "During a discovery call a prospect mentions they handle sensitive medical records for a hospital. Which Microsoft 365 plan feature becomes particularly important to highlight?",
      "opts": [
        "The lower price of Business Basic",
        "The compliance and data protection features in Business Premium: specifically Microsoft Purview for data governance and Defender for Business for security",
        "The number of free Teams backgrounds",
        "The storage size of OneDrive"
      ],
      "correct": 1,
      "explain": "Healthcare clients handling sensitive data need to hear about compliance, security, and data governance: not price. Business Premium's advanced compliance features (Purview, Defender) are directly relevant to their regulatory obligations."
    },
    {
      "id": "q13",
      "sec": "Section D: Judgement",
      "type": "mcq",
      "text": "A prospect tells you a competitor is offering Microsoft 365 at a significantly lower price than GoLive. How do you respond?",
      "opts": [
        "Immediately match the price without asking any questions",
        "Ask what is included in the competitor's price, then clearly differentiate GoLive's value: local support, onboarding assistance, ongoing account management, and GoLive's CSP credentials",
        "Tell them the competitor's offering is probably fake",
        "Give up and mark the lead as lost"
      ],
      "correct": 1,
      "explain": "Understand the competitor's offer first, then differentiate on value rather than competing on price alone. GoLive's local presence, proper onboarding, and ongoing support are genuine differentiators in the Nigerian market."
    },
    {
      "id": "q14",
      "sec": "Section D: Judgement",
      "type": "tf",
      "text": "It is acceptable to verbally commit to a price or service level with a client before checking with the MD, as long as you follow up in writing afterwards.",
      "correct": "False",
      "explain": "Verbal commitments are legally binding. Never promise a price or service level without confirming it is approved. If uncertain, tell the client you will confirm within a short timeframe: then get approval before committing."
    },
    {
      "id": "q15",
      "sec": "Section E: Reasoning",
      "type": "mcq",
      "text": "You have three active leads in your pipeline: Lead A needs a callback today, Lead B submitted a proposal request an hour ago, Lead C has not responded to two follow-up emails in two weeks. How do you prioritise your next 2 hours?",
      "opts": [
        "Work on Lead C first since they have been waiting the longest",
        "Call Lead A immediately (committed deadline), then respond to Lead B's proposal request (fresh interest, highest conversion probability), then make a final follow-up decision on Lead C",
        "Work on Lead B first since they just came in",
        "Archive Lead C and focus only on A and B"
      ],
      "correct": 1,
      "explain": "Lead A has a committed deadline: that is non-negotiable. Lead B has fresh intent and high conversion probability. Lead C has shown low engagement and should be assessed for a final follow-up or archiving, but only after the higher-priority tasks."
    }
  ]
}

export const BANKS: Record<string, RoleBank> = {
  'Operations Coordinator':           { minutes: 30, draw: null, version: 'ops-v1',     questions: QUESTIONS['Operations Coordinator'] },
  'Social Media & Community Manager': { minutes: 30, draw: null, version: 'social-v1',  questions: QUESTIONS['Social Media & Community Manager'] },
  'Hosting Support Technician':       { minutes: 30, draw: null, version: 'hosting-v1', questions: QUESTIONS['Hosting Support Technician'] },
  'Sales & Support Associate':        { minutes: 30, draw: null, version: 'sales-v1',   questions: QUESTIONS['Sales & Support Associate'] },
}

export const getBank = (role: string): RoleBank | null => BANKS[role] || null
