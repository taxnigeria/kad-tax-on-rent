# Migration Tracker

**Purpose:** Track which database migrations have been applied to each environment.

---

## Migration Status

### ✅ Applied Migrations (Local & Production)

| # | Migration File | Applied Date | Environment | Notes |
|---|----------------|--------------|-------------|-------|
| 001 | `001_initial_schema.sql` | 2025-01-XX | Local, Prod | Core tables (users, properties, invoices) |
| 002a | `002_add_firebase_uid.sql` | 2025-01-XX | Local, Prod | Added Firebase UID column |
| 002b | `002_fix_rls_policies.sql` | 2025-01-XX | Local, Prod | Fixed Row-Level Security |
| 002c | `002_seed_sample_locations.sql` | 2025-01-XX | Local | Sample location data (DEV ONLY) |
| 003 | `003_create_ownership_history.sql` | 2025-01-XX | Local, Prod | Ownership transfer tracking |
| 004 | `004_create_manager_authorizations.sql` | 2025-01-XX | Local, Prod | Property manager delegation |
| 005 | `005_add_tenant_role_and_features.sql` | 2025-01-XX | Local, Prod | Tenant role support |
| 006 | `006_add_profile_completion_fields.sql` | 2025-01-XX | Local, Prod | Profile verification fields |
| 007 | `007_add_kadirs_id_requirements.sql` | 2025-01-XX | Local, Prod | KADIRS ID integration |
| 008a | `008_add_industry_id_and_populate.sql` | 2025-01-XX | Local, Prod | Industry classification |
| 008b | `008_modify_industries_for_paykaduna.sql` | 2025-01-XX | Local, Prod | PayKaduna industry sync |
| 009a | `009_add_paykaduna_ids_to_lgas_and_offices.sql` | 2025-01-XX | Local, Prod | PayKaduna LGA/office IDs |
| 009b | `009_populate_lgas.sql` | 2025-01-XX | Local, Prod | LGA data population |
| 010a | `010_populate_area_offices.sql` | 2025-01-XX | Local, Prod | Area office data |
| 010b | `010_populate_paykaduna_industries.sql` | 2025-01-XX | Local, Prod | PayKaduna industries |
| 011a | `011_populate_paykaduna_lgas.sql` | 2025-01-XX | Local, Prod | PayKaduna LGA data |
| 011b | `011_update_system_settings_state.sql` | 2025-01-XX | Local, Prod | System settings table |
| 012 | `012_populate_paykaduna_tax_stations.sql` | 2025-01-XX | Local, Prod | Tax station data |
| 013a | `013_fix_lga_area_office_relationship.sql` | 2025-01-XX | Local, Prod | Fixed FK relationships |
| 013b | `013_update_system_settings_state.sql` | 2025-01-XX | Local, Prod | Settings update |
| 014 | `014_add_area_office_to_cities.sql` | 2025-01-XX | Local, Prod | City-office mapping |

### 📦 Standalone/Utility Migrations

| Migration File | Purpose | Environment |
|----------------|---------|-------------|
| `add-documents-property-fk-v1.sql` | Add foreign key to documents | Local, Prod |
| `add-property-fields-v1.sql` | Add additional property fields | Local, Prod |
| `create-system-settings-v1.sql` | Create system settings table | Local, Prod |
| `enable-invoices-realtime-v1.sql` | Enable Realtime for invoices | Local, Prod |
| `seed-sample-invoices-v1.sql` | Sample invoice data | **Local ONLY** |
| `001_create_lgas_and_cities.sql` | Create location tables | Local, Prod |

---

## How to Apply Migrations

### 1. **Via Supabase Dashboard**
1. Go to Supabase project → SQL Editor
2. Copy migration file contents
3. Execute SQL
4. Mark as applied in this document

### 2. **Via Supabase CLI** (Recommended for production)
```bash
# Install Supabase CLI
npm install supabase --save-dev

# Link to project
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
npx supabase db push
```

### 3. **Via Manual SQL Execution**
```bash
# Connect to database
psql -h YOUR_DB_HOST -U postgres -d postgres

# Run migration
\i scripts/001_initial_schema.sql
```

---

## Migration Naming Convention

**Format:** `NNN_descriptive_name.sql`

