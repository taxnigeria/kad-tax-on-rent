-- =====================================================
-- TENANT ROLE & PARTIAL PAYMENTS MIGRATION
-- Adds tenant role, tenant_rentals table, and Paykaduna integration
-- =====================================================

-- =====================================================
-- 1. ADD TENANT ROLE TO USERS TABLE
-- =====================================================

-- Drop existing constraint and add new one with 'tenant' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('taxpayer', 'property_manager', 'admin', 'superadmin', 'qa', 'enumerator', 'tenant'));

-- =====================================================
-- 2. CREATE TENANT_RENTALS TABLE
-- Links tenants to properties they rent (ANNUAL RENT BASIS)
-- =====================================================

CREATE TABLE IF NOT EXISTS tenant_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Rental Details (ANNUAL BASIS - Nigerian standard)
  unit_number VARCHAR(50), -- For multi-unit properties (e.g., "Flat 2B", "Shop 5")
  annual_rent DECIMAL(15,2) NOT NULL, -- Primary field: Annual rent amount
  monthly_rent DECIMAL(15,2) GENERATED ALWAYS AS (annual_rent / 12) STORED, -- Calculated for reference
  
  -- Rental Period
  rent_commencement_date DATE NOT NULL,
  rent_end_date DATE, -- NULL means ongoing
  lease_duration_months INTEGER DEFAULT 12, -- Typically 12 months in Nigeria
  
  -- Tenant's Tax Responsibility
  tenant_tax_portion DECIMAL(5,2) DEFAULT 100.00, -- Percentage (0-100) of tax tenant is responsible for
  
  -- Supporting Documents
  tenancy_agreement_url TEXT, -- Link to uploaded tenancy agreement
  proof_of_payment_url TEXT, -- Link to rent payment proof
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'needs_info')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique tenant-property-unit combination
  UNIQUE(tenant_id, property_id, unit_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_rentals_tenant ON tenant_rentals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_rentals_property ON tenant_rentals(property_id);
CREATE INDEX IF NOT EXISTS idx_tenant_rentals_status ON tenant_rentals(verification_status);
CREATE INDEX IF NOT EXISTS idx_tenant_rentals_active ON tenant_rentals(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_tenant_rentals_updated_at ON tenant_rentals;

-- Trigger for updated_at
CREATE TRIGGER update_tenant_rentals_updated_at 
  BEFORE UPDATE ON tenant_rentals
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. MODIFY PAYMENTS TABLE FOR PARTIAL PAYMENTS
-- =====================================================

-- Add columns for partial payment tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_by_role VARCHAR(20) CHECK (paid_by_role IN ('taxpayer', 'property_manager', 'tenant', 'admin'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_rental_id UUID REFERENCES tenant_rentals(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_partial_payment BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_portion_percentage DECIMAL(5,2); -- What % of total invoice this payment covers
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_notes TEXT; -- Additional context for partial payments

-- Add index for tenant rental payments
CREATE INDEX IF NOT EXISTS idx_payments_tenant_rental ON payments(tenant_rental_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_by_role ON payments(paid_by_role);

-- =====================================================
-- 4. ADD PAYKADUNA INTEGRATION FIELDS
-- =====================================================

-- Taxpayer profiles: Store Paykaduna customer ID
ALTER TABLE taxpayer_profiles ADD COLUMN IF NOT EXISTS paykaduna_customer_id VARCHAR(100) UNIQUE;
ALTER TABLE taxpayer_profiles ADD COLUMN IF NOT EXISTS paykaduna_customer_code VARCHAR(100);
ALTER TABLE taxpayer_profiles ADD COLUMN IF NOT EXISTS paykaduna_created_at TIMESTAMP;

-- Invoices: Store Paykaduna invoice reference
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paykaduna_invoice_id VARCHAR(100) UNIQUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paykaduna_invoice_code VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paykaduna_payment_link TEXT;

-- Payments: Store Paykaduna transaction details
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paykaduna_transaction_ref VARCHAR(100) UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paykaduna_payment_channel VARCHAR(50); -- card, bank_transfer, ussd, etc.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paykaduna_authorization_code VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paykaduna_customer_email VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paykaduna_paid_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paykaduna_fees DECIMAL(15,2) DEFAULT 0; -- Transaction fees charged by Paykaduna
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paykaduna_metadata JSONB; -- Store additional Paykaduna response data

-- Indexes for Paykaduna lookups
CREATE INDEX IF NOT EXISTS idx_taxpayer_paykaduna_customer ON taxpayer_profiles(paykaduna_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_paykaduna ON invoices(paykaduna_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_paykaduna_ref ON payments(paykaduna_transaction_ref);

-- =====================================================
-- 5. HELPER FUNCTIONS FOR PARTIAL PAYMENTS
-- =====================================================

-- Function to calculate tenant's tax portion
CREATE OR REPLACE FUNCTION calculate_tenant_tax_portion(
  p_invoice_id UUID,
  p_tenant_rental_id UUID
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_total_amount DECIMAL(15,2);
  v_tax_portion DECIMAL(5,2);
  v_tenant_amount DECIMAL(15,2);
BEGIN
  -- Get invoice total and tenant's tax portion percentage
  SELECT i.total_amount, tr.tenant_tax_portion
  INTO v_total_amount, v_tax_portion
  FROM invoices i
  JOIN tenant_rentals tr ON tr.property_id = i.property_id
  WHERE i.id = p_invoice_id AND tr.id = p_tenant_rental_id;
  
  -- Calculate tenant's portion
  v_tenant_amount := (v_total_amount * v_tax_portion) / 100;
  
  RETURN v_tenant_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice payment status after partial payment
CREATE OR REPLACE FUNCTION update_invoice_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(15,2);
  v_invoice_total DECIMAL(15,2);
  v_new_status VARCHAR(20);
BEGIN
  -- Only process if payment is verified
  IF NEW.verification_status != 'verified' THEN
    RETURN NEW;
  END IF;
  
  -- Calculate total amount paid for this invoice
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id
  AND verification_status = 'verified';
  
  -- Get invoice total
  SELECT total_amount INTO v_invoice_total
  FROM invoices WHERE id = NEW.invoice_id;
  
  -- Determine new payment status
  IF v_total_paid >= v_invoice_total THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'unpaid';
  END IF;
  
  -- Update invoice
  UPDATE invoices
  SET 
    amount_paid = v_total_paid,
    balance_due = v_invoice_total - v_total_paid,
    payment_status = v_new_status,
    paid_date = CASE WHEN v_new_status = 'paid' THEN CURRENT_DATE ELSE NULL END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_invoice_payment_status ON payments;

-- Create trigger AFTER all payments table modifications are complete
-- Trigger to update invoice after payment verification
CREATE TRIGGER update_invoice_payment_status
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.verification_status = 'verified')
  EXECUTE FUNCTION update_invoice_after_payment();

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES FOR TENANTS
-- =====================================================

-- Enable RLS on tenant_rentals table
ALTER TABLE tenant_rentals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS tenant_rentals_select_own ON tenant_rentals;
DROP POLICY IF EXISTS tenant_rentals_insert_own ON tenant_rentals;
DROP POLICY IF EXISTS tenant_rentals_update_own ON tenant_rentals;
DROP POLICY IF EXISTS tenant_rentals_select_owner ON tenant_rentals;
DROP POLICY IF EXISTS tenant_rentals_select_admin ON tenant_rentals;
DROP POLICY IF EXISTS tenant_rentals_update_admin ON tenant_rentals;

-- Tenants can view their own rentals
CREATE POLICY tenant_rentals_select_own ON tenant_rentals
  FOR SELECT USING (tenant_id = auth.uid());

-- Tenants can insert their own rental applications
CREATE POLICY tenant_rentals_insert_own ON tenant_rentals
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

-- Tenants can update their own rentals (if not approved)
CREATE POLICY tenant_rentals_update_own ON tenant_rentals
  FOR UPDATE USING (tenant_id = auth.uid() AND verification_status IN ('pending', 'rejected'));

-- Property owners can view rentals for their properties
CREATE POLICY tenant_rentals_select_owner ON tenant_rentals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = tenant_rentals.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Admins can view all tenant rentals
CREATE POLICY tenant_rentals_select_admin ON tenant_rentals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa')
    )
  );

-- Admins can update tenant rentals (for verification)
CREATE POLICY tenant_rentals_update_admin ON tenant_rentals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'qa')
    )
  );

-- =====================================================
-- 7. UPDATE INVOICES RLS FOR TENANTS
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS invoices_select_tenant ON invoices;

-- Tenants can view invoices for properties they rent (if approved)
CREATE POLICY invoices_select_tenant ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_rentals 
      WHERE tenant_rentals.property_id = invoices.property_id 
      AND tenant_rentals.tenant_id = auth.uid()
      AND tenant_rentals.is_active = true
      AND tenant_rentals.verification_status = 'approved'
    )
  );

-- =====================================================
-- 8. UPDATE PAYMENTS RLS FOR TENANTS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS payments_select_tenant ON payments;
DROP POLICY IF EXISTS payments_insert_tenant ON payments;

-- Tenants can view their own payments
CREATE POLICY payments_select_tenant ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_rentals 
      WHERE tenant_rentals.id = payments.tenant_rental_id 
      AND tenant_rentals.tenant_id = auth.uid()
    )
  );

-- Tenants can insert payments for their rentals
CREATE POLICY payments_insert_tenant ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_rentals 
      WHERE tenant_rentals.id = payments.tenant_rental_id 
      AND tenant_rentals.tenant_id = auth.uid()
      AND tenant_rentals.is_active = true
      AND tenant_rentals.verification_status = 'approved'
    )
  );

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE tenant_rentals IS 'Links tenants to properties they rent. Rent is stored on annual basis (Nigerian standard).';
COMMENT ON COLUMN tenant_rentals.annual_rent IS 'Annual rent amount - primary field for calculations';
COMMENT ON COLUMN tenant_rentals.monthly_rent IS 'Auto-calculated as annual_rent / 12 for reference only';
COMMENT ON COLUMN tenant_rentals.tenant_tax_portion IS 'Percentage (0-100) of withholding tax tenant is responsible for';
COMMENT ON COLUMN payments.is_partial_payment IS 'True if this payment covers only a portion of the invoice';
COMMENT ON COLUMN payments.payment_portion_percentage IS 'What percentage of total invoice this payment covers';
COMMENT ON COLUMN payments.tenant_rental_id IS 'Links payment to specific tenant rental if paid by tenant';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
