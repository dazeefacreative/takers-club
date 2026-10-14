import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
  style,
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
