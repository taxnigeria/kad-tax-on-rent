-- =====================================================
-- Population Script: Tax Stations from PayKaduna API
-- =====================================================

-- Clear existing area offices first (optional - remove if you want to keep existing data)
-- TRUNCATE area_offices CASCADE;

-- Insert tax stations with PayKaduna IDs
INSERT INTO area_offices (tax_station_id, office_name, office_code, is_active) VALUES
  (2, 'Kakuri East', 'KKE-002', true),
  (3, 'Tudun Wada', 'TDW-003', true),
  (4, 'Kakuri West', 'KKW-004', true),
  (5, 'Kafanchan', 'KFC-005', true),
  (6, 'Zaria', 'ZRA-006', true),
  (7, 'Kawo', 'KWO-007', true),
  (8, 'Doka East', 'DKE-008', true),
  (9, 'Doka West', 'DKW-009', true),
  (10, 'Samaru', 'SMR-010', true),
  (11, 'Zonkwa', 'ZNK-011', true),
  (12, 'Kachia', 'KCH-012', true),
  (13, 'Jere', 'JRE-013', true),
  (14, 'Birnin Gwari', 'BGW-014', true),
  (15, 'Turunku', 'TRK-015', true),
  (16, 'Giwa', 'GWA-016', true),
  (17, 'Makarfi', 'MKF-017', true),
  (18, 'Ikara', 'IKR-018', true),
  (19, 'Soba', 'SOB-019', true),
  (20, 'Saminaka', 'SMN-020', true),
  (21, 'Kaura', 'KRA-021', true),
  (22, 'Kauru', 'KRU-022', true),
  (23, 'Kudan', 'KDN-023', true),
  (24, 'Kajuru', 'KJR-024', true),
  (25, 'Kubau', 'KBU-025', true),
  (26, 'Gwantu', 'GWT-026', true),
  (27, 'Rigasa Mini', 'RGM-027', true),
  (28, 'Sabo Mini', 'SBM-028', true),
  (29, 'Oriakata Mini', 'ORM-029', true),
  (30, 'Sheikh Gumi Market', 'SGM-030', true),
  (31, 'Kwoi', 'KWI-031', true),
  (32, 'Sabon Gari', 'SBG-032', true),
  (33, 'Abuja', 'ABJ-033', true),
  (34, 'CMR MLA', 'CMR-034', true),
  (35, 'Obasanjo House MLA', 'OBH-035', true),
  (36, 'FRSC MLA', 'FRS-036', true)
ON CONFLICT (tax_station_id) DO UPDATE SET
  office_name = EXCLUDED.office_name,
  office_code = EXCLUDED.office_code,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
