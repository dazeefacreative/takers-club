import { motion } from "framer-motion";
import { Link } from "react-router";

export const MotionLink = motion(Link);
export const MotionButton = motion.button;
export const MotionA = motion.a;

// Shared rest/hover variants — pass initial="rest" whileHover="hover" on the
// motion element, and reference the same variants on any nested motion child
// (e.g. an arrow icon) so it animates in sync via Framer's variant propagation.
export const fadeHoverVariants = { rest: { opacity: 1 }, hover: { opacity: 0.65 } };
export const ghostHoverVariants = { rest: { color: "var(--muted-foreground)" }, hover: { color: "#0a0a0a" } };
export const arrowShiftVariants = { rest: { x: 0 }, hover: { x: 4 } };
export const arrowShiftVariantsSm = { rest: { x: 0 }, hover: { x: 2 } };

export const tapScale = { scale: 0.95 };
export const tapScaleSm = { scale: 0.9 };
export const tapScaleLg = { scale: 0.97 };
