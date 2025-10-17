-- =====================================================
-- Population Script: Industries from PayKaduna API
-- =====================================================

-- Insert industries with PayKaduna IDs
INSERT INTO industries (industry_id, name, description, is_active) VALUES
  (1, 'Agriculture', 'Farming, livestock, and agricultural services', true),
  (2, 'Oil and Gas', 'Oil and gas exploration, production, and services', true),
  (3, 'Banking and Finance', 'Banking, financial services, and investment', true),
  (4, 'Telecommunications', 'Telecom and communication services', true),
  (5, 'Manufacturing', 'Production and manufacturing industries', true),
  (6, 'Real Estate', 'Property development and real estate services', true),
  (7, 'Construction', 'Building and construction services', true),
  (8, 'Healthcare', 'Medical and healthcare services', true),
  (9, 'Information Technology (IT)', 'Information technology and software services', true),
  (10, 'Education', 'Educational institutions and services', true),
  (11, 'Transportation and Logistics', 'Transportation, logistics, and delivery services', true),
  (12, 'Hospitality and Tourism', 'Hotels, restaurants, and tourism services', true),
  (13, 'Retail and Wholesale', 'Retail and wholesale trade', true),
  (14, 'Renewable Energy', 'Solar, wind, and renewable energy services', true),
  (15, 'Mining and Quarrying', 'Mining, quarrying, and mineral extraction', true),
  (16, 'Media and Entertainment', 'Media, entertainment, and creative industries', true),
  (17, 'Insurance', 'Insurance and risk management services', true),
  (18, 'Textile and Garment Industry', 'Textile manufacturing and garment production', true),
  (19, 'Automobile Industry', 'Automobile manufacturing, sales, and services', true)
ON CONFLICT (industry_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();
