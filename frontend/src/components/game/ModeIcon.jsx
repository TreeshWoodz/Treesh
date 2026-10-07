import { MessageCircle, PenLine, Scale, Repeat, Zap, Flame, Sparkles, Divide, SkipForward, Timer, Heart } from "lucide-react";

const ICONS = { MessageCircle, PenLine, Scale, Repeat, Zap, Flame, Sparkles, Divide, SkipForward, Timer, Heart };

export const ModeIcon = ({ name, className = "w-5 h-5" }) => {
  const I = ICONS[name] || Sparkles;
  return <I className={className} />;
};
