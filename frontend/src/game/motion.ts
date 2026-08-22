// Global animation switch — flipped off when Performance Mode is on so heavy
// devices can skip the extra motion. Read synchronously by lightweight components.
export const motion = { enabled: true };
export function setMotionEnabled(value: boolean) { motion.enabled = value; }
