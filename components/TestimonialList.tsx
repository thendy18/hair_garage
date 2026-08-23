"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReviewItem } from "@/types/booking";

const stars = [1, 2, 3, 4, 5];

type ReviewRow = {
  id: string;
  name: string;
  role: string;
  message: string;
  rating: number;
  created_at: string;
};

const toReview = (row: ReviewRow): ReviewItem => ({
  id: row.id,
  name: row.name,
  role: row.role,
  message: row.message,
  rating: row.rating,
});

export default function TestimonialList() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [rating, setRating] = useState(0);
  const [form, setForm] = useState({ name: "", role: "", message: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      const { data, error: loadError } = await createClient()
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (loadError) {
        setError("Review belum bisa dimuat.");
      } else {
        setReviews((data as ReviewRow[]).map(toReview));
      }
      setIsLoading(false);
    };

    void loadReviews();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rating) {
      setError("Pilih rating bintang dulu, ya.");
      return;
    }

    setIsSubmitting(true);
    const { data, error: insertError } = await createClient()
      .from("reviews")
      .insert({
        name: form.name.trim(),
        role: form.role.trim() || "Teman garage",
        message: form.message.trim(),
        rating,
      })
      .select()
      .single();

    if (insertError || !data) {
      setError("Review belum berhasil dikirim. Coba lagi.");
      setIsSubmitting(false);
      return;
    }

    setReviews((currentReviews) => [toReview(data as ReviewRow), ...currentReviews]);
    setForm({ name: "", role: "", message: "" });
    setRating(0);
    setError("");
    setIsSubmitting(false);
  };

  return (
    <section className="bg-neutral-50 px-5 py-16 sm:px-8 sm:py-24" data-aos="fade-up">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
            Kata teman-teman
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
            Pulang dengan gaya baru, tetap berasa ngobrol sama teman.
          </h2>
        </div>

        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
          {isLoading ? (
            <p className="px-5 text-sm text-neutral-400">Memuat review...</p>
          ) : reviews.length ? reviews.map((review, index) => (
            <article
              key={review.id}
              className="relative min-w-[82%] snap-start rounded-3xl bg-white p-6 shadow-sm sm:min-w-[60%] lg:min-w-0"
              data-aos="fade-up"
              data-aos-delay={Math.min(index, 3) * 100}
            >
              <span className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 bg-white" />
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-neutral-900">{review.name}</p>
                  <p className="mt-1 text-xs text-neutral-400">{review.role}</p>
                </div>
                <span className="font-mono text-sm tracking-[0.12em] text-amber-500">
                  {"★".repeat(review.rating)}
                </span>
              </div>
              <p className="text-[15px] leading-7 text-neutral-600">
                “{review.message}”
              </p>
            </article>
          )) : (
            <p className="px-5 text-sm text-neutral-400">Belum ada review. Jadilah yang pertama.</p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-12 max-w-xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              Share your garage story
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">
              Gimana pengalaman lo?
            </h3>
          </div>

          <div className="mb-5 flex items-center gap-1" aria-label="Pilih rating">
            {stars.map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} bintang`}
                className={`text-3xl leading-none transition hover:scale-110 ${
                  star <= rating ? "text-amber-500" : "text-neutral-200"
                }`}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-xs text-neutral-400">
              {rating ? `${rating}/5` : "Pilih bintang"}
            </span>
          </div>

          <div className="grid gap-3">
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Nama lo"
              className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"
            />
            <input
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value })}
              placeholder="Contoh: Teman kantor"
              className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"
            />
            <textarea
              required
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Ceritain pengalaman lo..."
              rows={4}
              className="resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white"
            />
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-4 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Review"}
          </button>
        </form>
      </div>
    </section>
  );
}
