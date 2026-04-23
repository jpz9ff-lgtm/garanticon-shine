import { motion, useScroll, useTransform } from "framer-motion";
import botSrc from "@/assets/garanticon-bot.png";

export const FlyingBot = () => {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 0.28, 0.58, 1], [0, -34, 22, -18]);
  const y = useTransform(scrollYProgress, [0, 0.28, 0.58, 1], [0, -170, -78, -230]);
  const rotate = useTransform(scrollYProgress, [0, 0.28, 0.58, 1], [-5, 11, -9, 7]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-6 right-4 z-40 md:bottom-8 md:right-8"
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
          className="relative h-20 w-20 select-none object-contain drop-shadow-xl md:h-24 md:w-24"
        />
      </motion.div>
    </motion.div>
  );
};