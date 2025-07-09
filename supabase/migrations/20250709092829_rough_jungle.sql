/*
  # Consolidated Schema Setup
  
  1. Database Structure
    - Tables for user profiles, projects, and project files
    - Tables for AI sessions, messages, and usage tracking
    - Tables for deployments and deployment logs
    
  2. Security
    - Row-level security policies for all tables
    - Proper permissions based on user roles and ownership
    
  3. Functions
    - Functions for updating timestamps
    - Functions for creating default user settings
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{
    "theme": "dark", 
    "editor": {
      "minimap": true, 
      "tabSize": 2, 
      "fontSize": 14, 
      "wordWrap": true, 
      "fontFamily": "Monaco", 
      "lineNumbers": true
    }, 
    "language": "en", 
    "notifications": {
      "push": false, 
      "email": true, 
      "desktop": true
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  subscription_tier TEXT DEFAULT 'free' NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (uid() = id);

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (uid() = id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  framework TEXT DEFAULT 'React' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{
    "outputDir": "dist", 
    "devCommand": "npm run dev", 
    "nodeVersion": "18", 
    "buildCommand": "npm run build", 
    "packageManager": "npm"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  agent_id UUID REFERENCES agents(id)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (owner_id = uid());

CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT USING (owner_id = uid());

CREATE POLICY "Users can read collaborated projects" ON projects
  FOR SELECT USING (
    id IN (
      SELECT project_id
      FROM project_collaborators
      WHERE user_id = uid() AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (owner_id = uid());

CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (owner_id = uid());
  
-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'text',
  size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can modify files in projects they have write access" ON project_files
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
      UNION
      SELECT pc.project_id
      FROM project_collaborators pc
      WHERE pc.user_id = uid() 
        AND pc.joined_at IS NOT NULL 
        AND (pc.permissions->>'write')::boolean = true
    )
  );

CREATE POLICY "Users can read files from accessible projects" ON project_files
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
      UNION
      SELECT project_id
      FROM project_collaborators
      WHERE user_id = uid() AND joined_at IS NOT NULL
    )
  );

-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  permissions JSONB DEFAULT '{"read": true, "admin": false, "write": false, "deploy": false}',
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(project_id, user_id),
  CHECK (role = ANY(ARRAY['owner', 'admin', 'member', 'viewer']))
);

ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
    )
  );

CREATE POLICY "Users can read project collaborators for their projects" ON project_collaborators
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
    ) OR
    user_id = uid()
  );

-- Create ai_sessions table
CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'AI Session' NOT NULL,
  provider_id UUID REFERENCES ai_providers(id),
  model TEXT DEFAULT '',
  context JSONB DEFAULT '{"framework": "React", "environment": {}, "dependencies": []}',
  token_usage JSONB DEFAULT '{"input": 0, "total": 0, "output": 0}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  latency_ms INTEGER,
  cost_usd NUMERIC(10,4),
  tokens_used INTEGER,
  system_prompt TEXT,
  execution_plan JSONB,
  planning_trace JSONB,
  goal TEXT,
  execution_mode TEXT DEFAULT 'auto'
);

ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create AI sessions for accessible projects" ON ai_sessions
  FOR INSERT WITH CHECK (
    (user_id = uid()) AND
    (project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
      UNION
      SELECT project_id
      FROM project_collaborators
      WHERE user_id = uid() AND joined_at IS NOT NULL
    ))
  );

CREATE POLICY "Users can read own AI sessions" ON ai_sessions
  FOR SELECT USING (user_id = uid());

CREATE POLICY "Users can update own AI sessions" ON ai_sessions
  FOR UPDATE USING (user_id = uid());

CREATE POLICY "Users can delete own AI sessions" ON ai_sessions
  FOR DELETE USING (user_id = uid());

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{"files": [], "model": "", "tokens": 0, "codeBlocks": [], "suggestions": []}',
  created_at TIMESTAMPTZ DEFAULT now(),
  role TEXT DEFAULT 'user',
  CHECK (type = ANY(ARRAY['user', 'assistant', 'system']))
);

ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create messages in own sessions" ON ai_messages
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM ai_sessions WHERE user_id = uid()
    )
  );

CREATE POLICY "Users can read messages from own sessions" ON ai_messages
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM ai_sessions WHERE user_id = uid()
    )
  );

-- Create code_suggestions table
CREATE TABLE IF NOT EXISTS code_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  file_path TEXT,
  line_number INTEGER,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (confidence >= 0 AND confidence <= 1),
  CHECK (type = ANY(ARRAY['completion', 'refactor', 'optimization', 'security', 'bug-fix']))
);

ALTER TABLE code_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create suggestions in own sessions" ON code_suggestions
  FOR ALL USING (
    session_id IN (
      SELECT id FROM ai_sessions WHERE user_id = uid()
    )
  );

CREATE POLICY "Users can read suggestions from own sessions" ON code_suggestions
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM ai_sessions WHERE user_id = uid()
    )
  );

-- Create ai_providers table
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  config JSONB DEFAULT '{"models": [], "endpoints": {}, "capabilities": []}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (status = ANY(ARRAY['connected', 'disconnected', 'error'])),
  CHECK (type = ANY(ARRAY['openai', 'anthropic', 'google', 'local', 'custom']))
);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read AI providers" ON ai_providers
  FOR SELECT USING (true);

-- Create llm_models table
CREATE TABLE IF NOT EXISTS llm_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT,
  context_window INTEGER,
  capabilities JSONB DEFAULT '{"vision": false, "functions": false}',
  model_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_llm_models_provider_id ON llm_models (provider_id);

CREATE POLICY "Authenticated users can read models" ON llm_models
  FOR SELECT USING (true);

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  environment TEXT DEFAULT 'production',
  status TEXT DEFAULT 'pending',
  url TEXT,
  provider TEXT DEFAULT 'cloudflare',
  config JSONB DEFAULT '{"outputDir": "dist", "environment": {}, "buildCommand": "npm run build"}',
  logs JSONB DEFAULT '[]',
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (environment = ANY(ARRAY['development', 'staging', 'production'])),
  CHECK (status = ANY(ARRAY['pending', 'building', 'deploying', 'success', 'failed'])),
  CHECK (provider = ANY(ARRAY['cloudflare', 'vercel', 'netlify']))
);

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_deployments_project_id ON deployments (project_id);
CREATE INDEX idx_deployments_status ON deployments (status);
CREATE INDEX idx_deployments_user_id ON deployments (user_id);

CREATE POLICY "Users can create deployments for projects with deploy access" ON deployments
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
      UNION
      SELECT pc.project_id
      FROM project_collaborators pc
      WHERE pc.user_id = uid() 
        AND pc.joined_at IS NOT NULL 
        AND (pc.permissions->>'deploy')::boolean = true
    )
  );

CREATE POLICY "Users can read deployments for accessible projects" ON deployments
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
      UNION
      SELECT project_id
      FROM project_collaborators
      WHERE user_id = uid() AND joined_at IS NOT NULL
    )
  );

-- Create usage_stats table
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES ai_sessions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  type TEXT DEFAULT 'chat',
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost NUMERIC(10,6) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (type = ANY(ARRAY['chat', 'code-generation', 'code-analysis', 'cache_hit', 'error']))
);

ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_usage_stats_session ON usage_stats (session_id);
CREATE INDEX idx_usage_stats_user_created ON usage_stats (user_id, created_at DESC);

CREATE POLICY "System can create usage stats" ON usage_stats
  FOR INSERT WITH CHECK (user_id = uid());

CREATE POLICY "Users can read own usage stats" ON usage_stats
  FOR SELECT USING (user_id = uid());

-- Create environment_variables table
CREATE TABLE IF NOT EXISTS environment_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  environment TEXT DEFAULT 'development',
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, key, environment),
  CHECK (environment = ANY(ARRAY['development', 'staging', 'production']))
);

ALTER TABLE environment_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read env vars for accessible projects" ON environment_variables
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
      UNION
      SELECT project_id
      FROM project_collaborators
      WHERE user_id = uid() AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can manage env vars for projects with write access" ON environment_variables
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = uid()
      UNION
      SELECT pc.project_id
      FROM project_collaborators pc
      WHERE pc.user_id = uid() 
        AND pc.joined_at IS NOT NULL 
        AND (pc.permissions->>'write')::boolean = true
    )
  );

-- Create user_quotas table
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quota_type TEXT NOT NULL,
  limit_value INTEGER NOT NULL DEFAULT 10000,
  used_value INTEGER DEFAULT 0,
  period TEXT NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quota_type, period),
  CHECK (period = ANY(ARRAY['daily', 'monthly'])),
  CHECK (quota_type = ANY(ARRAY['daily_tokens', 'monthly_tokens', 'daily_requests', 'monthly_requests', 'daily_cost', 'monthly_cost']))
);

ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_quotas_user_type ON user_quotas (user_id, quota_type);

CREATE POLICY "Users can read own quotas" ON user_quotas
  FOR SELECT USING (user_id = uid());

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL,
  price_yearly NUMERIC(10,2) NOT NULL,
  features JSONB NOT NULL,
  quotas JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (name = ANY(ARRAY['free', 'pro', 'team', 'enterprise']))
);

ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read subscription tiers" ON subscription_tiers
  FOR SELECT USING (true);
  
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL REFERENCES subscription_tiers(name) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_provider TEXT DEFAULT 'stripe',
  payment_provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (status = ANY(ARRAY['active', 'past_due', 'canceled', 'trialing']))
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (user_id = uid());

-- Create triggers for updated_at columns
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_sessions_updated_at
  BEFORE UPDATE ON ai_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environment_variables_updated_at
  BEFORE UPDATE ON environment_variables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON user_quotas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for user creation and initialization
CREATE OR REPLACE FUNCTION create_default_workbench_configuration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workbench_configurations (user_id, name, is_default)
  VALUES (NEW.id, 'Default', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_default_quotas()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_quotas (user_id, quota_type, limit_value, period, reset_at)
  VALUES 
    (NEW.id, 'daily_tokens', 10000, 'daily', (now() + interval '1 day')::date::timestamptz),
    (NEW.id, 'monthly_tokens', 100000, 'monthly', (date_trunc('month', now()) + interval '1 month')::timestamptz);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for profile creation
CREATE TRIGGER on_user_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_workbench_configuration();

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_quotas();

-- Insert default subscription tiers
INSERT INTO subscription_tiers (
  name,
  display_name,
  price_monthly,
  price_yearly,
  features,
  quotas
) VALUES 
  ('free', 'Free', 0.00, 0.00, 
   '[
     "3 projects",
     "1 collaborator",
     "5 deployments/month",
     "Community support",
     "Basic AI models",
     "30-day history"
   ]', 
   '{
     "projects": 3,
     "collaborators": 1,
     "deployments": 5,
     "tokens": {
       "daily": 10000,
       "monthly": 100000
     },
     "requests": {
       "daily": 100,
       "monthly": 1000
     }
   }'
  ),
  ('pro', 'Professional', 29.99, 299.90,
   '[
     "10 projects",
     "5 collaborators",
     "20 deployments/month",
     "Priority support",
     "All AI models",
     "6-month history",
     "Custom domains",
     "Private repositories"
   ]',
   '{
     "projects": 10,
     "collaborators": 5,
     "deployments": 20,
     "tokens": {
       "daily": 50000,
       "monthly": 1000000
     },
     "requests": {
       "daily": 500,
       "monthly": 10000
     }
   }'
  ),
  ('team', 'Team', 99.99, 999.90,
   '[
     "50 projects",
     "20 collaborators",
     "100 deployments/month",
     "Priority support",
     "All AI models",
     "1-year history",
     "Custom domains",
     "Private repositories",
     "Team management",
     "Advanced analytics",
     "Audit logs"
   ]',
   '{
     "projects": 50,
     "collaborators": 20,
     "deployments": 100,
     "tokens": {
       "daily": 200000,
       "monthly": 5000000
     },
     "requests": {
       "daily": 2000,
       "monthly": 50000
     }
   }'
  );