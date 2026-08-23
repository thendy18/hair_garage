"use client";

import { useEffect, useState } from "react";

const storyLines = [
  "> whoami: Mahasiswa IT yang yang nyemplung ke dunia rambut.",
  "",
  "Dulu, gue sering banget keluar dari tempat potong rambut dengan rasa nyesel.",
  "Bukannya makin pede, yang ada malah pengen buru-buru pulang dan nutupin kepala.",
  "Dari rasa risih itu, gue selalu nyari orang yang mau luangin waktu buat dengerin",
  "dan nyocokin potongan yang pas sama bentuk muka gue.",
  "",
  "Karena susah nemunya, akhirnya gue mutusin buat belajar motong sendiri.",
  "Gue ga ngeklaim udah paling jago—gue masih terus belajar dan berproses setiap hari.",
  "Tapi satu hal yang pasti: gue gamau lo ngerasain rasa nyesel yang dulu sering gue rasain.",
  "",
  "Garasi ini bukan sekadar tempat potong rambut.",
  "Gue seneng dengerin cerita, ngobrol santai, dan tukar pikiran tentang apa aja.",
  "Kita cari bentuk rambut yang bikin lo nyaman, sambil nikmati obrolannya.",
  "",
  "> status: ready_to_connect_and_cut_"
];

export default function StoryTerminal() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    let lineIndex = 0;
    let currentText = "";
    let timer: ReturnType<typeof setTimeout>;

    const typeNextCharacter = () => {
      const currentLine = storyLines[lineIndex];

      if (currentText.length < currentLine.length) {
        currentText = currentLine.slice(0, currentText.length + 1);
        setVisibleLines((lines) => {
          const nextLines = [...lines];
          nextLines[lineIndex] = currentText;
          return nextLines;
        });
        timer = setTimeout(typeNextCharacter, 20);
        return;
      }

      if (lineIndex < storyLines.length - 1) {
        lineIndex += 1;
        currentText = "";
        setVisibleLines((lines) => [...lines, ""]);
        timer = setTimeout(typeNextCharacter, currentLine ? 420 : 180);
      }
    };

    setVisibleLines([""]);
    timer = setTimeout(typeNextCharacter, 350);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      aria-labelledby="story-terminal-title"
      className="bg-neutral-50 px-5 py-16 sm:px-8 sm:py-24"
      data-aos="fade-up"
    >
      <div className="mx-auto max-w-3xl">
        <p
          id="story-terminal-title"
          className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-neutral-400"
        >
          A little note from the garage
        </p>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.4)]">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="ml-2 font-mono text-[11px] text-slate-400">
              thendy-story.txt
            </span>
          </div>
          <div
            aria-live="polite"
            className="min-h-80 px-5 py-6 font-mono text-sm leading-7 text-slate-600 sm:px-8 sm:py-8 sm:text-[15px]"
          >
            {visibleLines.map((line, index) => (
              <p key={index} className="min-h-7">
                {line}
                {index === visibleLines.length - 1 && (
                  <span
                    aria-label="Kursor aktif"
                    className="ml-1 inline-block h-5 w-2 animate-pulse bg-slate-500 align-middle"
                  />
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
