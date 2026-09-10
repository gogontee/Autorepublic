create or replace function public.complete_wallet_funding(
  p_transaction_id uuid,
  p_description text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  funding_transaction public.transactions%rowtype;
  wallet_record public.wallets%rowtype;
begin
  select *
  into funding_transaction
  from public.transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Payment transaction not found';
  end if;

  if funding_transaction.status = 'completed' then
    return false;
  end if;

  if funding_transaction.status <> 'pending'
     or funding_transaction.type <> 'credit' then
    raise exception 'Transaction is not eligible for wallet funding';
  end if;

  select *
  into wallet_record
  from public.wallets
  where user_id = funding_transaction.user_id
  for update;

  update public.transactions
  set status = 'completed',
      description = p_description
  where id = funding_transaction.id;

  if found then
    if wallet_record.id is null then
      insert into public.wallets (
        user_id,
        balance,
        total_earnings,
        total_withdrawn
      ) values (
        funding_transaction.user_id,
        funding_transaction.amount,
        funding_transaction.amount,
        0
      );
    else
      update public.wallets
      set balance = coalesce(wallet_record.balance, 0) + funding_transaction.amount,
          total_earnings = coalesce(wallet_record.total_earnings, 0) + funding_transaction.amount,
          updated_at = now()
      where id = wallet_record.id;
    end if;
  end if;

  return true;
end;
$$;

revoke all on function public.complete_wallet_funding(uuid, text) from public;
grant execute on function public.complete_wallet_funding(uuid, text) to service_role;