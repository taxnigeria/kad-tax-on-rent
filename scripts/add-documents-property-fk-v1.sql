-- Add foreign key constraint from documents.entity_id to properties.id
-- This allows us to query documents related to properties

ALTER TABLE documents
ADD CONSTRAINT documents_property_id_fkey 
FOREIGN KEY (entity_id) 
REFERENCES properties(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON documents(entity_id) WHERE entity_type = 'property';
