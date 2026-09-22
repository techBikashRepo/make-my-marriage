# Make My Marriage

**Product Requirements Document**

**Version:** V1.1  
**Status:** Approved for System Design - Reconciled Baseline  
**Product Type:** Web Application  
**Primary Market:** Indian Weddings

## 0. Document Control and Alignment

This document is the current product-requirements source of truth for **Make My Marriage V1/MVP**. It preserves the approved product scope and reconciles the architecture-impacting decisions agreed after the original V1 PRD.

**Supersedes:** Make My Marriage PRD V1  
**Baseline purpose:** Product requirements + approved V1 technical constraints  
**System Design status:** Ready after approval of this reconciled PRD

### 0.1 Reconciled Decisions Included in V1.1

- Direct signup followed by **Create Wedding** or **Join Wedding**.
- No email ownership verification in V1; basic email syntax validation and uniqueness are still required.
- Wedding Member invite acceptance does not require email ownership verification.
- Wedding location data includes structured location information including latitude and longitude.
- Product analytics tooling is excluded from the MVP; success metrics remain defined for future instrumentation.
- No external observability/monitoring product is required initially; V1 uses basic structured application/server logs.
- Cloudflare R2 is the approved media store, with direct client uploads using signed upload URLs.
- Resend is the approved email provider. Bulk email uses lightweight MongoDB-backed batching in small batches rather than dedicated queue infrastructure.
- Vendor discovery uses Google Places and defaults to the Wedding's saved location while allowing an organizer to change the search location.
- Wedding website URLs use couple names plus wedding date, with collision handling for edge cases.
- Each Wedding has one shared private gallery link and one stable QR code; invitation links remain unique per Guest.
- Guest-uploaded photos publish immediately after validation; no moderation queue is required.
- Billing/subscriptions are outside V1 until pricing and plan requirements are defined.
- Production database backups use MongoDB Atlas managed backups; no custom backup platform is required in V1.
- Deletion behavior is domain-specific rather than soft-delete-everywhere, while preserving dependency checks and destructive-action safeguards.

## 1. Product Overview

### 1.1 Product Name

Make My Marriage

### 1.2 Product Vision

Make My Marriage is a digital wedding management platform that helps couples and their families collaboratively plan and manage an Indian wedding from one place.

Indian weddings involve multiple events, dozens of tasks, many family members, hundreds of guests, vendors, expenses, invitations, photos, and several moving pieces.

Most families currently manage this using a combination of:

- WhatsApp groups

- Excel sheets

- Notes

- Phone calls

- Google Docs

- Paper lists

- Different vendor conversations

- Shared photo folders

Make My Marriage brings these activities together inside one structured wedding workspace.

The product should feel like:

The operating system for managing an Indian wedding.

## 2. Problem Statement

Planning an Indian wedding is collaborative but highly fragmented.

A typical wedding may involve:

- Bride and groom

- Parents

- Siblings

- Cousins

- Friends

- Multiple wedding events

- Hundreds of guests

- Multiple vendors

- Many expenses

- Invitations and RSVPs

- Wedding photos

- Livestream requirements

- Constant coordination

There is usually no single source of truth.

One family member tracks guests in Excel.

Someone else tracks expenses.

Tasks are discussed inside WhatsApp groups.

Vendor details are stored in individual phones.

Invitations are shared separately.

Wedding photos get scattered across dozens of devices after the wedding.

Make My Marriage aims to solve this by providing one central wedding workspace.

## 3. Target Users

### 3.1 Primary Users

The primary users are:

- Bride

- Groom

- Parents

- Siblings

- Close family members

- Trusted friends helping organize the wedding

These users will create accounts and access the wedding management dashboard.

They will collectively be called:

**Wedding Members**

## 4. User Types

There are only three user types in V1.

### 4.1 Admin

Admin has access to the entire wedding workspace.

Admin can:

- Manage wedding information

- Create and manage events

- Create and manage tasks

- Manage guests

- Send invitations

- Track RSVP

- Manage expenses

- Manage vendors

- Discover vendors

- Manage wedding website

- Manage gallery

- Upload photos

- Configure livestream

- Manage Wedding Members

The key difference between Admin and Manager is:

Only Admin can manage other Wedding Members.

Multiple Admins should be supported.

For example:

- Bride: Admin

- Groom: Admin

### 4.2 Manager

