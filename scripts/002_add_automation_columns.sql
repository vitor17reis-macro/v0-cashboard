-- Add missing columns for automation tracking
-- Run this script to add rule_id and to_account_id columns to transactions table

-- Add rule_id column to track which automation rule created the transaction
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS rule_id uuid;

-- Add to_account_id column to track transfer destination
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS to_account_id uuid;

-- Add foreign key constraint for to_account_id (optional, for referential integrity)
ALTER TABLE transactions 
ADD CONSTRAINT fk_to_account 
FOREIGN KEY (to_account_id) 
REFERENCES accounts(id) 
ON DELETE SET NULL;

-- Create an index on rule_id for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_rule_id ON transactions(rule_id);

-- Create an index on to_account_id for faster queries  
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id ON transactions(to_account_id);
