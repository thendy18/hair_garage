"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AOS from "aos";
import type { BookingFormData } from "@/types/booking";
import { createClient } from "@/lib/supabase/client";
import { toTimeSlot, type TimeSlotRow } from "@/lib/supabase/timeSlots";

const whatsappNumber = process.env.NEXT_PUBLIC_THENDY_WHATSAPP_NUMBER ?? "";
const SERVICE_DURATION_MINUTES = 60;
const steps = ["Layanan", "Kategori", "Hairstylist", "Jadwal", "Data", "Konfirmasi"];
const categories = ["Men", "Women"] as const;

const toDateKey = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const formatMessageDate = (date: string) => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
const formatMonth = (date: Date) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
const getMinutes = (time: string) => { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; };
const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOffset = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

const buttonClass = "border-2 border-black bg-white font-bold uppercase tracking-[0.08em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";
const inputClass = "mt-2 w-full rounded-none border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black outline-none placeholder:text-neutral-500 focus:bg-neutral-100";

export default function PunchCardBooking() {
  const [step, setStep] = useState(1);
  const [notice, setNotice] = useState("");
  const [slots, setSlots] = useState<ReturnType<typeof toTimeSlot>[]>([]);
  const [visibleMonth, setVisibleMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({ selectedService: "", selectedCategory: "", selectedHairstylist: "Thendy", selectedSlotId: "", clientName: "", clientPhone: "", clientNotes: "" });

  const availableDates = useMemo(() => new Set(slots.filter((slot) => getMinutes(slot.timeEnd) - getMinutes(slot.timeStart) >= SERVICE_DURATION_MINUTES).map((slot) => slot.date)), [slots]);
  const slotsForDate = slots.filter((slot) => slot.date === selectedDate && getMinutes(slot.timeEnd) - getMinutes(slot.timeStart) >= SERVICE_DURATION_MINUTES);
  const selectedSlot = slots.find((slot) => slot.id === formData.selectedSlotId);
  const totalDays = getDaysInMonth(visibleMonth);
  const firstDayOffset = getFirstDayOffset(visibleMonth);

  useEffect(() => {
    const loadSlots = async () => {
      const { data, error } = await createClient().from("time_slots").select("*").order("date").order("time_start");
      if (error) { setNotice("Jadwal belum bisa dimuat. Coba refresh halaman."); setIsLoading(false); return; }
      const loadedSlots = (data as TimeSlotRow[]).map(toTimeSlot);
      setSlots(loadedSlots);
      const firstOpenSlot = loadedSlots.find((slot) => !slot.isBooked && getMinutes(slot.timeEnd) - getMinutes(slot.timeStart) >= SERVICE_DURATION_MINUTES);
      if (firstOpenSlot) { setSelectedDate(firstOpenSlot.date); setVisibleMonth(new Date(`${firstOpenSlot.date}T00:00:00`)); }
      setIsLoading(false);
    };
    void loadSlots();
  }, []);

  useEffect(() => {
    AOS.refreshHard();
  }, [step]);

  const updateForm = <K extends keyof BookingFormData>(field: K, value: BookingFormData[K]) => setFormData((current) => ({ ...current, [field]: value }));
  const selectDate = (date: string) => { if (!availableDates.has(date)) return; setSelectedDate(date); updateForm("selectedSlotId", ""); };
  const changeMonth = (offset: number) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(nextMonth);
    const firstOpenDate = slots.find((slot) => { const slotDate = new Date(`${slot.date}T00:00:00`); return slotDate.getFullYear() === nextMonth.getFullYear() && slotDate.getMonth() === nextMonth.getMonth() && availableDates.has(slot.date); });
    setSelectedDate(firstOpenDate?.date ?? ""); updateForm("selectedSlotId", "");
  };
  const goNext = () => {
    if (step === 1 && !formData.selectedService) return setNotice("Pilih layanan terlebih dahulu.");
    if (step === 2 && !formData.selectedCategory) return setNotice("Pilih kategori terlebih dahulu.");
    if (step === 4 && (!selectedSlot || selectedSlot.isBooked)) return setNotice("Pilih jam yang masih tersedia dulu, ya.");
    if (step === 5 && (!formData.clientName.trim() || !formData.clientPhone.trim())) return setNotice("Nama dan nomor WhatsApp wajib diisi.");
    setStep((current) => Math.min(6, current + 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlot || selectedSlot.isBooked) return setNotice("Pilih jam yang masih tersedia dulu, ya.");
    if (!formData.clientName.trim() || !formData.clientPhone.trim()) return setNotice("Nama dan nomor WhatsApp wajib diisi.");
    if (!whatsappNumber) return setNotice("Nomor WhatsApp Thendy belum diatur di environment project.");
    setIsSubmitting(true);
    const { data, error } = await createClient().rpc("book_time_slot", { p_slot_id: selectedSlot.id, p_client_name: formData.clientName, p_client_phone: formData.clientPhone, p_client_notes: formData.clientNotes });
    if (error || !data) { setIsSubmitting(false); setNotice("Slot ini baru saja diambil. Silakan pilih jam lain."); return; }
    const bookedSlot = toTimeSlot(data as TimeSlotRow);
    setSlots((currentSlots) => currentSlots.map((slot) => (slot.id === bookedSlot.id ? bookedSlot : slot)));
    // Keep the established WhatsApp message format unchanged.
    const message = ["Halo Thendy! Gue mau lock jadwal di Hair Garage:", `• Nama: ${formData.clientName}`, `• Tanggal: ${formatMessageDate(selectedSlot.date)}`, `• Sesi: ${selectedSlot.timeStart} WIB`, "", "Tolong share loc garasinya ya, thank you!"].join("\n");
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setIsSubmitting(false);
  };

  const renderStep = () => {
    if (step === 1) return <div className="grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => updateForm("selectedService", "Haircut")} className={`p-5 text-left ${buttonClass} ${formData.selectedService === "Haircut" ? "bg-zinc-900 text-white" : ""}`}><span className="block text-xl">Haircut</span><span className="mt-2 block text-sm font-medium normal-case tracking-normal">Durasi 60–90 menit</span></button><button type="button" disabled className="cursor-not-allowed border-2 border-black bg-neutral-200 p-5 text-left text-neutral-500 opacity-80"><span className="flex items-center justify-between text-xl font-bold">Perming <span className="border-2 border-black bg-white px-2 py-1 text-[10px]">Coming Soon</span></span><span className="mt-2 block text-sm font-medium">Durasi 180 menit</span></button></div>;
    if (step === 2) return <div className="grid gap-4 sm:grid-cols-2">{categories.map((category) => <button key={category} type="button" onClick={() => updateForm("selectedCategory", category)} className={`flex items-center gap-4 p-5 text-left ${buttonClass} ${formData.selectedCategory === category ? "bg-zinc-900 text-white" : ""}`}><span className="grid h-14 w-14 shrink-0 place-items-center border-2 border-current" aria-hidden="true">{category === "Men" ? <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="20" cy="28" r="9" /><path d="m27 21 10-10m0 0h-8m8 0v8" /></svg> : <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="24" cy="18" r="8" /><path d="M24 26v14m-7-7h14" /></svg>}</span><span><span className="block text-xl font-black uppercase">{category}</span><span className="mt-1 block text-xs font-bold uppercase tracking-normal">{category === "Men" ? "Style untuk brother" : "Style untuk sister"}</span></span></button>)}</div>;
    if (step === 3) return <button type="button" onClick={() => updateForm("selectedHairstylist", "Thendy")} className={`flex w-full items-center gap-3 p-3 text-left ${buttonClass} ${formData.selectedHairstylist === "Thendy" ? "bg-zinc-900 text-white" : ""}`}><img src="/foto/baru.jpg" alt="Thendy, hairstylist Hair Garage" className="h-20 w-20 shrink-0 border-2 border-current object-cover object-center" /><span className="min-w-0"><span className="block text-lg font-black uppercase">Thendy</span><span className="mt-1 block text-sm font-bold normal-case tracking-normal">Price: Rp 0.00</span><span className="mt-1 block text-xs font-medium normal-case tracking-normal">Consultation - Haircut - Styling</span></span></button>;
    if (step === 4) return <><div className="flex items-center justify-between border-b-2 border-black pb-4"><h3 className="text-lg font-bold capitalize">{formatMonth(visibleMonth)}</h3><div className="flex gap-2"><button type="button" onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya" className={`${buttonClass} h-10 w-10 text-xl`}>‹</button><button type="button" onClick={() => changeMonth(1)} aria-label="Bulan berikutnya" className={`${buttonClass} h-10 w-10 text-xl`}>›</button></div></div>{isLoading ? <p className="py-12 text-center font-bold uppercase">Memuat jadwal...</p> : <div className="mt-5 grid grid-cols-7 text-center">{["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => <span key={day} className="pb-3 text-[10px] font-bold uppercase">{day}</span>)}{Array.from({ length: firstDayOffset }).map((_, index) => <span key={`empty-${index}`} className="h-12" />)}{Array.from({ length: totalDays }, (_, index) => { const day = index + 1; const dateKey = toDateKey(visibleMonth.getFullYear(), visibleMonth.getMonth(), day); const hasSlots = availableDates.has(dateKey); const isSelected = selectedDate === dateKey; return <button key={dateKey} type="button" disabled={!hasSlots} onClick={() => selectDate(dateKey)} className={`h-12 border-2 border-transparent font-bold ${isSelected ? "border-black bg-zinc-900 text-white" : hasSlots ? "hover:border-black hover:bg-neutral-100" : "text-neutral-300"}`}>{day}</button>; })}</div>}<div className="mt-7 border-t-2 border-black pt-5"><div className="flex items-center justify-between gap-4"><h3 className="text-sm font-bold">{selectedDate ? `Jam tersedia, ${formatMessageDate(selectedDate)}` : "Tidak ada slot di bulan ini"}</h3>{selectedDate && <span className="text-xs font-bold">{slotsForDate.filter((slot) => !slot.isBooked).length} SLOT</span>}</div><div className="mt-4 flex flex-wrap gap-3">{slotsForDate.map((slot) => { const isSelected = formData.selectedSlotId === slot.id; return <button key={slot.id} type="button" disabled={slot.isBooked} onClick={() => updateForm("selectedSlotId", slot.id)} className={`border-2 border-black px-4 py-3 text-sm font-bold ${slot.isBooked ? "cursor-not-allowed bg-neutral-200 text-neutral-500 line-through" : isSelected ? "bg-zinc-900 text-white" : "bg-white hover:bg-neutral-100"}`}>{slot.timeStart}–{slot.timeEnd}</button>; })}{!selectedDate && <p className="text-sm font-medium">Coba geser ke bulan yang punya jadwal.</p>}</div></div></>;
    if (step === 5) return <div className="grid gap-5"><p className="border-l-4 border-black bg-neutral-100 p-4 text-sm font-bold">Halo Brother / Sister. Isi data di bawah untuk mengunci jadwalmu.</p><label className="text-sm font-bold uppercase">Nama Lengkap<input required value={formData.clientName} onChange={(event) => updateForm("clientName", event.target.value)} placeholder="Nama kamu" className={inputClass} /></label><label className="text-sm font-bold uppercase">Nomor WhatsApp<input required type="tel" value={formData.clientPhone} onChange={(event) => updateForm("clientPhone", event.target.value)} placeholder="08xx-xxxx-xxxx" className={inputClass} /></label><label className="text-sm font-bold uppercase">Catatan Tambahan <span className="font-medium normal-case">(Optional)</span><textarea value={formData.clientNotes} onChange={(event) => updateForm("clientNotes", event.target.value)} placeholder="Ada request khusus?" rows={3} className={inputClass} /></label></div>;
    return <div className="grid gap-3 text-sm"><p className="mb-2 border-2 border-black bg-neutral-100 p-4 font-bold uppercase">Pastikan rincian booking Brother / Sister sudah benar.</p>{[["Layanan", formData.selectedService], ["Kategori", formData.selectedCategory], ["Hairstylist", "Thendy"], ["Tanggal & Jam", selectedSlot ? `${formatMessageDate(selectedSlot.date)} · ${selectedSlot.timeStart}–${selectedSlot.timeEnd} WIB` : "-"], ["Nama", formData.clientName], ["WhatsApp", formData.clientPhone], ["Catatan", formData.clientNotes || "-"]].map(([label, value]) => <div key={label} className="grid grid-cols-[110px_1fr] gap-3 border-b-2 border-black py-3"><span className="font-bold uppercase">{label}</span><span className="font-medium">{value}</span></div>)}</div>;
  };

  return <section id="booking" className="min-h-screen bg-[#f3f4f6] px-4 py-6 sm:px-8 sm:py-16" data-aos="zoom-in-up"><div className="mx-auto max-w-3xl"><div className="mb-6 sm:mb-8"><p className="text-xs font-bold uppercase tracking-[0.24em]">Hair Garage · Booking</p><h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Lock your next look.</h2></div><div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:p-8"><div className="mb-6 overflow-x-auto border-b-2 border-black pb-5 sm:mb-8 sm:overflow-visible sm:pb-6"><div className="flex min-w-[510px] justify-between gap-2 sm:grid sm:grid-cols-6 sm:gap-1">{steps.map((label, index) => <div key={label} className={`w-[78px] shrink-0 text-center text-[9px] font-bold uppercase sm:w-auto sm:text-xs ${index + 1 === step ? "text-black" : index + 1 < step ? "text-neutral-500" : "text-neutral-300"}`}><span className={`mx-auto mb-2 grid h-7 w-7 place-items-center border-2 border-black sm:h-8 sm:w-8 ${index + 1 === step ? "bg-zinc-900 text-white" : "bg-white text-black"}`}>{index + 1}</span><span className="block whitespace-nowrap">{label}</span></div>)}</div></div><form onSubmit={handleSubmit}><div className="mb-5 flex items-start justify-between gap-3 sm:mb-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em]">Step {step} / 6</p><h3 className="mt-2 text-2xl font-black uppercase">{steps[step - 1]}</h3></div>{step === 4 && <span className="border-2 border-black bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase">Slot ≥ 60 min</span>}</div>{renderStep()}<div className="mt-7 flex flex-col-reverse gap-3 border-t-2 border-black pt-5 sm:mt-8 sm:flex-row sm:justify-between">{step > 1 ? <button type="button" onClick={() => setStep((current) => current - 1)} className={`${buttonClass} px-5 py-3 text-sm`}>Kembali</button> : <span />}{step < 6 ? <button type="button" onClick={goNext} className={`${buttonClass} bg-zinc-900 px-6 py-3 text-sm text-white`}>Lanjut</button> : <button type="submit" disabled={isSubmitting || isLoading} className={`${buttonClass} bg-zinc-900 px-6 py-3 text-sm text-white disabled:cursor-wait disabled:opacity-60`}>{isSubmitting ? "MENGUNCI JADWAL..." : "Konfirmasi via WhatsApp"}</button>}</div></form></div></div>{notice && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" role="presentation" onClick={() => setNotice("")}><div role="alertdialog" aria-modal="true" aria-labelledby="booking-alert-title" className="mx-4 w-full max-w-[300px] border-4 border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-3 border-b-2 border-black pb-2"><h2 id="booking-alert-title" className="text-base font-black uppercase">Heads up</h2><button type="button" onClick={() => setNotice("")} aria-label="Tutup pesan" className="border-2 border-black px-1.5 font-bold leading-none hover:bg-neutral-100">×</button></div><p className="py-4 text-sm font-bold leading-5">{notice}</p><button type="button" autoFocus onClick={() => setNotice("")} className={`${buttonClass} w-full px-4 py-2 text-xs`}>OK, MENGERTI</button></div></div>}</section>;
}
