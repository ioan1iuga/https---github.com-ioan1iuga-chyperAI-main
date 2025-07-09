/*
  # Create AI tables if they don't exist

  1. New Tables
    - `ai_providers` - Stores information about AI providers
    - `llm_models` - Stores information about LLM models

  2. Data
    - Inserts default providers: OpenAI, Anthropic, Google
    - Inserts default models for each provider
*/

-- Create AI providers table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL,
  status text DEFAULT 'disconnected',
  config jsonb DEFAULT '{"models": [], "endpoints": {}, "capabilities": []}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create table constraint for provider type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_providers_type_check'
  ) THEN
    ALTER TABLE ai_providers 
    ADD CONSTRAINT ai_providers_type_check 
    CHECK (type = ANY (ARRAY['openai', 'anthropic', 'google', 'local', 'custom']));
  END IF;
END $$;

-- Create table constraint for status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_providers_status_check'
  ) THEN
    ALTER TABLE ai_providers 
    ADD CONSTRAINT ai_providers_status_check 
    CHECK (status = ANY (ARRAY['connected', 'disconnected', 'error']));
  END IF;
END $$;

-- Create LLM models table if it doesn't exist
CREATE TABLE IF NOT EXISTS llm_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES ai_providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  version text,
  context_window integer,
  capabilities jsonb DEFAULT '{"vision": false, "functions": false}'::jsonb,
  model_type text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create index on provider_id
CREATE INDEX IF NOT EXISTS idx_llm_models_provider_id ON llm_models(provider_id);

-- Enable RLS on the tables
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for AI providers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can read AI providers'
  ) THEN
    CREATE POLICY "Authenticated users can read AI providers" 
    ON ai_providers FOR SELECT TO authenticated 
    USING (true);
  END IF;
END $$;

-- Create RLS policies for LLM models
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can read models'
  ) THEN
    CREATE POLICY "Authenticated users can read models" 
    ON llm_models FOR SELECT TO authenticated 
    USING (true);
  END IF;
END $$;

-- Insert AI providers if they don't exist
INSERT INTO ai_providers (id, name, type, status, config)
VALUES 
  (gen_random_uuid(), 'OpenAI', 'openai', 'connected', '{
    "models": ["gpt-4", "gpt-3.5-turbo"],
    "endpoints": {
      "chat": "/v1/chat/completions",
      "embeddings": "/v1/embeddings"
    },
    "capabilities": ["chat", "code-generation", "code-analysis", "function-calling"]
  }'),
  (gen_random_uuid(), 'Anthropic', 'anthropic', 'connected', '{
    "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    "endpoints": {
      "chat": "/v1/messages"
    },
    "capabilities": ["chat", "code-generation", "code-analysis"]
  }'),
  (gen_random_uuid(), 'Google', 'google', 'connected', '{
    "models": ["gemini-pro", "gemini-pro-vision"],
    "endpoints": {
      "chat": "/v1beta/models/:modelId/generateContent"
    },
    "capabilities": ["chat", "code-generation", "code-analysis", "vision"]
  }')
ON CONFLICT (name) DO NOTHING;

-- Insert LLM models for OpenAI
WITH openai_provider AS (
  SELECT id FROM ai_providers WHERE name = 'OpenAI' LIMIT 1
)
INSERT INTO llm_models (provider_id, name, version, context_window, capabilities, model_type, status)
VALUES 
  ((SELECT id FROM openai_provider), 'GPT-4', 'gpt-4', 8192, '{
    "vision": false,
    "functions": true
  }', 'completion', 'active'),
  ((SELECT id FROM openai_provider), 'GPT-3.5 Turbo', 'gpt-3.5-turbo', 4096, '{
    "vision": false, 
    "functions": true
  }', 'completion', 'active')
ON CONFLICT DO NOTHING;

-- Insert LLM models for Anthropic
WITH anthropic_provider AS (
  SELECT id FROM ai_providers WHERE name = 'Anthropic' LIMIT 1
)
INSERT INTO llm_models (provider_id, name, version, context_window, capabilities, model_type, status)
VALUES 
  ((SELECT id FROM anthropic_provider), 'Claude 3 Opus', 'claude-3-opus', 200000, '{
    "vision": true,
    "functions": false
  }', 'completion', 'active'),
  ((SELECT id FROM anthropic_provider), 'Claude 3 Sonnet', 'claude-3-sonnet', 200000, '{
    "vision": true, 
    "functions": false
  }', 'completion', 'active'),
  ((SELECT id FROM anthropic_provider), 'Claude 3 Haiku', 'claude-3-haiku', 100000, '{
    "vision": true, 
    "functions": false
  }', 'completion', 'active')
ON CONFLICT DO NOTHING;

-- Insert LLM models for Google
WITH google_provider AS (
  SELECT id FROM ai_providers WHERE name = 'Google' LIMIT 1
)
INSERT INTO llm_models (provider_id, name, version, context_window, capabilities, model_type, status)
VALUES 
  ((SELECT id FROM google_provider), 'Gemini Pro', 'gemini-pro', 30720, '{
    "vision": false,
    "functions": true
  }', 'completion', 'active'),
  ((SELECT id FROM google_provider), 'Gemini Pro Vision', 'gemini-pro-vision', 30720, '{
    "vision": true, 
    "functions": true
  }', 'completion', 'active')
ON CONFLICT DO NOTHING;