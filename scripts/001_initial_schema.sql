-- =====================================================
-- WITHHOLDING TAX COLLECTION & TRACKING SYSTEM
-- Initial Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. AREA OFFICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS area_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_name VARCHAR(255) NOT NULL,
  office_code VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_office_code ON area_offices(office_code);

-- =====================================================
-- 2. USERS TABLE (Synced with Firebase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,  -- Firebase UID
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('taxpayer', 'property_manager', 'admin', 'superadmin', 'qa', 'enumerator')),
  
  -- Basic Info
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  
  -- System
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone_number);

-- =====================================================
-- 3. TAXPAYER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS taxpayer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Personal Details
  gender VARCHAR(10),
  date_of_birth DATE,
  nationality VARCHAR(100) DEFAULT 'Nigerian',
  
  -- Identification
  tax_id_or_nin VARCHAR(50) UNIQUE,
  means_of_identification VARCHAR(100),
  identification_number VARCHAR(100),
  
  -- Business Info
  is_business BOOLEAN DEFAULT false,
  business_name VARCHAR(255),
  business_type VARCHAR(100),
  rc_number VARCHAR(50),
  business_registration_date DATE,
  
  -- Tax Office Assignment
  area_office_id UUID REFERENCES area_offices(id),
  kadirs_id VARCHAR(50) UNIQUE,
  
  -- Address
  residential_address TEXT,
  business_address TEXT,
  
  -- For Property Managers
  management_license_number VARCHAR(100),
  years_of_experience INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_taxpayer_user ON taxpayer_profiles(user_id);
CREATE INDEX idx_taxpayer_tin ON taxpayer_profiles(tax_id_or_nin);
CREATE INDEX idx_taxpayer_kadirs ON taxpayer_profiles(kadirs_id);

-- =====================================================
-- 4. ADDRESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Address Components
  street_address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  lga VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Nigeria',
  
  -- Geolocation
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_state ON addresses(state);
CREATE INDEX idx_addresses_lga ON addresses(lga);

-- =====================================================
-- 5. PROPERTIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Property Identity
  registered_property_name VARCHAR(255) NOT NULL,
  property_reference VARCHAR(50) UNIQUE,
  kadirs_property_id VARCHAR(50),
  
  -- Property Details
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('residential', 'commercial', 'industrial', 'mixed')),
  property_category VARCHAR(50),
  house_number VARCHAR(50),
  street_name VARCHAR(255),
  
  -- Property Size
  total_units INTEGER,
  occupied_units INTEGER,
  total_floor_area DECIMAL(10,2),
  number_of_floors INTEGER,
  year_built INTEGER,
  
  -- Location
  address_id UUID REFERENCES addresses(id),
  
  -- RENTAL INFORMATION (ANNUAL BASIS)
  total_annual_rent DECIMAL(15,2) NOT NULL,
  rental_commencement_date DATE NOT NULL,
  
  -- Optional: Rent breakdown
  rent_breakdown JSONB,
  
  -- Property Manager
  property_manager_id UUID REFERENCES users(id),
  has_property_manager BOOLEAN DEFAULT false,
  manager_full_name VARCHAR(255),
  manager_email VARCHAR(255),
  manager_phone VARCHAR(20),
  manager_tax_id VARCHAR(50),
  management_start_date DATE,
  
  -- Workflow Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'verified', 'rejected', 'archived')),
  submitted_at TIMESTAMP,
  
  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'needs_info')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  qa_reviewed_by UUID REFERENCES users(id),
  qa_reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Enumeration
  enumerated_by UUID REFERENCES users(id),
  enumeration_date DATE,
  enumeration_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_manager ON properties(property_manager_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_reference ON properties(property_reference);

-- =====================================================
-- 6. PROPERTY VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS property_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Verification Details
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('initial', 'qa_review', 're_verification')),
  verified_by UUID NOT NULL REFERENCES users(id),
  verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('approved', 'rejected', 'needs_info')),
  
  -- Decision
  decision_notes TEXT,
  rejection_reason TEXT,
  required_actions TEXT,
  
  -- Timestamps
  verified_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verifications_property ON property_verifications(property_id);