Managers are family members or trusted people helping organize the wedding.

Managers can access almost everything an Admin can.

Managers cannot:

- Add Wedding Members

- Remove Wedding Members

- Change another member's role

Everything else remains accessible.

### 4.3 Guest

Guests do not have accounts.

Guests do not log in.

Guests interact with Make My Marriage using secure unique links.

A guest may:

- Open their wedding invitation

- View events they are invited to

- RSVP

- Specify how many people are attending

- View wedding information

- View the private wedding gallery

- Upload wedding photos

## 5. Core Product Rules

The following rules apply to V1.

**Rule 1**  
One user can belong to only **one wedding**.

**Rule 2**  
One wedding can have multiple Wedding Members.

**Rule 3**  
A wedding can have multiple Admins and Managers.

**Rule 4**  
Guests never require accounts.

**Rule 5**  
The Wedding is the primary workspace around which all other product data exists.

**Rule 6**  
All Admins and Managers can see the same wedding data.

There are no private expenses, private tasks, or department-specific permissions.

**Rule 7**  
The product does not support professional wedding planners managing multiple weddings in V1.

**Rule 8**  
Account creation and Wedding Member invite acceptance do not require email ownership verification in V1. Basic email syntax validation and email uniqueness are still required.

**Rule 9**  
After signup, an authenticated user must proceed through one of two paths: **Create Wedding** or **Join Wedding**. Joining an existing Wedding requires a valid Wedding Member invitation.

**Rule 10**  
The system must never allow a Wedding to have zero Admins. Role changes and member removal must preserve at least one Admin.

**Rule 11**  
Guests remain login-free. Guest invitation URLs are unique per Guest, while the private gallery link and QR code are shared at the Wedding level.

## 6. Product Goals

Make My Marriage V1 should allow a family to successfully manage the core activities of a wedding from beginning to end.

The product should enable users to:

1.  Set up their wedding.

2.  Invite family members to help manage it.

3.  Plan multiple wedding events.

4.  Create and assign wedding tasks.

5.  Maintain a guest list.

6.  Send digital invitations.

7.  Collect RSVPs.

8.  Track wedding expenses.

9.  Maintain vendor information.

10. Discover nearby vendors.

11. Create a simple wedding website.

12. Share wedding photos privately.

13. Allow guests to contribute photos.

14. Generate a QR code for photo sharing.

15. Embed a YouTube wedding livestream.

## 7. Non-Goals

The following functionality is explicitly outside V1.

Make My Marriage V1 will **NOT** include:

- Multiple weddings per user

- Wedding planner business accounts

- Complex role-based permissions

- Guest accounts

- Family household modelling

- Individual tracking of every family member

- Accommodation management

- Hotel room allocation

- Flight or train tracking

- Airport pickup management

- Vehicle management

- Wedding budget planning

- Budget allocation

- Budget limits

- Split expenses

- Payment installment tracking

- Vendor payment schedules

- Vendor marketplace transactions

- Vendor booking through Make My Marriage

- Vendor payments

- WhatsApp API integration

- SMS integrations

- Push notifications

- In-app notification center

- Real-time collaborative updates

- Activity logs

- Drag-and-drop website builder

- Product analytics tooling in the MVP

- External observability / application monitoring SaaS in the initial V1

- Subscription billing and plan-management flows until pricing is defined

- Dedicated queue infrastructure such as Kafka, RabbitMQ, SQS, or Redis-backed job queues

These may become future releases where applicable.

## 8. Primary User Journey

A typical Make My Marriage journey should look like this.

**Step 1: Signup**  
A bride, groom, family member, or invited Wedding Member creates an account using name, email, and password. Basic email syntax and uniqueness are validated, but no email ownership verification is required in V1.

**Step 2: Create or Join Wedding**  
After signup, the user chooses one of the available paths:

- **Create Wedding** - create a new Wedding workspace and become its first Admin.
- **Join Wedding** - accept a valid Wedding Member invitation and join the existing Wedding as the invited role.

When creating a Wedding, the user enters:

- Bride name
- Groom name
- Wedding date
- Wedding location
- Latitude and longitude for the saved Wedding location
- Wedding title
- Optional wedding cover

The creator automatically becomes Admin.

**Step 3: Add Wedding Members**  
An Admin can invite:

- Bride
- Groom
- Parents
- Siblings
- Other family members or trusted organisers

