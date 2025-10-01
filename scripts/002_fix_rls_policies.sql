-- =====================================================
-- FIX RLS POLICIES - Remove Infinite Recursion
-- =====================================================

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "users_select_admin" ON users;
DROP POLICY IF EXISTS "profiles_select_admin" ON taxpayer_profiles;
DROP POLICY IF EXISTS "properties_select_admin" ON properties;
DROP POLICY IF EXISTS "properties_update_admin" ON properties;
DROP POLICY IF EXISTS "invoices_select_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_admin" ON invoices;
DROP POLICY IF EXISTS "invoices_update_admin" ON invoices;
DROP POLICY IF EXISTS "payments_select_admin" ON payments;
DROP POLICY IF EXISTS "payments_insert_admin" ON payments;

-- Since we're using Firebase Auth (not Supabase Auth), we need to handle
-- authorization at the application level. For now, we'll disable RLS on
-- tables that need admin access and rely on application-level checks.

-- Disable RLS on users table (Firebase Auth handles this)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled for user-owned data but simplify policies
-- Properties: Users can view/edit their own properties
DROP POLICY IF EXISTS "properties_select_own" ON properties;
DROP POLICY IF EXISTS "properties_select_manager" ON properties;
DROP POLICY IF EXISTS "properties_insert_own" ON properties;
DROP POLICY IF EXISTS "properties_update_own" ON properties;

-- For now, allow all authenticated operations on properties
-- In production, you should implement proper authorization checks in your API layer
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE taxpayer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminders DISABLE ROW LEVEL SECURITY;

-- Note: In a production environment with Firebase Auth + Supabase DB,
-- you should implement authorization checks in your API routes/server actions
-- rather than relying on RLS with auth.uid() which is designed for Supabase Auth.
