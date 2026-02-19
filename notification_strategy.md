Option A — Notification table + Recipient mapping (recommended for transactional + per-user unread)
Goal

Store each notification once, and store who received it in a small mapping table that also tracks read/unread per user.

Tables
1) notifications

Stores the notification content one time.

Columns

id uuid pk default gen_random_uuid()

type text (e.g. rent_due, payment_confirmed, system, reminder)

title text

body text

payload jsonb (invoiceId, propertyId, lgaId, deepLink, etc.)

priority smallint default 0

created_by uuid nullable (admin user id)

created_at timestamptz default now()

expires_at timestamptz nullable

Optional:

channel text (in_app, email, sms, push) if you want

2) notification_recipients

One row per (notification, user). Tracks read state.

Columns

id uuid pk default gen_random_uuid()

notification_id uuid references notifications(id) on delete cascade

recipient_user_id uuid references auth.users(id) on delete cascade

status text default 'unread' (enum-ish: unread, read, archived)

read_at timestamptz nullable

archived_at timestamptz nullable

created_at timestamptz default now()

Uniqueness

unique(notification_id, recipient_user_id) // prevents duplicates on retries

Indexes (important)

index on notification_recipients(recipient_user_id, created_at desc)

index on notification_recipients(recipient_user_id, status, created_at desc)

index on notification_recipients(notification_id)

RLS policies (Supabase)

notification_recipients: user can select/update only rows where recipient_user_id = auth.uid()

notifications: selectable if joined via recipients (or allow select to authenticated and rely on recipients to hide; safest is to restrict direct select and use view)

Inbox queries
Get inbox list (paginated)

Fetch recipient rows for the user and join the notification content:

Filter: recipient_user_id = auth.uid()

Order: created_at desc

Pagination: limit/offset or cursor (created_at < lastCreatedAt)

Data returned:

recipient row: status/read_at

notification: title/body/payload/type

Unread count (badge)

Count recipient rows:

where recipient_user_id = auth.uid() and status='unread'

Write flow
Creating a notification to N users

Insert ONE row into notifications

Insert MANY rows into notification_recipients:

for each recipient user id: (notification_id, recipient_user_id)

In Supabase, do the second step with a bulk insert.

Mark as read

Update notification_recipients

set status='read', read_at=now()

where id = :recipientRowId AND recipient_user_id = auth.uid()

Pros / Cons

Pros

Good performance

No duplication of big content/payload

Clean per-user unread/read tracking

Works well for audit-ish transactional messages

Cons

Rows still grow in notification_recipients (but smaller than full fan-out)

Broadcast to “everyone” still inserts many mapping rows

Option C — Segment/Broadcast notifications (best for announcements; minimal row explosion)
Goal

Avoid inserting per-user rows by storing notifications targeted to a segment (ALL, ROLE, LGA, etc.). Users query notifications by matching their attributes.

Core idea

A notification has a target rule:

“ALL users”

“Role = taxpayer”

“Role = admin”

“LGA = Kaduna North”

“PropertyId = X”

“Specific user = Y” (still possible)

Tables
1) notifications_broadcast

Stores broadcast/segment notifications.

Columns

id uuid pk default gen_random_uuid()

type text

title text

body text

payload jsonb

created_at timestamptz default now()

expires_at timestamptz nullable

Targeting fields (choose a simple pattern):

target_type text
Allowed: ALL, ROLE, LGA, PROPERTY, USER

target_value text
Examples:

if target_type=ROLE → taxpayer or admin

if target_type=LGA → lga_uuid_or_code

if target_type=PROPERTY → property_uuid

if target_type=USER → user_uuid

Indexes:

index on (target_type, target_value, created_at desc)

index on (created_at desc)

2) Read tracking (you MUST choose one)

Because Option C does not create per-user rows, “read/unread” is not automatic. Use one of these:

Read tracking method C1 (recommended for broadcasts): “Last seen per channel”

Create a per-user table that stores the latest time they checked announcements.

user_notification_last_seen

user_id uuid pk references auth.users(id)

announcements_last_seen_at timestamptz default '1970-01-01'

Unread count logic:

Count broadcasts where created_at > announcements_last_seen_at AND user matches target rules.

Mark “all as seen”:

update announcements_last_seen_at = now()

Pros: only 1 row per user, very small
Cons: can’t mark individual items read/unread, only “seen since time”

Read tracking method C2: “Reads table per (user, notification_id)”

notification_reads

notification_id uuid references notifications_broadcast(id) on delete cascade

user_id uuid references auth.users(id) on delete cascade

read_at timestamptz default now()

unique(notification_id, user_id)

Unread logic:

Broadcast is unread if no notification_reads row exists.

Pros: exact per-item read state
Cons: row growth returns again (but only for items actually opened/read)

Inbox query (how user fetches broadcasts)

To fetch “broadcast notifications for this user”, query notifications_broadcast where:

not expired (expires_at is null OR expires_at > now())

AND matches one of:

target_type='ALL'

target_type='ROLE' and target_value = user.role

target_type='LGA' and target_value = user.lga_id

target_type='PROPERTY' and target_value IN (user’s property ids) (optional)

target_type='USER' and target_value = auth.uid()

Then order by created_at desc and paginate.

Pros / Cons

Pros

Broadcast to thousands of users without inserting thousands of rows

Very storage-efficient for announcements

Cons

Read/unread is harder (needs C1 or C2)

Target rule queries can get complex if you add many segment types

Not great for transactional “personal” notifications (invoice/payment) unless you accept complexity

Practical hybrid (best for your case)

Since “every role receives notifications” and you’re not sure about volume:

Use Option A for transactional/personal items:

invoice generated, demand notice served, payment confirmed, reminders tied to a taxpayer/property

Use Option C for broadcast announcements:

system notices, policy updates, scheduled downtime, general reminders

This avoids row explosion from “send to all”, while keeping per-user unread accurate for important stuff.