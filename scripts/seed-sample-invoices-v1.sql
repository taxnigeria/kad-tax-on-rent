-- Sample invoices for user: 8f485396-97e4-445c-b3c3-e65e0c7e33fd
-- This script creates realistic invoice data with various statuses

DO $$
DECLARE
  v_user_id UUID := '8f485396-97e4-445c-b3c3-e65e0c7e33fd';
  v_property_id_1 UUID;
  v_property_id_2 UUID;
  v_address_id_1 UUID;
  v_address_id_2 UUID;
  v_tax_calc_id_1 UUID;
  v_tax_calc_id_2 UUID;
  v_tax_calc_id_3 UUID;
  v_invoice_id UUID;
BEGIN
  -- Create addresses one at a time with RETURNING
  INSERT INTO addresses (id, street_address, city, lga, state, country, postal_code, latitude, longitude)
  VALUES (gen_random_uuid(), '123 Ahmadu Bello Way', 'Kaduna', 'Kaduna North', 'Kaduna', 'Nigeria', '800001', 10.5105, 7.4165)
  RETURNING id INTO v_address_id_1;
  
  INSERT INTO addresses (id, street_address, city, lga, state, country, postal_code, latitude, longitude)
  VALUES (gen_random_uuid(), '45 Constitution Road', 'Kaduna', 'Kaduna South', 'Kaduna', 'Nigeria', '800002', 10.5230, 7.4387)
  RETURNING id INTO v_address_id_2;

  -- Create properties one at a time with RETURNING
  INSERT INTO properties (
    id, owner_id, registered_property_name, property_reference, kadirs_property_id,
    property_type, property_category, house_number, street_name, address_id,
    total_annual_rent, rental_commencement_date, status, verification_status,
    total_units, occupied_units, year_built, number_of_floors, total_floor_area,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, 'Grand Plaza Shopping Complex', 'PROP-2024-001', 'KAD-COM-001',
    'commercial', 'shopping_complex', '123', 'Ahmadu Bello Way', v_address_id_1,
    12000000.00, '2023-01-01', 'active', 'verified',
    20, 18, 2020, 3, 5000.00,
    NOW(), NOW()
  )
  ON CONFLICT (property_reference) DO NOTHING
  RETURNING id INTO v_property_id_1;
  
  -- If property already exists, get its ID
  IF v_property_id_1 IS NULL THEN
    SELECT id INTO v_property_id_1 FROM properties WHERE property_reference = 'PROP-2024-001' LIMIT 1;
  END IF;

  INSERT INTO properties (
    id, owner_id, registered_property_name, property_reference, kadirs_property_id,
    property_type, property_category, house_number, street_name, address_id,
    total_annual_rent, rental_commencement_date, status, verification_status,
    total_units, occupied_units, year_built, number_of_floors, total_floor_area,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, 'Sunrise Residential Apartments', 'PROP-2024-002', 'KAD-RES-002',
    'residential', 'apartment_building', '45', 'Constitution Road', v_address_id_2,
    8400000.00, '2022-06-01', 'active', 'verified',
    12, 12, 2019, 4, 3200.00,
    NOW(), NOW()
  )
  ON CONFLICT (property_reference) DO NOTHING
  RETURNING id INTO v_property_id_2;
  
  IF v_property_id_2 IS NULL THEN
    SELECT id INTO v_property_id_2 FROM properties WHERE property_reference = 'PROP-2024-002' LIMIT 1;
  END IF;

  -- Create tax calculations one at a time with RETURNING
  INSERT INTO tax_calculations (
    id, property_id, tax_year, annual_rent, tax_rate, base_tax_amount,
    penalty_amount, interest_amount, total_tax_due, calculation_method,
    calculation_date, calculated_by, is_active
  ) VALUES (
    gen_random_uuid(), v_property_id_1, 2024, 12000000.00, 10.00, 1200000.00,
    0.00, 0.00, 1200000.00, 'standard',
    '2024-01-15', v_user_id, true
  )
  RETURNING id INTO v_tax_calc_id_1;

  INSERT INTO tax_calculations (
    id, property_id, tax_year, annual_rent, tax_rate, base_tax_amount,
    penalty_amount, interest_amount, total_tax_due, calculation_method,
    calculation_date, calculated_by, is_active
  ) VALUES (
    gen_random_uuid(), v_property_id_1, 2023, 12000000.00, 10.00, 1200000.00,
    120000.00, 60000.00, 1380000.00, 'standard',
    '2023-01-15', v_user_id, true
  )
  RETURNING id INTO v_tax_calc_id_2;

  INSERT INTO tax_calculations (
    id, property_id, tax_year, annual_rent, tax_rate, base_tax_amount,
    penalty_amount, interest_amount, total_tax_due, calculation_method,
    calculation_date, calculated_by, is_active
  ) VALUES (
    gen_random_uuid(), v_property_id_2, 2024, 8400000.00, 10.00, 840000.00,
    0.00, 0.00, 840000.00, 'standard',
    '2024-01-15', v_user_id, true
  )
  RETURNING id INTO v_tax_calc_id_3;

  -- Invoice 1: Paid invoice for 2024 (Property 1)
  INSERT INTO invoices (
    id, invoice_number, bill_reference, taxpayer_id, property_id, tax_calculation_id,
    tax_year, tax_period, base_amount, stamp_duty, penalty, interest, discount,
    total_amount, amount_paid, balance_due, payment_status,
    issue_date, due_date, paid_date, narration, created_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'INV-2024-001', 'BILL-2024-001', v_user_id, v_property_id_1, v_tax_calc_id_1,
    2024, '2024', 1200000.00, 12000.00, 0.00, 0.00, 0.00,
    1212000.00, 1212000.00, 0.00, 'paid',
    '2024-01-15', '2024-03-15', '2024-02-20',
    'Property tax for Grand Plaza Shopping Complex - 2024', v_user_id, NOW(), NOW()
  ) RETURNING id INTO v_invoice_id;

  -- Add payment record for Invoice 1
  INSERT INTO payments (
    id, invoice_id, payment_reference, transaction_id, amount, payment_method,
    payment_date, receipt_number, verification_status, recorded_by, created_at
  ) VALUES (
    gen_random_uuid(), v_invoice_id, 'PAY-2024-001', 'TXN-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    1212000.00, 'bank_transfer', '2024-02-20', 'RCP-2024-001', 'verified', v_user_id, NOW()
  );

  -- Invoice 2: Overdue invoice for 2023 (Property 1) with penalties
  INSERT INTO invoices (
    id, invoice_number, bill_reference, taxpayer_id, property_id, tax_calculation_id,
    tax_year, tax_period, base_amount, stamp_duty, penalty, interest, discount,
    total_amount, amount_paid, balance_due, payment_status,
    issue_date, due_date, narration, created_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'INV-2023-001', 'BILL-2023-001', v_user_id, v_property_id_1, v_tax_calc_id_2,
    2023, '2023', 1200000.00, 12000.00, 120000.00, 60000.00, 0.00,
    1392000.00, 0.00, 1392000.00, 'overdue',
    '2023-01-15', '2023-03-15',
    'Property tax for Grand Plaza Shopping Complex - 2023 (OVERDUE - includes penalties)', v_user_id, NOW(), NOW()
  );

  -- Invoice 3: Partially paid invoice for 2024 (Property 2)
  INSERT INTO invoices (
    id, invoice_number, bill_reference, taxpayer_id, property_id, tax_calculation_id,
    tax_year, tax_period, base_amount, stamp_duty, penalty, interest, discount,
    total_amount, amount_paid, balance_due, payment_status,
    issue_date, due_date, narration, created_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'INV-2024-002', 'BILL-2024-002', v_user_id, v_property_id_2, v_tax_calc_id_3,
    2024, '2024', 840000.00, 8400.00, 0.00, 0.00, 0.00,
    848400.00, 400000.00, 448400.00, 'partial',
    '2024-01-15', '2024-03-15',
    'Property tax for Sunrise Residential Apartments - 2024', v_user_id, NOW(), NOW()
  ) RETURNING id INTO v_invoice_id;

  -- Add partial payment record for Invoice 3
  INSERT INTO payments (
    id, invoice_id, payment_reference, transaction_id, amount, payment_method,
    payment_date, receipt_number, verification_status, recorded_by, created_at
  ) VALUES (
    gen_random_uuid(), v_invoice_id, 'PAY-2024-002', 'TXN-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
    400000.00, 'bank_transfer', '2024-02-10', 'RCP-2024-002', 'verified', v_user_id, NOW()
  );

  -- Invoice 4: Unpaid current invoice (Property 2)
  INSERT INTO invoices (
    id, invoice_number, bill_reference, taxpayer_id, property_id, tax_calculation_id,
    tax_year, tax_period, base_amount, stamp_duty, penalty, interest, discount,
    total_amount, amount_paid, balance_due, payment_status,
    issue_date, due_date, narration, created_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'INV-2024-003', 'BILL-2024-003', v_user_id, v_property_id_2, v_tax_calc_id_3,
    2024, 'Q1-2024', 210000.00, 2100.00, 0.00, 0.00, 0.00,
    212100.00, 0.00, 212100.00, 'unpaid',
    '2024-10-01', '2024-12-31',
    'Quarterly property tax for Sunrise Residential Apartments - Q1 2024', v_user_id, NOW(), NOW()
  );

  -- Invoice 5: Cancelled invoice
  INSERT INTO invoices (
    id, invoice_number, bill_reference, taxpayer_id, property_id, tax_calculation_id,
    tax_year, tax_period, base_amount, stamp_duty, penalty, interest, discount,
    total_amount, amount_paid, balance_due, payment_status,
    issue_date, due_date, narration, created_by, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), 'INV-2024-004-VOID', 'BILL-2024-004', v_user_id, v_property_id_1, v_tax_calc_id_1,
    2024, 'Q2-2024', 300000.00, 3000.00, 0.00, 0.00, 0.00,
    303000.00, 0.00, 303000.00, 'cancelled',
    '2024-04-01', '2024-06-30',
    'CANCELLED - Duplicate invoice created in error', v_user_id, NOW(), NOW()
  );

  RAISE NOTICE 'Sample invoices created successfully for user: %', v_user_id;
END $$;
