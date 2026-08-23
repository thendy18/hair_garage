"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function Providers({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
    });
  }, []);

  return children;
}
