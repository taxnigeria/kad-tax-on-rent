-- Enable realtime for the invoices table
-- This allows clients to subscribe to changes in real-time

ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- Also enable realtime for payments table so payment updates trigger invoice refreshes
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
