-- Drop tables if they exist to ensure clean slate for this demo
DROP TABLE IF EXISTS citation_metadata CASCADE;
DROP TABLE IF EXISTS citations CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citations Table
CREATE TABLE citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('in-text', 'reference')),
  raw_text VARCHAR(500) NOT NULL,
  authors TEXT[],
  year INTEGER,
  match_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metadata Table
CREATE TABLE citation_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_id UUID REFERENCES citations(id) ON DELETE CASCADE,
  title VARCHAR(500),
  authors TEXT[],
  journal VARCHAR(200),
  year INTEGER,
  doi VARCHAR(100),
  url VARCHAR(500),
  abstract TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_citations_document_id ON citations(document_id);
CREATE INDEX idx_citations_match_status ON citations(match_status);
CREATE INDEX idx_metadata_citation_id ON citation_metadata(citation_id);
CREATE INDEX idx_metadata_doi ON citation_metadata(doi);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_metadata ENABLE ROW LEVEL SECURITY;

-- Create Policies for Anon Access (for demo simplicity)
CREATE POLICY "Anon can all on documents" ON documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can all on citations" ON citations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can all on citation_metadata" ON citation_metadata FOR ALL TO anon USING (true) WITH CHECK (true);

-- Grant permissions just in case
GRANT ALL ON documents TO anon;
GRANT ALL ON citations TO anon;
GRANT ALL ON citation_metadata TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
