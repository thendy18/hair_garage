"use client";

import { useEffect, useState } from "react";
import type { BookingFormData } from "@/types/booking";
import { createClient } from "@/lib/supabase/client";
import { toTimeSlot, type TimeSlotRow } from "@/lib/supabase/timeSlots";

const whatsappNumber = process.env.NEXT_PUBLIC_THENDY_WHATSAPP_NUMBER ?? "";

const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const formatMessageDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);

const getDaysInMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const getFirstDayOffset = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1).getDay();

export default function PunchCardBooking() {
  const [slots, setSlots] = useState<ReturnType<typeof toTimeSlot>[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    selectedSlotId: "",
    clientName: "",
    clientPhone: "",
    clientNotes: "",
  });

  const availableDates = new Set(slots.map((slot) => slot.date));
  const slotsForDate = slots.filter((slot) => slot.date === selectedDate);
  const selectedSlot = slots.find(
    (slot) => slot.id === formData.selectedSlotId,
  );
  const totalDays = getDaysInMonth(visibleMonth);
  const firstDayOffset = getFirstDayOffset(visibleMonth);

  useEffect(() => {
    const loadSlots = async () => {
      const { data, error } = await createClient()
        .from("time_slots")
        .select("*")
        .order("date")
        .order("time_start");

      if (error) {
        window.alert("Jadwal belum bisa dimuat. Coba refresh halaman.");
        setIsLoading(false);
        return;
      }

      const loadedSlots = (data as TimeSlotRow[]).map(toTimeSlot);
      setSlots(loadedSlots);
      const firstOpenSlot = loadedSlots.find((slot) => !slot.isBooked);
      if (firstOpenSlot) {
        setSelectedDate(firstOpenSlot.date);
        setVisibleMonth(new Date(`${firstOpenSlot.date}T00:00:00`));
      }
      setIsLoading(false);
    };

    void loadSlots();
  }, []);

  const updateForm = (field: keyof BookingFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const selectDate = (date: string) => {
    if (!availableDates.has(date)) return;
    setSelectedDate(date);
    updateForm("selectedSlotId", "");
  };

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
    );
    setVisibleMonth(nextMonth);

    const firstOpenDate = slots.find((slot) => {
      const slotDate = new Date(`${slot.date}T00:00:00`);
      return (
        slotDate.getFullYear() === nextMonth.getFullYear() &&
        slotDate.getMonth() === nextMonth.getMonth()
      );
    });

    setSelectedDate(firstOpenDate?.date ?? "");
    updateForm("selectedSlotId", "");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSlot || selectedSlot.isBooked) {
      window.alert("Pilih jam yang masih tersedia dulu, ya.");
      return;
    }

    if (!formData.clientName.trim() || !formData.clientPhone.trim()) {
      window.alert("Nama dan nomor WhatsApp wajib diisi.");
      return;
    }

    if (!whatsappNumber) {
      window.alert("Nomor WhatsApp Thendy belum diatur di environment project.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await createClient().rpc("book_time_slot", {
      p_slot_id: selectedSlot.id,
      p_client_name: formData.clientName,
      p_client_phone: formData.clientPhone,
      p_client_notes: formData.clientNotes,
    });

    if (error || !data) {
      setIsSubmitting(false);
      window.alert("Slot ini baru saja diambil. Silakan pilih jam lain.");
      return;
    }

    const bookedSlot = toTimeSlot(data as TimeSlotRow);
    setSlots((currentSlots) =>
      currentSlots.map((slot) => (slot.id === bookedSlot.id ? bookedSlot : slot)),
    );

    const message = [
      "Halo Thendy! Gue mau lock jadwal di Hair Garage:",
      `• Nama: ${formData.clientName}`,
      `• Tanggal: ${formatMessageDate(selectedSlot.date)}`,
      `• Sesi: ${selectedSlot.timeStart} WIB`,
      "",
      "Tolong share loc garasinya ya, thank you!",
    ].join("\n");

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setIsSubmitting(false);
  };

  return (
    <section
      id="booking"
      className="bg-white px-5 py-16 sm:px-8 sm:py-24"
      data-aos="zoom-in-up"
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
            Time Card Garage
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-5xl">
            Pilih hari dan jam yang paling enak.
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
            <h3 className="text-lg font-semibold capitalize text-neutral-950">
              {formatMonth(visibleMonth)}
            </h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Bulan sebelumnya"
                className="grid h-9 w-9 place-items-center rounded-full text-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                <span aria-hidden="true">&#8249;</span>
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Bulan berikutnya"
                className="grid h-9 w-9 place-items-center rounded-full text-xl text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                <span aria-hidden="true">&#8250;</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-sm text-neutral-400">Memuat jadwal...</p>
          ) : (
          <div className="mt-6 grid grid-cols-7 text-center">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
              (day) => (
                <span
                  key={day}
                  className="pb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400"
                >
                  {day}
                </span>
              ),
            )}

            {Array.from({ length: firstDayOffset }).map((_, index) => (
              <span key={`empty-${index}`} className="h-12 sm:h-14" />
            ))}

            {Array.from({ length: totalDays }, (_, index) => {
              const day = index + 1;
              const dateKey = toDateKey(
                visibleMonth.getFullYear(),
                visibleMonth.getMonth(),
                day,
              );
              const hasSlots = availableDates.has(dateKey);
              const isSelected = selectedDate === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!hasSlots}
                  onClick={() => selectDate(dateKey)}
                  className="group relative flex h-12 items-center justify-center sm:h-14"
                  aria-label={`${day} ${formatMonth(visibleMonth)}`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full text-sm transition sm:h-10 sm:w-10 ${
                      isSelected
                        ? "bg-neutral-900 font-semibold text-white"
                        : hasSlots
                          ? "font-medium text-neutral-900 hover:bg-neutral-100"
                          : "text-neutral-300"
                    }`}
                  >
                    {day}
                  </span>
                  {hasSlots && !isSelected && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
          )}

          <div className="mt-8 border-t border-neutral-100 pt-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-neutral-950">
                {selectedDate
                  ? `Jam tersedia, ${formatMessageDate(selectedDate)}`
                  : "Tidak ada slot di bulan ini"}
              </h3>
              {selectedDate && (
                <span className="shrink-0 text-xs text-neutral-400">
                  {slotsForDate.filter((slot) => !slot.isBooked).length} slot
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {slotsForDate.map((slot) => {
                const isSelected = formData.selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={slot.isBooked}
                    onClick={() => updateForm("selectedSlotId", slot.id)}
                    className={`rounded-full border px-4 py-2.5 text-sm transition ${
                      slot.isBooked
                        ? "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-300 line-through"
                        : isSelected
                          ? "border-neutral-900 bg-neutral-900 font-medium text-white"
                          : "border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100"
                    }`}
                  >
                    {slot.timeStart}–{slot.timeEnd}
                  </button>
                );
              })}
              {!selectedDate && (
                <p className="text-sm text-neutral-400">
                  Coba geser ke bulan yang punya jadwal.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-neutral-100 pt-6">
            <label className="text-sm text-neutral-500">
              Nama
              <input
                required
                value={formData.clientName}
                onChange={(event) => updateForm("clientName", event.target.value)}
                placeholder="Nama lo"
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"
              />
            </label>
            <label className="text-sm text-neutral-500">
              WhatsApp
              <input
                required
                type="tel"
                value={formData.clientPhone}
                onChange={(event) => updateForm("clientPhone", event.target.value)}
                placeholder="08xx-xxxx-xxxx"
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="mt-2 w-full rounded-full bg-neutral-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-4 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "MENGUNCI JADWAL..." : "Konfirmasi Jadwal via WhatsApp"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
