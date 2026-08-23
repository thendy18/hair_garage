import type { TimeSlot } from "@/types/booking";

export type TimeSlotRow = {
  id: string;
  date: string;
  time_start: string;
  time_end: string;
  is_booked: boolean;
  client_name: string;
  client_phone: string;
  client_notes: string;
  created_at: string;
};

export const toTimeSlot = (row: TimeSlotRow): TimeSlot => ({
  id: row.id,
  date: row.date,
  timeStart: row.time_start.slice(0, 5),
  timeEnd: row.time_end?.slice(0, 5) ?? row.time_start.slice(0, 5),
  isBooked: row.is_booked,
  clientName: row.client_name,
  clientPhone: row.client_phone,
  clientNotes: row.client_notes,
  createdAt: row.created_at,
});

export const toTimeSlotRow = (slot: TimeSlot) => ({
  id: slot.id,
  date: slot.date,
  time_start: slot.timeStart.length === 5 ? `${slot.timeStart}:00` : slot.timeStart,
  time_end: slot.timeEnd.length === 5 ? `${slot.timeEnd}:00` : slot.timeEnd,
  is_booked: slot.isBooked,
  client_name: slot.clientName,
  client_phone: slot.clientPhone,
  client_notes: slot.clientNotes,
  created_at: slot.createdAt,
});
