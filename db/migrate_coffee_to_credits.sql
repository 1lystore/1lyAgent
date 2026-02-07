-- Migrate Coffee System to Claude Credit System
-- Run this AFTER the existing supabase.sql schema

-- 1. Rename coffee_orders to credit_purchases
ALTER TABLE IF EXISTS coffee_orders RENAME TO credit_purchases;

-- 2. Update credit_purchases columns to match credit concept
ALTER TABLE credit_purchases RENAME COLUMN order_text TO sponsor_message;
ALTER TABLE credit_purchases RENAME COLUMN estimated_cost_usdc TO amount_usdc;
ALTER TABLE credit_purchases RENAME COLUMN final_price_usdc TO paid_usdc;
ALTER TABLE credit_purchases RENAME COLUMN bitrefill_order_id TO openrouter_order_id;
ALTER TABLE credit_purchases RENAME COLUMN swiggy_order_id TO openrouter_tx_id;
ALTER TABLE credit_purchases RENAME COLUMN gift_last4 TO credit_last4;
ALTER TABLE credit_purchases RENAME COLUMN execution_day TO purchase_day;

-- 3. Update status enum to match credit flow
ALTER TABLE credit_purchases DROP CONSTRAINT IF EXISTS coffee_orders_status_check;
ALTER TABLE credit_purchases ADD CONSTRAINT credit_purchases_status_check
  CHECK (status IN ('PENDING','QUEUED','AUTO_BUYING','PURCHASED','FAILED'));

-- 4. Rename coffee_state to credit_state
ALTER TABLE IF EXISTS coffee_state RENAME TO credit_state;

-- 5. Update credit_state columns
ALTER TABLE credit_state RENAME COLUMN coffee_balance_usdc TO credit_balance_usdc;
ALTER TABLE credit_state RENAME COLUMN daily_exec_count TO daily_purchase_count;
ALTER TABLE credit_state RENAME COLUMN next_batch_ts TO next_purchase_window;

-- 6. Add token tracking columns
ALTER TABLE credit_state ADD COLUMN IF NOT EXISTS tokens_used_total BIGINT DEFAULT 0;
ALTER TABLE credit_state ADD COLUMN IF NOT EXISTS tokens_since_last_purchase BIGINT DEFAULT 0;
ALTER TABLE credit_state ADD COLUMN IF NOT EXISTS last_auto_purchase_at TIMESTAMPTZ;

-- 7. Update indexes
DROP INDEX IF EXISTS idx_coffee_orders_status;
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);

-- 8. Add token usage log table
CREATE TABLE IF NOT EXISTS token_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  tokens_used INTEGER NOT NULL,
  model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage_log(created_at DESC);

-- 9. Update payments table purpose enum
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_purpose_check;
ALTER TABLE payments ADD CONSTRAINT payments_purpose_check
  CHECK (purpose IN ('PAID_REQUEST','CREDIT_SPONSOR','CREDIT_AUTO_PURCHASE','COFFEE_TIP','COFFEE_ORDER'));

-- 10. Update requests table classification enum
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_classification_check;
ALTER TABLE requests ADD CONSTRAINT requests_classification_check
  CHECK (classification IN ('FREE','PAID_MEDIUM','PAID_HEAVY','COFFEE_ORDER','CREDIT_SPONSOR'));

COMMENT ON TABLE credit_purchases IS 'Claude credit purchases - both sponsored by users and auto-purchased by agent';
COMMENT ON TABLE credit_state IS 'Agent credit balance and token usage tracking';
COMMENT ON TABLE token_usage_log IS 'Log of all token usage for cost tracking';
