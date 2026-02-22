-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to Listing (1536 dimensions for OpenAI text-embedding-3-small)
ALTER TABLE "Listing" ADD COLUMN "embedding" vector(1536);