An invited person may sign up or log in and then accept the invitation. Email ownership verification is not required for invite acceptance in V1.

**Step 4: Add Events**  
The family creates:

- Engagement

- Mehendi

- Haldi

- Sangeet

- Cocktail

- Wedding

- Reception

or custom events.

**Step 5: Add Tasks**  
Tasks are created and assigned to Wedding Members.

**Step 6: Add Guests**  
Guest information is imported or added manually.

**Step 7: Send Invitations**  
Unique invitation links are generated.

Invitations are sent through email or manually shared through WhatsApp.

**Step 8: Receive RSVPs**  
Guests confirm attendance without logging in.

**Step 9: Manage Vendors**  
Wedding Members store booked vendors and discover nearby vendors.

**Step 10: Track Expenses**  
Wedding Members record expenses as money is spent.

**Step 11: Publish Wedding Website**  
The family chooses a theme and publishes a simple wedding website.

**Step 12: Configure Livestream**  
The family adds a YouTube Live URL.

**Step 13: Share Wedding QR**  
A QR code is generated and displayed during the wedding.

Guests scan it to view or upload photos.

**Step 14: Wedding Gallery**  
Organisers and guests contribute photos to a shared private gallery.

## 9. Feature Requirements

### 9.1 Authentication

**Requirements**

Wedding Members should be able to:

- Sign up
- Log in
- Log out
- Reset forgotten passwords

Signup requires:

- Name
- Email
- Password

V1 authentication rules:

- Email addresses must be unique.
- Basic email syntax must be validated.
- Email ownership verification is **not required** in V1.
- No verification email, verification OTP, or mandatory verification-link step is required before the user can use the application.
- After signup, the authenticated user proceeds to **Create Wedding** or **Join Wedding**.
- Guests are excluded from authenticated account flows.

### 9.2 Wedding Creation

After signing up, a user who is not yet part of a Wedding should be presented with two paths: **Create Wedding** or **Join Wedding**. Join Wedding is available through a valid Wedding Member invitation.

For **Create Wedding**, required information is:

- Bride name
- Groom name
- Wedding date
- Wedding city/location or display location
- Latitude
- Longitude

Optional information:

- Wedding title
- Description
- Cover image
- Full formatted address or place reference where available

**Example:**

Akshay ❤️ Princi

14 February 2027

Dehradun, Uttarakhand

Latitude / Longitude: saved with the Wedding location

The person creating the Wedding becomes its first Admin.

The Wedding is the tenant/workspace boundary for all Wedding-owned data.

### 9.3 Wedding Dashboard

The dashboard serves as the wedding command center.

It should display important information without requiring users to navigate through every module.

**Summary Information**

Potential dashboard cards:

- Number of events

- Tasks completed / total tasks

- Total guests

- RSVP responses

- Total expenses

- Number of vendors

**Example:**

42 Days to Go

Events: 6

Tasks: 32 / 48 completed

Guests: 186

RSVPs: 132

Expenses: ₹12,45,000

Vendors: 8

**Dashboard Sections**

**Upcoming Events**  
Display nearest upcoming wedding events.

**Upcoming Tasks**  
Display incomplete tasks approaching their due dates.

**Wedding Countdown**  
Show days remaining until the primary wedding date.

The dashboard should remain primarily informational.

No advanced analytics are required.

### 9.4 Wedding Member Management

Admin should be able to access:

**Settings → Wedding Members**

Admin can:

- Invite member
- View members
- Remove member
- Change role

Possible roles:

- Admin
- Manager

An invitation should be sent through email.

The invited person may either create an account or log in to an existing account and then accept the invitation to join the existing Wedding. Email ownership verification is not required for acceptance in V1.

Managers cannot access Wedding Member administration.

Role changes between Admin and Manager are supported, but the application must never allow the final Admin to be demoted or removed. A Wedding must always retain at least one Admin.

### 9.5 Wedding Events

Wedding Members can create multiple events.

**Event Fields**

Each event should support:

- Event name

- Date

- Start time

- End time

- Venue name

- Address

- Description

- Dress code

- Cover image

**Suggested Event Types**

The UI may provide shortcuts for:

- Roka

- Engagement

- Mehendi

- Haldi

- Sangeet

- Cocktail

- Wedding

- Reception

Users must also be able to create:

**Custom Event**

Events should be editable and deletable.

