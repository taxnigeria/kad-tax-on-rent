-- Rename old table if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER TABLE public.notifications RENAME TO notifications_old;
    END IF;
END $$;

-- Transactional Notifications (Option A)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- e.g. 'transactional', 'invoice_generated'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    recipient_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'unread', -- 'unread', 'read', 'archived'
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(notification_id, recipient_user_id)
);

-- Broadcast Notifications (Option C)
CREATE TABLE IF NOT EXISTS public.notifications_broadcast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- e.g. 'broadcast', 'system_alert'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    target_type TEXT NOT NULL CHECK (target_type IN ('ALL', 'ROLE', 'LGA', 'PROPERTY', 'USER')),
    target_value TEXT, -- null if ALL, or specific Role value, or UUID for LGA/Property
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notification_broadcast_reads (
    broadcast_id UUID REFERENCES public.notifications_broadcast(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (broadcast_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipients_user ON public.notification_recipients(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON public.notification_recipients(recipient_user_id, status);
CREATE INDEX IF NOT EXISTS idx_broadcast_reads_user ON public.notification_broadcast_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_target ON public.notifications_broadcast(target_type, target_value);

-- RLS Policies (Enable RLS on tables)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_broadcast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_broadcast_reads ENABLE ROW LEVEL SECURITY;

-- Policy: Recipients can see their own rows
CREATE POLICY "Users can view their own notifications" ON public.notification_recipients
    FOR SELECT USING (auth.uid() = recipient_user_id); -- Note: this relies on auth.uid() matching users.id or handled via app logic if using different Auth

-- Policy: Broadcasts are readable by everyone (application logic filters relevant ones, or we can use advanced policies)
-- For simplicity, allow authenticated users to read broadcasts
CREATE POLICY "Users can view broadcasts" ON public.notifications_broadcast
    FOR SELECT TO authenticated USING (true);

-- Policy: Broadcast reads are personal
CREATE POLICY "Users can manage their broadcast reads" ON public.notification_broadcast_reads
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Admins can do everything (adjust based on your roles implementation)
-- Assuming 'admin' role check via custom claim or users table lookup is handled elsewhere or trusted service role used for admin actions.

