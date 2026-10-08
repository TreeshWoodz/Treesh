import { motion } from "framer-motion";

export const HandFan = ({ cards, renderCard, testid = "player-hand" }) => {
  const mid = (cards.length - 1) / 2;
  return (
    <div data-testid={testid} className="flex justify-center items-end w-full px-3 pt-5 pb-3">
      {cards.map((c, i) => (
        <div
          key={c.id}
          className={`${i === cards.length - 1 ? "shrink-0" : "shrink min-w-[16px]"} w-[62px] sm:w-[74px] relative hover:z-50`}
          style={{ zIndex: i }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: Math.min(Math.abs(i - mid) * 2.5, 6), opacity: 1, rotate: (i - mid) * Math.min(2.2, 14 / cards.length) }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="origin-bottom"
          >
            {renderCard(c, i)}
          </motion.div>
        </div>
      ))}
    </div>
  );
};
