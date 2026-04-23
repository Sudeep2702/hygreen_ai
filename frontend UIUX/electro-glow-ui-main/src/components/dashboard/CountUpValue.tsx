import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { useEffect } from "react";

type CountUpValueProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
};

export function CountUpValue({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: CountUpValueProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [motionValue, value]);

  return (
    <span className={className}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
