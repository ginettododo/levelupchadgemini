-- RPC to get fast user stats (Total XP)
create or replace function public.get_user_stats(target_user_id uuid)
returns table (
  total_xp bigint,
  total_actions bigint
) language plpgsql security definer as $$
declare
    xp_sum bigint;
    act_count bigint;
begin
    -- Simple summation of base XP. 
    -- NOTE: This DOES NOT include the complex multipliers (streak, diminishing returns) calculated in JS.
    -- If we want true accuracy, we should store `xp_earned` on event_log at insert time.
    -- Phase 2 Fix: Let's modify event_log to store 'final_xp' so we can sum it easily.
    
    select 
        coalesce(sum(coalesce(el.final_xp, 0)), 0),
        count(el.id)
    into xp_sum, act_count
    from public.event_log el
    where el.user_id = target_user_id;

    return query select xp_sum, act_count;
end;
$$;

-- Add final_xp column to event_log to "freeze" the calculated value
alter table public.event_log add column if not exists final_xp integer default 0;
alter table public.event_log add column if not exists final_coin integer default 0;