### 9.6 Task Management

Wedding Members can create and manage tasks.

**Task Fields**

- Title

- Description

- Assigned Wedding Member

- Related Event

- Due date

- Priority

- Status

**Status**

- To Do

- In Progress

- Completed

**Priority**

- Low

- Medium

- High

**Task Views**

Users should be able to view:

- All Tasks

- My Tasks

- Completed Tasks

Useful filtering:

- Status

- Event

- Assigned member

- Priority

Tasks do not require comments, attachments, subtasks, dependencies, or complex project management functionality in V1.

### 9.7 Guest Management

Wedding Members can maintain the wedding guest list.

**Guest Fields**

- Name

- Email

- Phone number

- Maximum guests allowed

- Events invited to

- RSVP status

- Number attending

- Notes

Phone number can be optional for V1 because automated WhatsApp/SMS communication is not currently supported.

**RSVP Status**

- Pending

- Attending

- Not Attending

A guest represents one invitation rather than every individual family member.

**Example:**

Rajesh Sharma

Maximum guests allowed: 4

Rajesh may respond:

**Attending with 3 people**

The other three family members do not require separate records.

### 9.8 Event-Level Invitations

A guest may be invited to only selected wedding events.

**Example:**

Rajesh Sharma:

- Mehendi: No

- Haldi: No

- Cocktail: Yes

- Wedding: Yes

- Reception: Yes

The invitation page should only display events that the particular guest is invited to.

### 9.9 Invitation Links

Every guest should receive a secure unique invitation link.

**Example:**

makemymarriage.com/invite/X7K29P

The link should identify:

- Wedding

- Guest

- Events guest is invited to

Guests should not be required to log in.

Links should use sufficiently unpredictable tokens so guests cannot easily guess another person's invitation URL.

### 9.10 Digital Invitation

The invitation experience should display:

- Couple names

- Wedding branding

- Welcome message

- Invited events

- Event dates

- Event times

- Venues

- RSVP form

**Example:**

**Akshay & Princi**

would love for you to celebrate their wedding with them.

**Wedding**

14 February 2027

8:00 PM

XYZ Resort, Dehradun

### 9.11 RSVP

Guest should be able to respond from the invitation page.

**Questions:**

**Will you be attending?**

- Yes

- No

If yes:

**How many people will attend?**

Maximum should be limited to the number specified by the organiser.

**Example:**

Allowed guests: 4

Guest can choose:

1

2

3

4

Guest cannot choose 5.

The RSVP may be edited later using the same invitation link.

No account should be required.

### 9.12 Email Invitations

Wedding Members should be able to send wedding invitations via email.

The email should contain:

- Couple names

- Short invitation message

- Wedding date

- Link to invitation

The system should record whether an invitation has been sent.

Wedding Members should also be able to resend invitations.

### 9.13 RSVP Email Reminders

Wedding Members should be able to identify guests whose RSVP status is still Pending.

The system should provide an option such as:

**Send Reminder**

or:

**Send Reminder to Pending Guests**

The reminder is sent through email.

Automated scheduled reminder workflows are not necessary for the first implementation.

### 9.14 WhatsApp Sharing

The product should provide a:

**Share on WhatsApp**

button.

The button opens WhatsApp with a pre-filled message containing the guest's invitation URL.

No WhatsApp API integration is required.

Make My Marriage does not automatically send WhatsApp messages in V1.

### 9.15 Expense Tracker

The Expense Tracker records money already spent or committed for the wedding.

It is not a budgeting system.

**Expense Fields**

- Expense title

- Amount

- Date

- Category

- Related Event

- Related Vendor

- Notes

Related Event and Related Vendor may be optional.

**Suggested Categories**

- Venue

- Catering

- Photography

- Videography

- Decoration

- Clothing

- Jewellery

- Entertainment

- Invitations

- Gifts

- Travel

- Makeup

- Miscellaneous

Wedding Members can:

- Add expenses

- Edit expenses

- Delete expenses

- View all expenses

- Filter expenses

**Expense Overview**

Display:

**Total Wedding Expense**

**Example:**

₹17,42,500

Optional visual breakdown:

Venue: ₹6,00,000

Catering: ₹4,20,000

Photography: ₹1,80,000

No budget or variance calculations should exist.

### 9.16 My Vendors

Wedding Members can maintain a list of vendors selected for the wedding.

