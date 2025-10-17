-- =====================================================
-- Population Script: LGAs from PayKaduna API
-- =====================================================

-- Insert LGAs with PayKaduna IDs for Kaduna State
INSERT INTO lgas (lga_id, name, state) VALUES
  (1, 'Birnin Gwari', 'Kaduna'),
  (2, 'Chikun', 'Kaduna'),
  (3, 'Giwa', 'Kaduna'),
  (4, 'Igabi', 'Kaduna'),
  (5, 'Ikara', 'Kaduna'),
  (6, 'Jaba', 'Kaduna'),
  (7, 'Jema''a', 'Kaduna'),
  (8, 'Kachia', 'Kaduna'),
  (9, 'Kaduna North', 'Kaduna'),
  (10, 'Kaduna South', 'Kaduna'),
  (11, 'Kagarko', 'Kaduna'),
  (12, 'Kajuru', 'Kaduna'),
  (13, 'Kaura', 'Kaduna'),
  (14, 'Kauru', 'Kaduna'),
  (15, 'Kubau', 'Kaduna'),
  (16, 'Kudan', 'Kaduna'),
  (17, 'Lere', 'Kaduna'),
  (18, 'Makarfi', 'Kaduna'),
  (19, 'Sabon Gari', 'Kaduna'),
  (20, 'Sanga', 'Kaduna'),
  (21, 'Soba', 'Kaduna'),
  (22, 'Zangon Kataf', 'Kaduna'),
  (23, 'Zaria', 'Kaduna')
ON CONFLICT (lga_id) DO UPDATE SET
  name = EXCLUDED.name,
  state = EXCLUDED.state,
  updated_at = NOW();
