-- Indexes for the queries the app runs and for foreign keys that had none
-- (verified on production, 2026-11-27: only PKs, idx_accounts_user, idx_transactions_account,
-- idx_transactions_date and unique_source_email_id existed).
-- Plain CREATE INDEX (not CONCURRENTLY): migrations run in a transaction and the tables are
-- small (~1.1k transactions); the lock lasts milliseconds.

-- Transaction list: WHERE user_id ORDER BY date DESC, created_at DESC (getTransactions).
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON public.transactions (user_id, date DESC, created_at DESC);

-- Transfers into an account (account detail view and balance recalculation).
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_to
  ON public.transactions (transfer_to_account_id) WHERE transfer_to_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON public.transaction_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_category ON public.transaction_items (category_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag ON public.transaction_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_user ON public.tags (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_institution ON public.accounts (institution_id);