**Vendor Fields**

- Vendor name

- Category

- Contact person

- Phone number

- Email

- Address

- Website

- Total agreed cost

- Related Events

- Notes

**Vendor Categories**

Examples:

- Photographer

- Videographer

- Venue

- Caterer

- Decorator

- DJ

- Makeup Artist

- Mehendi Artist

- Pandit

- Choreographer

- Florist

- Wedding Planner

- Transport

- Other

No vendor payment schedule is required.

### 9.17 Vendor Discovery

Wedding Members should be able to discover local vendors.

**Default search location**

Vendor discovery should default to the Wedding's saved location, including its latitude/longitude when available. The organiser must also be able to change the search location for an individual search.

**Example:**

**Wedding Photographers near Dehradun**

Potential categories:

- Photographers
- Wedding venues
- Caterers
- Makeup artists
- Florists
- Decorators
- DJs

Google Places API is the approved V1 provider for local-business discovery.

Potential data displayed:

- Vendor name
- Rating
- Address
- Distance where available
- Contact information where available

Users should be able to take a discovered vendor and add it to:

**My Vendors**

Make My Marriage itself does not process vendor bookings or payments.

### 9.18 Wedding Website

Each wedding should have a hosted wedding website.

**URL requirement**

The Wedding website should use a readable slug based on the couple names and wedding date to reduce collisions.

**Example:**

makemymarriage.com/w/akshay-princi-2027-02-14

If a collision still occurs, the system should append a small unique suffix while preserving readability. Custom domains are not required in V1.

The wedding website is different from the private guest invitation.

It contains general wedding information.

**Website Sections**

**Hero**

- Couple names

- Wedding date

- Cover photo

**Welcome**

- Short message

- Optional description

**Events**

- Event name

- Date

- Time

- Venue

- Dress code

- Map link

**Gallery**  
Display wedding photos if gallery sharing is enabled.

**Livestream**  
Display YouTube livestream if configured.

### 9.19 Wedding Website Themes

Users should not manually design their website.

Instead they select from approximately three predefined themes.

**Example themes:**

**Classic Indian**  
Traditional, decorative wedding aesthetic.

**Minimal Elegant**  
Clean typography and elegant layout.

**Modern Celebration**  
Contemporary, colourful design.

All themes use the same underlying wedding information.

Changing the theme should change presentation rather than content.

### 9.20 Wedding Photo Gallery

Each Wedding has a private gallery.

V1 uses one shared private gallery link for the entire Wedding. The same stable gallery/upload destination is used by the Wedding QR code. Guest invitation URLs remain unique per Guest and are separate from this shared gallery link.

The gallery should not be publicly searchable.

Wedding Members can:

- Upload photos

- View photos

- Delete photos

- Share gallery link

- Download photos

Guests with the gallery link can:

- View photos

- Upload photos

Guest deletion permissions are not required.

### 9.21 Gallery Albums

Photos should optionally be grouped by wedding event.

**Example:**

- Mehendi

- Haldi

- Sangeet

- Wedding

- Reception

When uploading photos, organisers or guests may select the associated event.

An additional general category can exist:

**Other / Wedding Memories**

### 9.22 Guest Photo Upload

Guests should be able to upload wedding photos without authentication.

The upload experience should be designed primarily for mobile devices.

**Flow:**

1.  Guest opens gallery/upload link.

2.  Guest selects photos from phone.

3.  Guest optionally chooses event.

4.  Guest uploads photos.

5.  The upload is validated and completed.

6.  Photos appear in the wedding gallery immediately after successful validation; no moderation/approval queue is required in V1. Wedding Members retain delete capability.

Because uploads happen without authentication, appropriate technical safeguards such as file type validation, size restrictions, upload limits, secure upload URLs, and rate controls should be implemented during technical design. The approved media architecture uses direct client-to-Cloudflare-R2 uploads through signed upload URLs issued by the Next.js API, rather than proxying large photo binaries through the application server.

### 9.23 Wedding QR Code

Each Wedding should have one stable shared QR code that opens the private Wedding gallery/upload experience.

**Example printed message:**

**Share the Memories 📸**

Scan to upload and view photos from Akshay & Princi's wedding.

Wedding Members should be able to:

- View QR code

- Download QR code

- Print/share QR code

The QR code should use a stable URL so previously printed QR codes continue working.