- `NNN` = Sequential number (001, 002, 003...)
- `descriptive_name` = Lowercase with underscores
- `.sql` = File extension

**Examples:**
- ✅ `015_add_payment_plans.sql`
- ✅ `016_create_audit_logs.sql`
- ❌ `addPaymentPlans.sql`
- ❌ `15-payment-plans.sql`

---

## Creating a New Migration

### Step 1: Create Migration File
```sql
-- scripts/015_add_payment_plans.sql

-- Add payment plan support
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  installments INTEGER NOT NULL,
  interval VARCHAR NOT NULL, -- 'monthly', 'quarterly'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taxpayers can view their payment plans"
  ON payment_plans
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE taxpayer_id = auth.uid()
    )
  );
```

### Step 2: Test Locally
1. Apply to local Supabase database
2. Verify tables created correctly
3. Test RLS policies work as expected

### Step 3: Update Documentation
1. Add to "Applied Migrations" table above
2. Update `DATABASE_SCHEMA.md` with new table

### Step 4: Deploy to Production
1. Apply to staging environment
2. Test thoroughly
3. Apply to production database
4. Mark as applied in this tracker

---

## Rollback Procedures

### **CAUTION:** Rollbacks can cause data loss!

#### Rollback Strategy
1. **Create backup** before applying any migration:
```sql
-- Backup specific table
CREATE TABLE properties_backup AS SELECT * FROM properties;
```

2. **Write DOWN migration** for every UP migration:
```sql
-- scripts/015_add_payment_plans_DOWN.sql
DROP TABLE IF EXISTS payment_plans;
```

3. **Test rollback** in staging before production

---

## Environment Sync Status

| Environment | Last Sync Date | Current Migration | Status |
|-------------|----------------|-------------------|--------|
| **Local** | 2026-01-29 | 014 | ✅ Up-to-date |
| **Staging** | [TBD] | [TBD] | 🟡 Unknown |
| **Production** | [TBD] | [TBD] | 🟡 Unknown |

---

## Migration Checklist

Before applying a migration to production:

- [ ] Migration tested locally
- [ ] Migration tested in staging
- [ ] `DATABASE_SCHEMA.md` updated
- [ ] RLS policies verified
- [ ] Indexes added for new columns
- [ ] Rollback script prepared
- [ ] Database backup created
- [ ] Team notified of deployment

---

## Common Migration Patterns

### Adding a New Column
```sql
-- Add column with default value (no downtime)
ALTER TABLE properties
  ADD COLUMN new_field VARCHAR DEFAULT 'default_value';

-- Backfill data (if needed)
UPDATE properties SET new_field = 'calculated_value' WHERE new_field IS NULL;

-- Make NOT NULL (after backfill)
ALTER TABLE properties
  ALTER COLUMN new_field SET NOT NULL;
```

### Creating a New Table
```sql
-- Create table
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "policy_name"
  ON new_table
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_new_table_user_id ON new_table(user_id);
```

### Modifying Existing Data
```sql
-- Use transactions for data modifications
BEGIN;

-- Update data
UPDATE invoices
  SET status = 'overdue'
  WHERE due_date < NOW() AND status = 'unpaid';

-- Verify changes
SELECT COUNT(*) FROM invoices WHERE status = 'overdue';

-- Commit if correct
COMMIT;
-- Or rollback if incorrect
-- ROLLBACK;
```

---

## Troubleshooting

### Migration Failed Mid-Execution
1. Check Supabase logs for error message
2. Verify syntax in migration file
3. Check for constraint violations
4. Rollback partial changes if possible
5. Fix issue and re-apply

### RLS Policy Blocking Queries
1. Temporarily disable RLS to debug:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```
2. Fix policy
3. Re-enable RLS:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Slow Migration Execution
- Migrations that modify large tables can lock the table
- Schedule during low-traffic periods
- Consider batching updates:
```sql
-- Instead of one large update
UPDATE large_table SET field = 'value';

-- Do batched updates
UPDATE large_table SET field = 'value' WHERE id IN (
  SELECT id FROM large_table LIMIT 1000
);
-- Repeat until all rows updated
```

---

**Last Updated:** 2026-01-29  
**Maintained by:** Development Team
