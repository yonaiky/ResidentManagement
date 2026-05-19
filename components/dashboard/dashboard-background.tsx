"use client";

import { motion } from "framer-motion";

export function DashboardBackground() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <motion.div
        className="absolute -left-[20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px] dark:bg-blue-600/15"
        animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[20%] h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px] dark:bg-violet-600/10"
        animate={{ opacity: [0.3, 0.5, 0.3], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[30%] h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-[90px] dark:bg-cyan-500/8"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="dashboard-grid absolute inset-0 opacity-[0.35] dark:opacity-[0.2]" />
      <motion.div className="dashboard-noise absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" />
    </motion.div>
  );
}
