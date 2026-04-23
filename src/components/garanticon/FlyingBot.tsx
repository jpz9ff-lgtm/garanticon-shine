import { motion, useScroll, useTransform } from "framer-motion";
import botSrc from "@/assets/garanticon-bot.png";

export const FlyingBot = () => {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 0.28, 0.58, 1], [0, 34, -18, 24]);
  const y = useTransform(scrollYProgress, [0, 0.28, 0.58, 1], [0, -150, -68, -210]);
  const rotate = useTransform(scrollYProgress, [0, 0.28, 0.58, 1], [-5, 11, -9, 7]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-10 left-4 z-40 md:bottom-12 md:left-8"
      style={{ x, y, rotate }}
    >
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [-2, 3, -2] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <span className="absolute inset-x-3 bottom-1 h-4 rounded-full bg-primary/25 blur-md" />
        <img
          src={botSrc}
          alt=""
          width={512}
          height={512}
          loading="eager"
          decoding="async"
          className="relative h-28 w-28 select-none object-contain drop-shadow-xl md:h-32 md:w-32"
        />
      </motion.div>
    </motion.div>
  );
};