-- Transactions are created by the existing authenticated workflows and
-- completed by trusted server-side payment code. Clients must not edit them.
drop policy if exists "Users can update their own transactions"
on public.transactions;