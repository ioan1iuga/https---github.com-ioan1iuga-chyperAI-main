/*
  # Session Management and Security Audit System
  
  1. New Tables
    - `user_sessions` - Stores information about user sessions
    - `security_audit_logs` - Stores security-related events for auditing
    
  2. Indexes and Constraints
    - Adds indexes for performance optimization
    - Adds constraints for data integrity
    
  3. Functions
    - Functions for session cleanup
    - Functions for security audit logging
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  refresh_token TEXT,
  user_agent TEXT,
  ip_address TEXT,
  last_active TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  device_info JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  CHECK (expires_at > created_at)
);

-- Create indexes for user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions (session_token);
CREATE INDEX idx_user_sessions_valid ON user_sessions (is_valid);
CREATE INDEX idx_user_sessions_expires ON user_sessions (expires_at);

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_sessions
CREATE POLICY "Users can read own sessions" ON user_sessions
  FOR SELECT USING (user_id = uid());

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (user_id = uid());

-- Create security_audit_logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (event_type = ANY(ARRAY[
    'login_success', 'login_failure', 'logout', 
    'password_change', 'email_change', 'profile_update',
    'session_create', 'session_refresh', 'session_invalidate',
    'api_key_create', 'api_key_revoke', 'role_change',
    'suspicious_activity'
  ]))
);

-- Create indexes for security_audit_logs
CREATE INDEX idx_security_audit_logs_user ON security_audit_logs (user_id);
CREATE INDEX idx_security_audit_logs_event ON security_audit_logs (event_type);
CREATE INDEX idx_security_audit_logs_created ON security_audit_logs (created_at);

-- Enable RLS on security_audit_logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_audit_logs
CREATE POLICY "Admins can read security logs" ON security_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = uid() AND role = 'admin'
    )
  );

-- Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_project ON ai_sessions (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles (subscription_tier);
CREATE INDEX IF NOT EXISTS idx_projects_framework ON projects (framework);

-- Add constraints for data integrity
DO $$ 
BEGIN
  ALTER TABLE profiles 
    ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE projects
    ADD CONSTRAINT valid_status CHECK (status = ANY(ARRAY['active', 'archived', 'deleted']));
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
END $$;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < now() OR (is_valid = false AND updated_at < now() - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_details JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO security_audit_logs (
    user_id, event_type, ip_address, user_agent, details
  ) VALUES (
    p_user_id, p_event_type, p_ip_address, p_user_agent, p_details
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at column
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();