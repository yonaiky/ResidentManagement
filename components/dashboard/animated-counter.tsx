"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

type AnimatedCounterProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

export function AnimatedCounter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const spring = useSpring(0, { stiffness: 75, damping: 20 });
  const display = useTransform(spring, (v) =>
    `${prefix}${v.toFixed(decimals)}${suffix}`
  );
  const [text, setText] = useState(`${prefix}0${suffix}`);
  const mounted = useRef(false);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setText(v));
    if (!mounted.current) {
      mounted.current = true;
      spring.jump(value);
    }
    return unsub;
  }, [display, spring, value]);

  return (
    <motion.span className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {text}
    </motion.span>
  );
}