### 9.24 YouTube Livestream

Wedding Members should be able to configure a YouTube livestream.

They provide:

- YouTube Live URL

The wedding website displays the embedded player when configured.

No video streaming infrastructure should be built by Make My Marriage.

Wedding Members should be able to:

- Add livestream

- Update livestream URL

- Remove livestream

### 9.25 Settings

Settings should include several simple sections.

**Wedding Details**

Edit:

- Bride name

- Groom name

- Wedding date

- Location

- Cover image

- Description

**Wedding Members**

Admin only.

Manage:

- Admins

- Managers

**Website**

Configure:

- Theme

- Content

- Publish status

**Gallery**

Manage:

- Gallery visibility

- Guest upload availability

**Livestream**

Manage:

- YouTube Live URL

## 10. Main Application Navigation

Suggested dashboard navigation:

- **Dashboard**

- **Events**

- **Tasks**

- **Guests**

  - Guest List

  - Invitations

  - RSVP

- **Expenses**

- **Vendors**

  - My Vendors

  - Discover Vendors

- **Wedding Website**

- **Photos**

  - Gallery

  - Guest Upload

  - QR Code

- **Live Stream**

- **Settings**

  - Wedding Details

  - Wedding Members

*Navigation can be simplified later during UI design.*

## 11. Important Product Relationships

At the product level, the major relationships are:

```text
User

|

Wedding Membership

|

Wedding

|

+-- Wedding Members

|

+-- Events

| |

| +-- Tasks

| +-- Guests

| +-- Vendors

| +-- Expenses

| +-- Photos

|

+-- Tasks

|

+-- Guests

| |

| +-- Invitations

| +-- RSVP

|

+-- Vendors

|

+-- Expenses

|

+-- Wedding Website

|

+-- Gallery

| |

| +-- Photos

|

+-- Livestream
```

*Exact database modelling will be decided during database design.*

## 12. Important UX Principles

### 12.1 Wedding First

Every logged-in page should clearly feel connected to the current wedding. The user should see the couple identity or wedding identity consistently.

### 12.2 Simple Enough for Parents

The dashboard should not feel like enterprise project-management software. A parent who is not technically sophisticated should still be comfortable:

- Adding a guest

- Completing a task

- Recording an expense

- Viewing an RSVP

### 12.3 Mobile Friendly

Although Wedding Members may use desktop dashboards, many workflows will happen from mobile devices. Guest experiences especially must be mobile-first. Important mobile workflows:

- RSVP

- Invitation viewing

- Photo upload

- Gallery browsing

- WhatsApp sharing

### 12.4 Minimal Guest Friction

Guests should never be asked to:

- Create account

- Set password

- Install app

Invitation link → RSVP.  
QR scan → Gallery.  
That should be the philosophy.

### 12.5 Indian Context

The application should feel designed for Indian weddings rather than being a generic event management platform. Examples:

- Mehendi

- Haldi

- Sangeet

- Roka

- Multiple events

- Family organisers

- WhatsApp sharing

- INR formatting

- Large guest counts

## 13. Privacy and Security Expectations

Although detailed security architecture belongs in system design, the product requires the following behaviour.

**Authenticated Data**  
Wedding management data should only be accessible by Wedding Members.

**Email Ownership Verification**  
V1 does not require email ownership verification for account creation or Wedding Member invite acceptance. The application must still validate basic email syntax, enforce email uniqueness, and protect authenticated actions with secure session handling and authorization.

**Guest Invitation Links**  
Invitation tokens should be difficult to guess.

**Gallery Links**  
Private galleries should not be publicly indexed or discoverable.

**Photo Upload**  
Guest uploads must be securely handled and validated.

**Cross-Wedding Isolation**  
A user belonging to one wedding must never be able to access another wedding's internal data. This becomes a critical backend requirement even though each user only participates in one wedding in V1.

## 14. Error and Edge Cases

The product should account for situations such as:

**Wedding Member**

- Invited email already has an account.

- Invitation expires.

- Admin removes a Manager.

- Multiple Admins exist.

- Admin attempts to remove the final Admin.

*The system should never allow a wedding to have zero Admins.*

**Guests**

- Guest opens expired/invalid link.

- Guest submits RSVP twice.

- Guest changes their RSVP.

- Guest tries to RSVP for more people than allowed.

- Guest has no email address.

