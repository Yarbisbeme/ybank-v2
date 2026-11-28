-- Phase 2.3b: monthly metrics are computed in Postgres.
--
-- Bug: every metric (account summary, monthly spend, category breakdown, weekly activity) was
-- computed in the browser from the transactions table's first page: 10 rows, with the table's
-- active filters. With more than 10 movements in the month, or a filter applied, the numbers
-- were incomplete.
--
-- Both functions are SECURITY INVOKER: RLS limits them to the caller's own data. Balance
-- adjustments (is_balance_adjustment) are excluded from every figure.

-- "Today" for the app is the date in the Dominican Republic.
CREATE FUNCTION public.today_rd() RETURNS date
LANGUAGE sql STABLE
SET search_path = ''
AS $$ SELECT (now() AT TIME ZONE 'America/Santo_Domingo')::date $$;

-- ---------------------------------------------------------------- per account
-- One row for an account the caller can see; no row otherwise.
--   month_spend / month_count  expenses booked on the account (what "Gastado" shows)
--   month_income               income booked on the account
--   month_inflow               income + money received from own transfers and card payments
--   month_outflow              expenses + transfers and payments sent (tax included)
--   prev_month_spend           month_spend of the previous month
--   uncategorized_count        income/expenses (any date) still missing a category; transfers,
--                              payments and adjustments never need one
CREATE FUNCTION public.account_month_metrics(p_account_id uuid, p_month date DEFAULT NULL)
RETURNS TABLE (
  month_start           date,
  month_spend           numeric,
  month_count           integer,
  month_income          numeric,
  month_inflow          numeric,
  month_outflow         numeric,
  prev_month_spend      numeric,
  uncategorized_count   integer,
  first_uncategorized_id uuid,
  last_description      text,
  last_date             date
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  WITH bounds AS (
    SELECT date_trunc('month', coalesce(p_month, public.today_rd()))::date AS m0
  ),
  b AS (
    SELECT m0, (m0 + interval '1 month')::date AS m1, (m0 - interval '1 month')::date AS p0 FROM bounds
  ),
  acc AS (
    SELECT a.id FROM public.accounts a WHERE a.id = p_account_id
  ),
  tx AS (
    SELECT t.*,
           t.account_id = p_account_id AS is_owner,
           t.transfer_to_account_id = p_account_id AND t.type IN ('transfer', 'payment') AS is_incoming
    FROM public.transactions t
    WHERE (t.account_id = p_account_id OR t.transfer_to_account_id = p_account_id)
      AND NOT t.is_balance_adjustment
  ),
  uncategorized AS (
    SELECT t.id, t.date, t.created_at
    FROM tx t
    WHERE t.is_owner
      AND t.type IN ('income', 'expense')
      AND CASE
            WHEN EXISTS (SELECT 1 FROM public.transaction_items i WHERE i.transaction_id = t.id)
              THEN EXISTS (SELECT 1 FROM public.transaction_items i WHERE i.transaction_id = t.id AND i.category_id IS NULL)
            ELSE t.category_id IS NULL
          END
  ),
  latest AS (
    -- Adjustments do count as "last movement": they explain the latest balance change.
    SELECT t.description, t.date
    FROM public.transactions t
    WHERE t.account_id = p_account_id
       OR (t.transfer_to_account_id = p_account_id AND t.type IN ('transfer', 'payment'))
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT 1
  )
  SELECT
    b.m0,
    coalesce(sum(t.amount) FILTER (WHERE t.is_owner AND t.type = 'expense' AND t.date >= b.m0 AND t.date < b.m1), 0),
    (count(*) FILTER (WHERE t.is_owner AND t.type = 'expense' AND t.date >= b.m0 AND t.date < b.m1))::integer,
    coalesce(sum(t.amount) FILTER (WHERE t.is_owner AND t.type = 'income' AND t.date >= b.m0 AND t.date < b.m1), 0),
    coalesce(sum(t.amount) FILTER (WHERE t.is_owner AND t.type = 'income' AND t.date >= b.m0 AND t.date < b.m1), 0)
      + coalesce(sum(coalesce(t.target_amount, t.amount)) FILTER (WHERE t.is_incoming AND t.date >= b.m0 AND t.date < b.m1), 0),
    coalesce(sum(t.amount) FILTER (WHERE t.is_owner AND t.type IN ('expense', 'transfer', 'payment') AND t.date >= b.m0 AND t.date < b.m1), 0),
    coalesce(sum(t.amount) FILTER (WHERE t.is_owner AND t.type = 'expense' AND t.date >= b.p0 AND t.date < b.m0), 0),
    (SELECT count(*) FROM uncategorized)::integer,
    (SELECT u.id FROM uncategorized u ORDER BY u.date DESC, u.created_at DESC LIMIT 1),
    (SELECT l.description FROM latest l),
    (SELECT l.date FROM latest l)
  FROM b
  CROSS JOIN acc
  LEFT JOIN tx t ON true
  GROUP BY b.m0
$$;

-- ---------------------------------------------------------------- dashboard
-- Spending of the caller's accounts per day, account currency and category, from p_from to
-- p_to (inclusive). One call from the first day of the previous month to today serves the
-- monthly total vs. last month, the category breakdown and the weekly activity.
--   source = 'expense'            an expense
--   source = 'external_transfer'  a transfer to a third party (money that left your accounts)
-- Amounts are positive, in the account's currency (conversion is a display choice).
CREATE FUNCTION public.spending_by_day(p_from date, p_to date)
RETURNS TABLE (
  day           date,
  currency      text,
  category_id   uuid,
  category_name text,
  source        text,
  total         numeric
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT
    t.date,
    a.currency::text,
    t.category_id,
    c.name,
    CASE WHEN t.type = 'expense' THEN 'expense' ELSE 'external_transfer' END,
    sum(t.amount)
  FROM public.transactions t
  JOIN public.accounts a ON a.id = t.account_id
  LEFT JOIN public.categories c ON c.id = t.category_id
  WHERE t.date BETWEEN p_from AND p_to
    AND NOT t.is_balance_adjustment
    AND (t.type = 'expense' OR (t.type = 'transfer' AND t.transfer_to_account_id IS NULL))
  GROUP BY 1, 2, 3, 4, 5
$$;

REVOKE ALL ON FUNCTION public.account_month_metrics(uuid, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.spending_by_day(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.account_month_metrics(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spending_by_day(date, date) TO authenticated;

-- Supports the per-account lookups (incoming transfers already use idx_transactions_transfer_to).
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON public.transactions (account_id, date DESC);
