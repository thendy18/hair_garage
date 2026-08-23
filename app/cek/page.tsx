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

export default function CekPage() {
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
  const monthLabel = formatMonth(weekStart);

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

  const navigateWeek = (offset: number) => {
    setWeekStart(addDays(weekStart, offset * 7));
    setSelectedSlot(null);
  };

  const selectDate = (date: Date) => {
    const dateValue = toDateInput(date);
    setSelectedDate(dateValue);
    setWeekStart(startOfWeek(date));
  };

  const goToday = () => selectDate(new Date());

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
    window.location.assign("/cek/login");
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
    <main className="min-h-screen bg-[#f8fafd] text-neutral-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-900 text-sm font-bold text-white">
              TH
            </div>
            <div>
              <p className="text-sm font-semibold">Thendy Garage</p>
              <p className="text-xs text-neutral-400">Workspace</p>
            </div>
          </div>

          <button
            type="button"
            onClick={goToday}
            className="mt-8 w-full rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-50"
          >
            Today
          </button>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize">{formatMonth(weekStart)}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => navigateWeek(-1)} aria-label="Bulan sebelumnya" className="grid h-7 w-7 place-items-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100">&#8249;</button>
                <button type="button" onClick={() => navigateWeek(1)} aria-label="Bulan berikutnya" className="grid h-7 w-7 place-items-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100">&#8250;</button>
              </div>
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
                  <button key={dateValue} type="button" onClick={() => selectDate(date)} className={`relative mx-auto grid h-6 w-6 place-items-center rounded-full ${isSelected ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}>
                    {index + 1}
                    {hasSlots && !isSelected && <span className="absolute bottom-0 h-1 w-1 rounded-full bg-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button type="button" onClick={() => void handleLogout()} className="mt-10 text-xs text-neutral-400 underline underline-offset-4">Keluar</button>
        </aside>

        <section className="min-w-0 flex-1 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-5 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={goToday} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 lg:hidden">Today</button>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => navigateWeek(-1)} aria-label="Minggu sebelumnya" className="grid h-9 w-9 place-items-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100">&#8249;</button>
                <button type="button" onClick={() => navigateWeek(1)} aria-label="Minggu berikutnya" className="grid h-9 w-9 place-items-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100">&#8250;</button>
              </div>
              <h1 className="text-xl font-semibold capitalize tracking-[-0.03em] sm:text-2xl">{monthLabel}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-neutral-400 sm:inline">{formatLongDate(toDateInput(today))}</span>
              <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium">Week</span>
            </div>
          </header>

          <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-8">
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Tanggal
                <input type="date" value={selectedDate} onChange={(event) => selectDate(fromDateInput(event.target.value))} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 outline-none focus:border-neutral-900" />
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Mulai
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 outline-none focus:border-neutral-900" />
              </label>
              <label className="grid gap-1 text-xs font-medium text-neutral-500">
                Selesai
                <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 outline-none focus:border-neutral-900" />
              </label>
              <button type="button" onClick={() => void addSlot()} className="rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-700">
                + Buat slot
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Atur rentang waktu bebas, misalnya 13:00 sampai 14:30. Hapus slot dari panel detail dengan tombol ×.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[64px_repeat(7,minmax(100px,1fr))] border-b border-neutral-200">
                <div />
                {weekDays.map((day) => {
                  const isToday = toDateInput(day) === toDateInput(today);
                  return (
                    <button key={toDateInput(day)} type="button" onClick={() => selectDate(day)} className="border-l border-neutral-100 px-2 py-4 text-center hover:bg-neutral-50">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">{formatDayName(day)}</p>
                      <p className={`mx-auto mt-1 grid h-9 w-9 place-items-center rounded-full text-lg ${isToday ? "bg-blue-600 font-semibold text-white" : "text-neutral-900"}`}>{day.getDate()}</p>
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
                            className={`absolute left-1 right-1 overflow-hidden rounded-lg border-l-4 px-2 py-1.5 text-left text-xs shadow-sm transition hover:shadow-md ${slot.isBooked ? "border-blue-500 bg-blue-50 text-blue-950" : "border-emerald-500 bg-emerald-50 text-emerald-950"} ${isActive ? "ring-2 ring-neutral-900 ring-offset-1" : ""}`}
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

          <div className="border-t border-neutral-200 px-5 py-5 sm:px-8">
            {isLoading ? (
              <p className="text-sm text-neutral-400">Memuat jadwal...</p>
            ) : selectedSlot ? (
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${selectedSlot.isBooked ? "bg-blue-500" : "bg-emerald-500"}`} />
                    <p className="text-sm font-semibold">{selectedSlot.timeStart}–{selectedSlot.timeEnd} WIB / {formatLongDate(selectedSlot.date)}</p>
                  </div>
                  <p className="mt-2 text-sm text-neutral-500">{selectedSlot.isBooked ? `${selectedSlot.clientName} (${shortPhone(selectedSlot.clientPhone)})` : "Slot masih tersedia"}</p>
                  {selectedSlot.isBooked && selectedSlot.clientNotes && <p className="mt-1 text-xs text-neutral-400">{selectedSlot.clientNotes}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {selectedSlot.isBooked ? (
                    <>
                      <button type="button" onClick={() => chatClient(selectedSlot)} className="rounded-full bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700">Chat WhatsApp</button>
                      <button type="button" onClick={() => void cancelBooking(selectedSlot.id)} className="rounded-full border border-neutral-300 px-4 py-2 font-medium hover:border-neutral-900">Batalkan</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => void removeSlot(selectedSlot.id)} className="rounded-full border border-red-200 px-4 py-2 font-medium text-red-600 hover:border-red-500">× Hapus slot</button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400">Pilih event atau tambahkan slot untuk melihat detail.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
