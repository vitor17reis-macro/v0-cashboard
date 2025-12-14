-- Add goal_id column to transactions table for tracking goal deposits
-- This allows proper reversal of goal transfers

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions(goal_id);
