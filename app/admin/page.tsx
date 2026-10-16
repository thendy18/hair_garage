"use client";

import { useEffect, useMemo, useState } from "react";
import type { TimeSlot } from "@/types/booking";
import { createClient } from "@/lib/supabase/client";
import { toTimeSlot, type TimeSlotRow } from "@/lib/supabase/timeSlots";

const calendarStartHour = 8;
const calendarEndHour = 21;

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateInput = (date: string) => new Date(`${date}T00:00:00`);

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);

const formatDayName = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date);

const formatLongDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fromDateInput(date));

const parseTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const shortPhone = (phone: string) =>
  phone.length > 11 ? `${phone.slice(0, 8)}xxxx` : phone;

export default function AdminPage() {
  const today = new Date();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateInput(today));
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("14:00");
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const weekEnd = weekDays[6];

  useEffect(() => {
    const loadSlots = async () => {
      const { data, error } = await createClient()
        .from("time_slots")
        .select("*")
        .order("date")
        .order("time_start");

      if (error) {
        window.alert("Jadwal belum bisa dimuat.");
      } else {
        setSlots((data as TimeSlotRow[]).map(toTimeSlot));
      }
      setIsLoading(false);
    };

    void loadSlots();
  }, []);

  const selectDate = (date: Date) => {
    const dateValue = toDateInput(date);
    setSelectedDate(dateValue);
    setWeekStart(startOfWeek(date));
  };

  const goToday = () => selectDate(new Date());

  const selectMonth = (value: string) => {
    if (!value) return;
    const monthDate = new Date(`${value}-01T00:00:00`);
    setWeekStart(startOfWeek(monthDate));
    setSelectedDate(toDateInput(monthDate));
    setSelectedSlot(null);
  };

  const addSlot = async () => {
    if (!selectedDate || parseTime(endTime) <= parseTime(startTime)) {
      window.alert("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    const alreadyExists = slots.some(
      (slot) =>
        slot.date === selectedDate &&
        parseTime(startTime) < parseTime(slot.timeEnd) &&
        parseTime(endTime) > parseTime(slot.timeStart),
    );
    if (alreadyExists) {
      window.alert("Rentang waktu ini bertabrakan dengan slot yang sudah ada.");
      return;
    }

    const { data, error } = await createClient()
      .from("time_slots")
      .insert({
        id: `slot-${Date.now()}`,
        date: selectedDate,
        time_start: `${startTime}:00`,
        time_end: `${endTime}:00`,
        is_booked: false,
        client_name: "",
        client_phone: "",
        client_notes: "",
      })
      .select()
      .single();

    if (error || !data) {
      window.alert("Slot gagal ditambahkan.");
      return;
    }

    setSlots((currentSlots) => [...currentSlots, toTimeSlot(data as TimeSlotRow)]);
  };

  const removeSlot = async (slotId: string) => {
    const { error } = await createClient().from("time_slots").delete().eq("id", slotId);
    if (error) {
      window.alert("Slot gagal dihapus.");
      return;
    }
    setSlots((currentSlots) => currentSlots.filter((slot) => slot.id !== slotId));
    setSelectedSlot(null);
  };

  const cancelBooking = async (slotId: string) => {
    const { data, error } = await createClient()
      .from("time_slots")
      .update({ is_booked: false, client_name: "", client_phone: "", client_notes: "" })
      .eq("id", slotId)
      .select()
      .single();

    if (error || !data) {
      window.alert("Booking gagal dibatalkan.");
      return;
    }

    const updatedSlot = toTimeSlot(data as TimeSlotRow);
    setSlots((currentSlots) =>
      currentSlots.map((slot) => (slot.id === slotId ? updatedSlot : slot)),
    );
    setSelectedSlot(updatedSlot);
  };

  const chatClient = (slot: TimeSlot) => {
    const phone = slot.clientPhone.replace(/\D/g, "");
    if (!phone) return;
    const message = `Halo ${slot.clientName}, ini Thendy dari Thendy Hair Garage. Konfirmasi sesi kamu tanggal ${formatLongDate(slot.date)} jam ${slot.timeStart} WIB, ya.`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleLogout = async () => {
    await createClient().auth.signOut();
    window.location.assign("/admin/login");
  };

  const slotsForDate = (date: Date) =>
    slots.filter((slot) => slot.date === toDateInput(date));

  const miniCalendarDays = useMemo(() => {
    const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
    const daysInMonth = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth() + 1,
      0,
    ).getDate();
    return {
      offset: monthStart.getDay(),
      days: daysInMonth,
    };
  }, [weekStart]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-black">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r-4 border-black bg-white px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center border-2 border-black bg-zinc-900 text-sm font-bold text-white">
              TH
            </div>
            <div>
            <p className="text-sm font-black uppercase">Thendy Garage</p>
              <p className="text-xs font-bold uppercase text-neutral-500">Admin workspace</p>
            </div>
          </div>

          <button
            type="button"
            onClick={goToday}
            className="mt-8 w-full border-2 border-black px-4 py-2 text-sm font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Today
          </button>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-black uppercase">{formatMonth(weekStart)}</p>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-y-3 text-center text-[10px]">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <span key={`${day}-${index}`} className="font-semibold text-neutral-400">{day}</span>
              ))}
              {Array.from({ length: miniCalendarDays.offset }).map((_, index) => <span key={`blank-${index}`} />)}
              {Array.from({ length: miniCalendarDays.days }, (_, index) => {
                const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), index + 1);
                const dateValue = toDateInput(date);
                const hasSlots = slotsForDate(date).length > 0;
                const isSelected = selectedDate === dateValue;
                return (
                    <button key={dateValue} type="button" onClick={() => selectDate(date)} className={`relative mx-auto grid h-6 w-6 place-items-center border-2 border-transparent font-bold ${isSelected ? "border-black bg-zinc-900 text-white" : "hover:border-black hover:bg-neutral-100"}`}>
                    {index + 1}
                    {hasSlots && !isSelected && <span className="absolute bottom-0 h-1 w-1 rounded-full bg-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="button" onClick={() => void handleLogout()} className="mt-10 text-xs font-bold uppercase underline underline-offset-4">Keluar</button>
        </aside>

        <section className="min-w-0 flex-1 bg-white">
          <header className="border-b-4 border-black px-4 py-4 sm:px-8 sm:py-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Thendy Hair Garage</p>
                <h1 className="mt-1 text-xl font-black uppercase tracking-[-0.03em] sm:text-2xl">Schedule</h1>
              </div>
              <button type="button" onClick={() => void handleLogout()} className="border-2 border-black px-3 py-2 text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none lg:hidden">Keluar</button>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <label className="grid flex-1 gap-1 text-[10px] font-bold uppercase tracking-[0.08em] sm:flex-none sm:text-xs">
                Pilih bulan
                <input type="month" value={`${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}`} onChange={(event) => selectMonth(event.target.value)} className="w-full border-2 border-black bg-white px-2 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none sm:w-auto" />
              </label>
              <button type="button" onClick={goToday} className="border-2 border-black px-3 py-2 text-xs font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">Today</button>
            </div>
          </header>

          <div className="border-b-4 border-black bg-neutral-100 px-4 py-4 sm:px-8">
            <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
              <label className="col-span-2 grid gap-1 text-xs font-bold uppercase">
                Tanggal
                <input type="date" value={selectedDate} onChange={(event) => selectDate(fromDateInput(event.target.value))} className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs text-black outline-none focus:bg-neutral-200 sm:w-auto" />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase">
                Mulai
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs text-black outline-none focus:bg-neutral-200 sm:w-auto" />
              </label>
              <label className="grid gap-1 text-xs font-bold uppercase">
                Selesai
                <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-full rounded-none border-2 border-black bg-white px-3 py-2 text-xs text-black outline-none focus:bg-neutral-200 sm:w-auto" />
              </label>
              <button type="button" onClick={() => void addSlot()} className="col-span-2 border-2 border-black bg-zinc-900 px-4 py-2.5 text-xs font-bold uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none sm:col-span-1">
                + Buat slot
              </button>
            </div>
            <p className="mt-2 text-xs font-medium text-neutral-600">
              Atur rentang waktu bebas, misalnya 13:00 sampai 14:30. Hapus slot dari panel detail dengan tombol ×.
            </p>
          </div>

          <div className="grid gap-4 bg-[#f3f4f6] px-4 py-5 lg:hidden">
            {weekDays.map((day) => {
              const daySlots = slotsForDate(day);
              return (
                <div key={toDateInput(day)} className={`border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${selectedDate === toDateInput(day) ? "border-4" : ""}`}>
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <button type="button" onClick={() => selectDate(day)} className="min-w-0 text-left text-sm font-black uppercase leading-5">{formatLongDate(toDateInput(day))}</button>
                    <span className="shrink-0 text-[10px] font-bold uppercase">{daySlots.length} slot</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {daySlots.length ? daySlots.map((slot) => (
                      <button key={slot.id} type="button" onClick={() => { setSelectedSlot(slot); setSelectedDate(slot.date); }} className={`flex min-h-12 items-center justify-between gap-3 border-2 border-black px-3 py-3 text-left text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${selectedSlot?.id === slot.id ? "bg-zinc-900 text-white" : slot.isBooked ? "bg-neutral-200" : "bg-white"}`}>
                        <span>{slot.timeStart}–{slot.timeEnd} WIB</span><span className="truncate text-right text-[10px] uppercase">{slot.isBooked ? slot.clientName : "READY"}</span>
                      </button>
                    )) : <p className="text-xs font-medium text-neutral-500">Belum ada slot di hari ini.</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[64px_repeat(7,minmax(100px,1fr))] border-b border-neutral-200">
                <div />
                {weekDays.map((day) => {
                  const isToday = toDateInput(day) === toDateInput(today);
                  return (
                    <button key={toDateInput(day)} type="button" onClick={() => selectDate(day)} className={`border-2 px-2 py-4 text-center font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${selectedDate === toDateInput(day) ? "border-black bg-zinc-900 text-white" : "border-black bg-white hover:bg-neutral-100"}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{formatDayName(day)}</p>
                      <p className={`mx-auto mt-1 grid h-9 w-9 place-items-center border-2 text-lg ${isToday ? "border-current" : "border-transparent"}`}>{day.getDate()}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-[64px_repeat(7,minmax(100px,1fr))]">
                <div className="relative h-[780px]">
                  {Array.from({ length: calendarEndHour - calendarStartHour }, (_, index) => (
                    <span key={index} className="absolute right-3 text-[10px] text-neutral-400" style={{ top: `${index * 60 - 7}px` }}>{`${calendarStartHour + index}`.padStart(2, "0")}:00</span>
                  ))}
                </div>
                {weekDays.map((day) => {
                  const daySlots = slotsForDate(day);
                  return (
                    <div key={toDateInput(day)} className="relative h-[780px] border-l border-neutral-100 bg-[linear-gradient(to_bottom,#f1f3f5_1px,transparent_1px)] bg-[length:100%_60px]">
                      {daySlots.map((slot) => {
                        const top = ((parseTime(slot.timeStart) - calendarStartHour * 60) / 60) * 60;
                        const isActive = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => { setSelectedSlot(slot); setSelectedDate(slot.date); }}
                            className={`absolute left-1 right-1 overflow-hidden border-2 border-black px-2 py-1.5 text-left text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${slot.isBooked ? "bg-neutral-300 text-black" : "bg-white text-black"} ${isActive ? "ring-2 ring-black ring-offset-1" : ""}`}
                            style={{
                              top: `${Math.max(top, 2)}px`,
                              minHeight: `${Math.max((parseTime(slot.timeEnd) - parseTime(slot.timeStart)) * 1, 46)}px`,
                            }}
                          >
                            <span className="block font-semibold">{slot.timeStart}–{slot.timeEnd} WIB</span>
                            <span className="block truncate">{slot.isBooked ? slot.clientName : "READY"}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t-4 border-black px-4 py-5 sm:px-8">
            {isLoading ? (
              <p className="text-sm font-bold uppercase">Memuat jadwal...</p>
            ) : selectedSlot ? (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 border-2 border-black ${selectedSlot.isBooked ? "bg-neutral-500" : "bg-white"}`} />
                    <p className="text-sm font-bold">{selectedSlot.timeStart}–{selectedSlot.timeEnd} WIB / {formatLongDate(selectedSlot.date)}</p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-neutral-600">{selectedSlot.isBooked ? `${selectedSlot.clientName} (${shortPhone(selectedSlot.clientPhone)})` : "Slot masih tersedia"}</p>
                  {selectedSlot.isBooked && selectedSlot.clientNotes && <p className="mt-1 text-xs text-neutral-500">{selectedSlot.clientNotes}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedSlot.isBooked ? (
                    <>
                      <button type="button" onClick={() => chatClient(selectedSlot)} className="border-2 border-black bg-zinc-900 px-4 py-2 font-bold uppercase text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">Chat WhatsApp</button>
                      <button type="button" onClick={() => void cancelBooking(selectedSlot.id)} className="border-2 border-black px-4 py-2 font-bold uppercase hover:bg-neutral-100">Batalkan</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => void removeSlot(selectedSlot.id)} className="border-2 border-black px-4 py-2 font-bold uppercase hover:bg-red-100">× Hapus slot</button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-neutral-500">Pilih event atau tambahkan slot untuk melihat detail.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