*Guests without email can still have a link manually shared through WhatsApp.*

**Events**

- Event occurs after primary wedding date.

- Event has no venue.

- Event is deleted after guests were invited.

*The UI should warn the organiser before destructive actions that affect invitations.*

**Vendors**

- Vendor exists without an expense.

- Expense exists without a vendor.

*Both should be valid.*

**Gallery**

- Guest uploads unsupported file.

- Upload fails midway.

- File exceeds maximum size.

- Guest scans QR after wedding.

*The gallery should continue functioning after the wedding unless disabled.*

## 15. Success Metrics - Defined, Instrumentation Deferred from MVP

The product may use the following success metrics in future releases. They are retained as useful product definitions, but **product analytics tooling and funnel instrumentation are not part of the MVP**. No external analytics platform is required for V1/MVP.

**Activation**

Percentage of users who:

1. Sign up
2. Create Wedding
3. Create first event

**Wedding Setup Completion**

Percentage of Weddings that have:

- At least one event
- At least one task
- At least one guest

**Collaboration**

Average number of Wedding Members per Wedding.

**Invitations**

Potential future measures:

- Invitations created
- Invitations sent
- Invitation open rate
- RSVP response rate

**Task Management**

Potential future measure: percentage of wedding tasks completed.

**Vendor Usage**

Potential future measures:

- Vendors added
- Vendor discovery searches

**Gallery Engagement**

Potential future measures:

- Photos uploaded
- Guest uploads
- Gallery visitors
- QR visits

These metrics are **not an MVP instrumentation requirement** and do not require PostHog, Mixpanel, Amplitude, Google Analytics, or another product-analytics platform in V1.

## 16. Product Release Strategy

Even though all features belong to the V1 product vision, implementation should happen incrementally.

**Phase 1: Foundation**

- Authentication

- Wedding creation

- Wedding Members

- Dashboard shell

**Phase 2: Planning**

- Events

- Tasks

**Phase 3: Guests**

- Guest management

- Invitations

- RSVP

- Email

- WhatsApp sharing

**Phase 4: Financial and Vendors**

- Expense tracker

- My Vendors

- Vendor discovery

**Phase 5: Wedding Experience**

- Wedding website

- Themes

- YouTube livestream

**Phase 6: Memories**

- Gallery

- Guest photo uploads

- Albums

- Private sharing

- QR code

**Phase 7: Production Readiness**

- Error handling
- Security review
- Responsive design
- Performance
- Testing
- Deployment to Vercel
- Basic structured application/server logging
- MongoDB Atlas managed production backups
- Operational verification of critical user flows

Product analytics tooling and external observability/monitoring SaaS are deferred from the MVP.

## 17. Future Product Opportunities

These features are deliberately excluded from V1 but could evolve the platform later.

**Communication**

- WhatsApp API

- SMS reminders

- Automated RSVP reminders

**Advanced Guest Management**

- Household management

- Meal preferences

- Seating arrangements

- Accommodation

- Transportation

**Financial Management**

- Wedding budgets

- Vendor advances

- Payment schedules

- Expense splitting

- Bride/groom family expenditure tracking

**Vendors**

- Vendor profiles

- Reviews

- Vendor onboarding

- Marketplace

- Booking

- Payments

**Wedding Website**

- Custom domains

- More themes

- Custom page sections

- Advanced website builder

**Platform / Commercial Operations**

- Product analytics instrumentation
- External observability and monitoring tooling where justified by scale
- Subscription billing and plan management after pricing requirements are defined

**Photos**

- Face recognition

- "Find my photos"

- AI photo tagging

- Automatic event classification

**AI Wedding Assistant**  
A future AI layer could understand the entire wedding workspace. Examples:

- "What should I focus on this week?"

- "Which important wedding tasks are delayed?"

- "Create a checklist for my Haldi ceremony."

- "I have 300 guests. Suggest things I may have forgotten."

- "Summarize my upcoming payments and vendors."

AI should eventually enhance the actual product data rather than simply adding a generic chatbot.

## 18. V1 Product Definition

Make My Marriage V1 is considered functionally complete when:

A bride or groom can create a wedding, invite family members to collaboratively manage it, create wedding events, manage tasks, maintain guests, send invitations, collect RSVPs, track expenses, manage and discover vendors, publish a themed wedding website, embed a YouTube livestream, and privately collect and share wedding photos through links and QR codes, while guests can participate without creating accounts.

