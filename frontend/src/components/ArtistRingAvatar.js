import { memo } from "react";
import { motion } from "framer-motion";
import { CoverArt } from "@/components/CoverArt";

function ArtistRingAvatarBase({ artist, onOpen, size = 116 }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={() => onOpen(artist)}
      className="group flex flex-col items-center gap-2"
      data-testid={`artist-card-${artist.id}`}
    >
      <div
        className="relative rounded-full p-[3px] glow-purple transition-shadow group-hover:glow-gold"
        style={{ width: size, height: size }}
        data-testid={`artist-card-open-button-${artist.id}`}
      >
        <div className="absolute inset-0 rounded-full border border-white/15" />
        <div className="h-full w-full overflow-hidden rounded-full">
          <CoverArt src={artist.image} alt={artist.name} className="h-full w-full object-cover" />
        </div>
      </div>
      <div className="text-center">
        <p className="clamp-1 max-w-[120px] text-sm font-semibold">{artist.name}</p>
        <p className="clamp-1 text-[10px] uppercase tracking-wide text-white/45">{artist.role}</p>
      </div>
    </motion.button>
  );
}

export const ArtistRingAvatar = memo(ArtistRingAvatarBase);