CREATE INDEX idx_verifications_status ON property_verifications(verification_status);
CREATE INDEX idx_verifications_date ON property_verifications(verified_at DESC);

-- =====================================================
-- 7. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('property', 'taxpayer', 'payment', 'invoice')),
  entity_id UUID NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  
  -- Document Details
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- =====================================================
-- 8. TAX RATES CONFIGURATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rate Details
  property_type VARCHAR(50) NOT NULL,
  rate_percentage DECIMAL(5,2) NOT NULL,
  
  -- Effective Period
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_rates_type ON tax_rates(property_type);
CREATE INDEX idx_tax_rates_active ON tax_rates(is_active);
CREATE INDEX idx_tax_rates_effective ON tax_rates(effective_from, effective_to);

-- =====================================================
-- 9. TAX CALCULATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Tax Period
  tax_year INTEGER NOT NULL,
  calculation_date DATE DEFAULT CURRENT_DATE,
  
  -- Calculation Inputs (ANNUAL BASIS)
  annual_rent DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL,
  
  -- Base Tax Calculation
  base_tax_amount DECIMAL(15,2) NOT NULL,
  
  -- Backlog Tax
  backlog_tax_amount DECIMAL(15,2) DEFAULT 0,
  backlog_start_date DATE,
  backlog_end_date DATE,
  backlog_years DECIMAL(4,2),
  
  -- Additional Charges
  penalty_amount DECIMAL(15,2) DEFAULT 0,
  interest_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Total Tax Due
  total_tax_due DECIMAL(15,2) NOT NULL,
  
  -- Calculation Details
  calculation_method VARCHAR(50),
  calculated_by UUID REFERENCES users(id),
  adjustment_reason TEXT,
  calculation_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_calc_property ON tax_calculations(property_id);
CREATE INDEX idx_tax_calc_year ON tax_calculations(tax_year);
CREATE INDEX idx_tax_calc_active ON tax_calculations(is_active);

-- =====================================================
-- 10. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  taxpayer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_calculation_id UUID REFERENCES tax_calculations(id),
  
  -- Invoice Identity
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  bill_reference VARCHAR(100),
  
  -- Tax Period
  tax_year INTEGER NOT NULL,
  tax_period VARCHAR(50),
  
  -- Amounts
  base_amount DECIMAL(15,2) NOT NULL,
  stamp_duty DECIMAL(15,2) DEFAULT 0,
  penalty DECIMAL(15,2) DEFAULT 0,
  interest DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  -- Payment Tracking
  amount_paid DECIMAL(15,2) DEFAULT 0,
  balance_due DECIMAL(15,2),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Payment Integration
  payment_access_code VARCHAR(100),
  payment_url TEXT,
  
  -- Printing
  is_printed BOOLEAN DEFAULT false,
  printed_at TIMESTAMP,
  printed_by UUID REFERENCES users(id),
  print_count INTEGER DEFAULT 0,
  
  -- Metadata
  narration TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_property ON invoices(property_id);
CREATE INDEX idx_invoices_taxpayer ON invoices(taxpayer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_year ON invoices(tax_year);

-- =====================================================
-- 11. PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_reference VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_date DATE NOT NULL,
  
  -- Bank Details
  bank_name VARCHAR(100),
  account_number VARCHAR(20),
  transaction_id VARCHAR(100),
  
  -- Receipt
  receipt_number VARCHAR(50) UNIQUE,
  receipt_url TEXT,
  
  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  
  -- Metadata
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_status ON payments(verification_status);

-- =====================================================
-- 12. REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  taxpayer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reminder Configuration
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('due_soon', 'due_today', 'overdue', 'final_notice')),
  scheduled_date DATE NOT NULL,
  days_before_due INTEGER,
  
  -- Delivery
  delivery_method VARCHAR(20) DEFAULT 'email' CHECK (delivery_method IN ('email', 'sms', 'both')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  -- Content
  subject VARCHAR(255),
  message TEXT,
  
  -- Tracking
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reminders_invoice ON reminders(invoice_id);
CREATE INDEX idx_reminders_taxpayer ON reminders(taxpayer_id);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_date);
CREATE INDEX idx_reminders_status ON reminders(status);

