import React from "react";
import {
  Link2, Zap, Heart, Skull, Leaf, CalendarDays, CaseSensitive, Puzzle, Snowflake, Lightbulb, ListChecks, SkipForward, Shield, Sparkles,
  Link, Anvil, Crown, Infinity as InfinityIcon, Flame, Target, Gem, Landmark, Medal, Timer, Gauge, Star, Stars, Compass, LayoutGrid,
  HeartPulse, HeartHandshake, Swords, CalendarCheck, CalendarRange, CalendarHeart, BadgeCheck, Brain, WholeWord, BookOpen, ShoppingBag,
  Gift, Wand2, Moon, Sunrise, Repeat, Trophy, Orbit,
} from "lucide-react";

const MAP = {
  Link2, Zap, Heart, Skull, Leaf, CalendarDays, CaseSensitive, Puzzle, Snowflake, Lightbulb, ListChecks, SkipForward, Shield, Sparkles,
  Link, Anvil, Crown, Infinity: InfinityIcon, Flame, Target, Gem, Landmark, Medal, Timer, Gauge, Star, Stars, Compass, LayoutGrid,
  HeartPulse, HeartHandshake, Swords, CalendarCheck, CalendarRange, CalendarHeart, BadgeCheck, Brain, WholeWord, BookOpen, ShoppingBag,
  Gift, Wand2, Moon, Sunrise, Repeat, Trophy, Orbit,
};

export const Icon = ({ name, ...rest }) => {
  const C = MAP[name] || Sparkles;
  return <C {...rest} />;
};
