-- Create QR attendance sessions table
CREATE TABLE IF NOT EXISTS qr_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, session_token)
);

-- Create QR tokens table for rotating tokens
CREATE TABLE IF NOT EXISTS qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES qr_attendance_sessions(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_sessions_class_id ON qr_attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON qr_attendance_sessions(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_session_id ON qr_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_expires ON qr_tokens(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_qr_sessions_updated_at BEFORE UPDATE ON qr_attendance_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