## 19. Product Principle

Whenever deciding whether something belongs in V1, use this question:

**Does this feature directly help a family plan, coordinate, celebrate, or preserve their wedding?**

If yes, consider it.

If it introduces significant complexity without meaningfully improving the core wedding-management experience, defer it.

The objective of V1 is not to build every possible wedding-related feature. The objective is to build a cohesive product that a real Indian family could genuinely use for their wedding.

## 20. Approved V1 Technical and Architecture Constraints

These decisions constrain the V1 implementation and must be respected by the System Design. They do not expand the product feature scope.

| Area | Approved V1 Decision |
|---|---|
| Architecture | Modular monolith |
| Frontend | Next.js + TypeScript |
| Backend | Next.js Route Handlers running on Node.js |
| Separate Express / NestJS backend | No |
| API style | Explicit REST APIs |
| Request validation | Zod |
| Database | MongoDB Atlas managed by MongoDB |
| ODM | Mongoose |
| Tenant boundary | Wedding |
| Authentication | Custom session-based email/password authentication |
| Better Auth / Clerk / Auth0 | Not used |
| Email ownership verification | Not required in V1 |
| User roles | Admin + Manager |
| Guest authentication | No login; secure token-based links |
| Deployment | Vercel |
| Media storage | Cloudflare R2 |
| Media upload | Direct client-to-R2 via signed upload URL issued by Next.js API |
| Email provider | Resend |
| Bulk email | MongoDB-backed lightweight background batching in small batches |
| Vendor discovery | Google Places API |
| Livestream | YouTube embed |
| Real-time | None in V1 |
| Redis | Not initially |
| Dedicated queue infrastructure | None in V1 |
| External monitoring | None initially |
| Product analytics | None in MVP |
| Logging | Basic structured application/server logs |
| Billing/subscriptions | Outside V1 until pricing/plans are defined |
| Production database backups | MongoDB Atlas managed backups |
| Delete strategy | Domain-specific hard delete with dependency/destructive-action safeguards |

### 20.1 Media Upload Direction

The V1 media-upload path is:

```text
Guest / Wedding Member
        |
        | 1. Request upload authorization
        v
   Next.js REST API
        |
        | 2. Validate request and issue signed upload URL
        v
      Browser
        |
        | 3. Upload binary directly
        v
  Cloudflare R2
        |
        | 4. Persist/confirm media metadata
        v
    MongoDB Atlas
```

Large photo binaries must not be intentionally proxied through the Next.js application server when direct-to-R2 upload is available.

### 20.2 Lightweight Bulk Email Direction

When an organiser sends invitations or reminders to many Guests, the request should create a lightweight background job stored in MongoDB. A processor sends recipients through Resend in small configurable batches and records progress/retry state. V1 does not require Kafka, RabbitMQ, SQS, Redis-based queues, or a dedicated email microservice.

## 21. V1 Architecture Planning Scale

The initial System Design should comfortably support approximately:

- Up to **1,000 Guests per Wedding**.
- Up to **5,000 photos per Wedding**.
- **Thousands of active Weddings** across the platform over time.

These are planning assumptions for V1 architecture, not hard product limits.

## 22. Data Lifecycle and Operational Rules

### 22.1 Managed Backups

Production MongoDB data should use MongoDB Atlas managed backups. V1 does not require a custom backup service.

### 22.2 Domain-Specific Deletion

V1 does not require soft-delete fields across every collection. Deletion should be defined per domain:

- Wedding Member removal removes the membership relationship while preserving the underlying user account where appropriate.
- Photos are removed from Cloudflare R2 and their MongoDB metadata is removed when permanently deleted.
- Tasks, expenses, and vendors may use hard delete where permitted by product rules.
- Event deletion must respect dependencies and the PRD's destructive-action warnings.
- No operation may remove or demote the final Admin of a Wedding.

### 22.3 Commercial Billing

Make My Marriage is intended to become a commercial product, but subscription billing, pricing plans, entitlements, checkout, and payment-provider integration are outside V1 until those requirements are explicitly defined.

## 23. Alignment Statement

This V1.1 PRD is the reconciled product baseline to be used for System Design. The architecture may choose implementation detail within these constraints, but must not silently add, remove, or change approved product behavior. Any future scope change should first update this PRD before changing the System Design.

