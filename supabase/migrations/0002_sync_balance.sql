-- Migration 0002: Sync Balances and Refine Schema

-- 1. Refine Profiles Table
alter table public.profiles rename column xp_k to level_scale;
alter table public.profiles add column if not exists total_xp bigint default 0;

-- 2. Trigger Function to sync XP and COINS from Event Log
create or replace function public.sync_user_balance_from_event() 
returns trigger as $$
begin
    -- Update Profile XP
    update public.profiles 
    set total_xp = total_xp + new.final_xp
    where id = new.user_id;

    -- Update Wallet Coins
    update public.wallet
    set coins_balance = coins_balance + new.final_coin
    where user_id = new.user_id;

    return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to event_log
drop trigger if exists on_event_log_insert on public.event_log;
create trigger on_event_log_insert
    after insert on public.event_log
    for each row execute procedure public.sync_user_balance_from_event();


-- 3. Trigger Function for Quest Rewards
create or replace function public.process_quest_completion()
returns trigger as $$
begin
    -- Only trigger if status changed to 'done'
    if (new.status = 'done' and old.status = 'active') then
        -- Add Quest Rewards to Profile and Wallet
        update public.profiles 
        set total_xp = total_xp + new.reward_xp
        where id = new.user_id;

        update public.wallet
        set coins_balance = coins_balance + new.reward_coin
        where user_id = new.user_id;
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Attach trigger to quests
drop trigger if exists on_quest_done on public.quests;
create trigger on_quest_done
    after update on public.quests
    for each row execute procedure public.process_quest_completion();


-- 5. Achievement Rewards
create or replace function public.process_achievement_unlock()
returns trigger as $$
declare
    ach_xp integer;
    ach_coin integer;
begin
    -- Get rewards from static table (or hardcoded if simple)
    -- Assuming achievements table matches Definition in JS
    select reward_xp, reward_coin into ach_xp, ach_coin 
    from public.achievements 
    where key = new.achievement_key;

    if (ach_xp is not null) then
        update public.profiles set total_xp = total_xp + ach_xp where id = new.user_id;
        update public.wallet set coins_balance = coins_balance + ach_coin where user_id = new.user_id;
    end if;

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_achievement_unlock on public.user_achievements;
create trigger on_achievement_unlock
    after insert on public.user_achievements
    for each row execute procedure public.process_achievement_unlock();


-- 6. Initial Sync (Optional: use only if you have existing data)
update public.profiles p
set total_xp = (select coalesce(sum(final_xp), 0) from public.event_log el where el.user_id = p.id);

update public.wallet w
set coins_balance = (select coalesce(sum(final_coin), 0) from public.event_log el where el.user_id = w.user_id);