-- =====================================================
-- 13. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Entity
  entity_type VARCHAR(50),
  entity_id UUID,
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 14. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Action Details
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all user-accessible tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxpayer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own data
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa')
    )
  );

-- =====================================================
-- TAXPAYER PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON taxpayer_profiles
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON taxpayer_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON taxpayer_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON taxpayer_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa', 'enumerator')
    )
  );

-- =====================================================
-- PROPERTIES TABLE POLICIES
-- =====================================================

-- Taxpayers can view their own properties
CREATE POLICY "properties_select_own" ON properties
  FOR SELECT USING (owner_id = auth.uid());

-- Property managers can view properties they manage
CREATE POLICY "properties_select_manager" ON properties
  FOR SELECT USING (property_manager_id = auth.uid());

-- Taxpayers can insert their own properties
CREATE POLICY "properties_insert_own" ON properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Taxpayers can update their own properties (if not verified)
CREATE POLICY "properties_update_own" ON properties
  FOR UPDATE USING (owner_id = auth.uid() AND status IN ('draft', 'rejected'));

-- Admins can view all properties
CREATE POLICY "properties_select_admin" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa', 'enumerator')
    )
  );

-- Admins can update properties (for verification)
CREATE POLICY "properties_update_admin" ON properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa')
    )
  );

-- =====================================================
-- INVOICES TABLE POLICIES
-- =====================================================

-- Taxpayers can view their own invoices
CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT USING (taxpayer_id = auth.uid());

-- Admins can view all invoices
CREATE POLICY "invoices_select_admin" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa')
    )
  );

-- Admins can insert invoices
CREATE POLICY "invoices_insert_admin" ON invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Admins can update invoices
CREATE POLICY "invoices_update_admin" ON invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- =====================================================
-- PAYMENTS TABLE POLICIES
-- =====================================================

-- Taxpayers can view payments for their invoices
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices WHERE invoices.id = payments.invoice_id AND invoices.taxpayer_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "payments_select_admin" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa')
    )
  );

-- Admins can insert payments
CREATE POLICY "payments_insert_admin" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate property reference
CREATE OR REPLACE FUNCTION generate_property_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.property_reference IS NULL THEN
    NEW.property_reference := 'PROP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('property_ref_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for property reference
CREATE SEQUENCE IF NOT EXISTS property_ref_seq START 1;

-- Trigger to auto-generate property reference
CREATE TRIGGER set_property_reference
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION generate_property_reference();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('invoice_num_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for invoice number
CREATE SEQUENCE IF NOT EXISTS invoice_num_seq START 1;

-- Trigger to auto-generate invoice number
CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_taxpayer_profiles_updated_at BEFORE UPDATE ON taxpayer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default tax rate (10% for all property types)
INSERT INTO tax_rates (property_type, rate_percentage, effective_from, is_active)
VALUES 
  ('residential', 10.00, '2024-01-01', true),
  ('commercial', 10.00, '2024-01-01', true),
  ('industrial', 10.00, '2024-01-01', true),
  ('mixed', 10.00, '2024-01-01', true)
ON CONFLICT DO NOTHING;

-- Insert default area office
INSERT INTO area_offices (office_name, office_code, is_active)
VALUES ('Main Tax Office', 'MTO-001', true)
ON CONFLICT DO NOTHING;
