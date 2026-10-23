-- Run once in Supabase Dashboard > SQL Editor before deploying the reschedule UI.
-- Moves a booking atomically: the old slot is released only when the new slot is available.
create or replace function public.reschedule_time_slot(
  p_old_slot_id text,
  p_new_slot_id text,
  p_client_phone text
)
returns public.time_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_slot public.time_slots;
  v_new_slot public.time_slots;
  v_jakarta_now timestamp := now() at time zone 'Asia/Jakarta';
begin
  select * into v_old_slot
  from public.time_slots
  where id = p_old_slot_id
  for update;

  if not found or not v_old_slot.is_booked or trim(v_old_slot.client_phone) <> trim(p_client_phone) then
    raise exception 'Booking lama tidak ditemukan atau tidak cocok.';
  end if;

  select * into v_new_slot
  from public.time_slots
  where id = p_new_slot_id
  for update;

  if not found or v_new_slot.is_booked then
    raise exception 'Slot baru sudah tidak tersedia.';
  end if;

  if v_new_slot.date < v_jakarta_now::date
    or (v_new_slot.date = v_jakarta_now::date and v_new_slot.time_start <= v_jakarta_now::time) then
    raise exception 'Slot baru sudah lewat.';
  end if;

  update public.time_slots
  set is_booked = false,
      client_name = '',
      client_phone = '',
      client_notes = ''
  where id = v_old_slot.id;

  update public.time_slots
  set is_booked = true,
      client_name = v_old_slot.client_name,
      client_phone = v_old_slot.client_phone,
      client_notes = v_old_slot.client_notes
  where id = v_new_slot.id
  returning * into v_new_slot;

  return v_new_slot;
end;
$$;

grant execute on function public.reschedule_time_slot(text, text, text) to anon, authenticated;
