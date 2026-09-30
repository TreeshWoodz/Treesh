{
  "brand": {
    "app_name": "CHAINZ",
    "publisher": "Treesh Games",
    "visual_personality": [
      "premium App Store game polish",
      "dark arena + neon-accent highlights",
      "gold currency (Starlites) as a prestige layer",
      "tactile, toy-like buttons (press depth) without heavy blur",
      "fast readability at a glance (HUD-first)"
    ],
    "success_actions": [
      "tap PLAY",
      "choose mode + difficulty",
      "enter chained words quickly",
      "earn + spend Starlites",
      "unlock trophies + equip cosmetics",
      "tune settings (system keyboard, reduced motion)"
    ]
  },

  "design_tokens": {
    "notes": [
      "Accent MUST come from Treesh: CSS var --accent (hex). Default #9328ff.",
      "Design must work with ANY accent hue: use accent for glows, rings, highlights; keep surfaces neutral.",
      "Dark arena gameplay; other screens can be slightly lighter dark for hierarchy."
    ],

    "css_custom_properties": {
      "implementation": "Define in /src/index.css :root and .dark. Keep HSL tokens for shadcn + add hex helpers for accent/gold.",
      "tokens": {
        "--bg-0": "#07080B",
        "--bg-1": "#0B0D12",
        "--bg-2": "#101521",
        "--surface-0": "rgba(255,255,255,0.06)",
        "--surface-1": "rgba(255,255,255,0.09)",
        "--stroke-0": "rgba(255,255,255,0.10)",
        "--stroke-1": "rgba(255,255,255,0.16)",

        "--text-0": "rgba(255,255,255,0.92)",
        "--text-1": "rgba(255,255,255,0.72)",
        "--text-2": "rgba(255,255,255,0.52)",

        "--accent": "var(--treesh-accent, #9328ff)",
        "--accent-2": "color-mix(in oklab, var(--accent) 70%, white)",
        "--accent-ink": "#071018",

        "--gold": "#c3ab69",
        "--gold-2": "#ffd36b",
        "--gold-ink": "#1a1406",

        "--good": "#2EE59D",
        "--warn": "#FFCC66",
        "--bad": "#FF4D6D",

        "--shadow-1": "0 10px 30px rgba(0,0,0,0.45)",
        "--shadow-2": "0 18px 60px rgba(0,0,0,0.55)",
        "--ring-accent": "0 0 0 3px color-mix(in oklab, var(--accent) 35%, transparent)",
        "--ring-gold": "0 0 0 3px rgba(255,211,107,0.28)",

        "--r-sm": "12px",
        "--r-md": "16px",
        "--r-lg": "22px",

        "--space-1": "4px",
        "--space-2": "8px",
        "--space-3": "12px",
        "--space-4": "16px",
        "--space-5": "20px",
        "--space-6": "24px"
      },
      "required_global_styles": [
        "body: background: var(--bg-0); color: var(--text-0)",
        "Add subtle noise overlay via ::before on #root or main shell (opacity 0.06–0.09).",
        "Selection color: background color-mix(in oklab, var(--accent) 35%, black); color white."
      ],
      "gradient_policy": {
        "allowed": [
          "Only for hero/header section backgrounds and large decorative overlays",
          "Use mild, low-saturation gradients (dark-to-slightly-less-dark) with accent as a thin rim light",
          "Max 20% viewport coverage"
        ],
        "avoid": [
          "No saturated purple/pink gradients",
          "No gradients on small UI elements (<100px)",
          "No gradients behind text-heavy cards"
        ],
        "recommended_examples": [
          "background: radial-gradient(900px circle at 20% 0%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 55%), radial-gradient(700px circle at 80% 10%, rgba(255,211,107,0.10), transparent 60%), linear-gradient(180deg, var(--bg-1), var(--bg-0));"
        ]
      }
    },

    "typography": {
      "fonts": {
        "ui": "Manrope (already in Treesh)",
        "display": "Special Gothic Expanded One (headings/brand)",
        "numeric": "Doto (timer, Starlites, counters)"
      },
      "scale": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl font-[display] tracking-tight",
        "h2": "text-base md:text-lg text-[var(--text-1)]",
        "hud_number": "font-[numeric] text-xl tracking-widest",
        "body": "text-sm sm:text-base text-[var(--text-0)]",
        "caption": "text-xs text-[var(--text-2)]"
      },
      "rules": [
        "Use display font sparingly: Home title, Results headline, Mode headers.",
        "Numbers (score, timer, Starlites) always use Doto for brand continuity.",
        "Avoid all-caps body copy; reserve caps for badges/tabs."
      ]
    },

    "iconography": {
      "library": "lucide-react",
      "rules": [
        "No emoji icons.",
        "Use 1.75px stroke for HUD icons; 2px for buttons.",
        "Gold currency icon: custom SVG star/coin or lucide Star with gold fill."
      ]
    }
  },

  "layout_system": {
    "mobile_first_shell": {
      "goal": "Portrait phone primary; desktop shows centered phone column.",
      "container": "mx-auto w-full max-w-[520px] min-h-dvh px-4 pb-24",
      "phone_frame_optional": "On desktop only: wrap with rounded-[28px] border border-white/10 shadow-[var(--shadow-2)] bg-[var(--bg-1)]"
    },
    "grid": {
      "base": "8pt spacing",
      "cards": "gap-3",
      "mode_grid": "grid grid-cols-2 gap-3",
      "trophy_grid": "grid grid-cols-3 gap-3 sm:grid-cols-4"
    },
    "navigation": {
      "pattern": "Bottom nav (Home, Trophies, Shop, Profile, Settings)",
      "component": "shadcn Navigation Menu OR custom with Button + Tooltip",
      "style": "floating pill bar: bg-white/6 border border-white/10 backdrop-blur-[6px] (ONLY on nav, not gameplay)"
    }
  },

  "components": {
    "component_path": {
      "shadcn_primary": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/progress.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/avatar.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/drawer.jsx",
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx",
        "/app/frontend/src/components/ui/switch.jsx",
        "/app/frontend/src/components/ui/slider.jsx",
        "/app/frontend/src/components/ui/select.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/carousel.jsx",
        "/app/frontend/src/components/ui/sonner.jsx",
        "/app/frontend/src/components/ui/calendar.jsx"
      ]
    },

    "button_system": {
      "shape": "rounded-[14px] (primary), rounded-[12px] (secondary), rounded-full (chips)",
      "variants": {
        "primary": "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_10px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] hover:bg-[var(--accent-2)] active:translate-y-[1px]",
        "secondary": "bg-white/8 text-white border border-white/12 hover:bg-white/10",
        "ghost": "bg-transparent text-white/80 hover:bg-white/6",
        "gold": "bg-[var(--gold-2)] text-[var(--gold-ink)] hover:bg-[var(--gold)]"
      },
      "focus": "focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[var(--ring-accent)]",
      "no_transition_all": "Use transition-colors + transition-shadow only; do NOT use transition-all."
    },

    "card_system": {
      "base": "rounded-[var(--r-lg)] bg-white/6 border border-white/10 shadow-[var(--shadow-1)]",
      "header": "flex items-center justify-between",
      "micro": "Add subtle top highlight: before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/12"
    },

    "hud_chips": {
      "style": "rounded-full bg-black/35 border border-white/10 px-3 py-1.5",
      "numbers": "font-[numeric] tracking-widest",
      "accent_state": "When active (combo, starlite pending): ring via shadow-[var(--ring-accent)]"
    },

    "timer": {
      "recommended": "SVG ring timer (lightweight) + optional bar mode",
      "ring_style": {
        "track": "stroke: rgba(255,255,255,0.10)",
        "progress": "stroke: var(--accent)",
        "danger": "below 10% -> stroke: var(--bad) + subtle pulse"
      }
    },

    "keyboard": {
      "modes": [
        "Custom on-screen keyboard (default)",
        "System keyboard (native input) toggle in Settings"
      ],
      "layout": "3 rows + action row (Enter/Backspace/Hint). Keys are large, thumb-friendly.",
      "key_style": "rounded-[14px] bg-white/8 border border-white/12 active:translate-y-[1px]",
      "skins": [
        "Glass (white/8 + thin highlight)",
        "Neon (accent rim + dark key)",
        "Retro Typewriter (warm gray keys + subtle grain)",
        "Candy (pastel keycaps; keep arena dark)",
        "Mono (high-contrast minimal)",
        "Gold Luxe (gold accents only on edges, not full fill)",
        "Holo (iridescent border using conic-gradient on container only; keep keys solid)"
      ]
    }
  },

  "screen_blueprints": {
    "home": {
      "layout": [
        "Top: PlayerCard (Avatar + nickname + level + XP Progress + Starlites balance)",
        "Hero CTA: PLAY button (full width)",
        "Mode carousel/grid (2-col cards)",
        "Daily Chain card with countdown + reward preview",
        "Bottom nav"
      ],
      "player_card": {
        "elements": [
          "Avatar (shadcn Avatar)",
          "Nickname + title",
          "Level chip (Badge)",
          "XP Progress (Progress)",
          "Starlites pill (gold) with Doto number"
        ],
        "data_testids": [
          "home-player-card",
          "home-play-button",
          "home-starlites-balance",
          "home-mode-card"
        ]
      }
    },

    "mode_select": {
      "modes": [
        "Classic",
        "Blitz 60s",
        "Survival (hearts)",
        "Sudden Death (1 mistake)",
        "Zen (no timer, chill XP)",
        "Daily Chain (seeded)",
        "Letter Link (must include given letter)",
        "Compound (must form compound word pair)"
      ],
      "difficulty": "Segmented control using ToggleGroup (Easy/Normal/Hard/Insane)",
      "mode_cards": "Card with icon + short rule + reward multiplier badge",
      "data_testids": [
        "mode-select-grid",
        "mode-select-difficulty-toggle",
        "mode-select-start-button"
      ]
    },

    "countdown_overlay": {
      "style": "Full-screen overlay with subtle vignette; big Doto numbers; accent glow behind number",
      "motion": "Framer Motion scale 0.92->1 + opacity 0->1 per tick; GO has quick streak line burst",
      "data_testids": ["game-countdown-overlay"]
    },

    "gameplay": {
      "top_hud": [
        "Left: Score chip",
        "Center: Timer ring (or bar) + mode indicator",
        "Right: Combo chip + Pending Starlites chip"
      ],
      "hero_prompt": "Huge current prompt word centered-left (not fully centered page); display font for word, but keep readable.",
      "chain_trail": "Horizontal ScrollArea of chips (previous words) with link icon between; tap chip to see definition (Dialog).",
      "input_area": "Large input display card + correctness feedback line",
      "powerups": "Tray of 5 power-ups as icon buttons with counts; long-press opens tooltip/description.",
      "performance": [
        "Avoid heavy blur stacks during gameplay.",
        "Use 1 noise overlay + 1 vignette only.",
        "Prefer transform/opacity animations."
      ],
      "data_testids": [
        "game-hud-score",
        "game-hud-combo",
        "game-hud-timer",
        "game-hud-pending-starlites",
        "game-current-word",
        "game-chain-trail",
        "game-input",
        "game-submit-button",
        "game-powerup-button"
      ]
    },

    "results": {
      "layout": [
        "Headline (display font): Results",
        "Score + personal best burst",
        "Starlites earned breakdown (links, combos, speed, bonuses)",
        "Trophies unlocked row (carousel)",
        "Chain replay (scroll list)",
        "CTAs: Play again / Home / Share"
      ],
      "data_testids": [
        "results-score",
        "results-starlites-earned",
        "results-play-again-button",
        "results-home-button",
        "results-share-button"
      ]
    },

    "trophies": {
      "structure": "Tabs: All / In Progress / Completed",
      "card": "Trophy tile with tier border (bronze/silver/gold/platinum), lock overlay, progress bar",
      "tiers": {
        "bronze": "#B08D57",
        "silver": "#BFC7D5",
        "gold": "var(--gold-2)",
        "platinum": "#B9F2FF"
      },
      "data_testids": ["trophies-grid", "trophy-tile"]
    },

    "shop": {
      "tabs": ["Power-ups", "Keyboards", "Sounds", "Arenas", "Effects", "Titles"],
      "item_card": [
        "Preview (image or mini keyboard)",
        "Name + short perk",
        "Price in Starlites (gold pill)",
        "CTA: Buy / Owned / Equip"
      ],
      "purchase_flow": "AlertDialog confirm with price + remaining balance; toast on success.",
      "data_testids": [
        "shop-tabs",
        "shop-item-card",
        "shop-buy-button",
        "shop-equip-button"
      ]
    },

    "profile_stats": {
      "sections": [
        "Player header (avatar, nickname, accent swatch)",
        "Lifetime stats cards",
        "Per-mode bests table",
        "Run history list (last 20)"
      ],
      "data_testids": ["profile-stats", "profile-mode-bests"]
    },

    "settings": {
      "controls": [
        "Sound FX (Switch + Slider)",
        "Music (Switch + Slider)",
        "Haptics (Switch)",
        "Particles (Switch)",
        "Screen shake (Switch)",
        "Reduced motion (Switch)",
        "Use system keyboard (Switch)",
        "Timer style (Select: Ring/Bar)",
        "Countdown style (Select)",
        "Accent source (Select: Treesh / Custom) + color input",
        "Reset progress (AlertDialog)"
      ],
      "data_testids": [
        "settings-system-keyboard-toggle",
        "settings-reduced-motion-toggle",
        "settings-accent-source-select",
        "settings-reset-button"
      ]
    }
  },

  "starlite_system": {
    "currency": {
      "name": "Starlites",
      "display": "Gold pill with star icon + Doto number",
      "persistence": "IndexedDB for runs/inventory; LocalStorage for quick prefs + cached balance (sync on load)."
    },
    "earning_during_game": {
      "principles": [
        "Always show a small 'pending' counter in HUD that increments instantly.",
        "Convert pending -> banked at Results screen with breakdown animation.",
        "Golden 'Starlite Word' appears occasionally; chaining it grants bonus + sparkle burst."
      ],
      "rules": [
        "Base: +1 per valid link",
        "Speed bonus: +0–3 based on time left when submitted (Blitz/Sudden)",
        "Combo tiers: every 5 streak adds +5 bonus",
        "Perfect run bonus: +15 (no mistakes)",
        "Daily Chain completion: +25 + streak multiplier (up to x3 over consecutive days)",
        "Difficulty multiplier: Easy x1, Normal x1.2, Hard x1.5, Insane x2"
      ]
    },
    "earning_after_game": {
      "post_game_rewards": [
        "First win of the day: +20",
        "New personal best: +10",
        "Trophy unlock: immediate +X (tier-based)"
      ],
      "anti_grind": [
        "Soft cap: after 10 runs/day, reduce base earnings by 30% (still allow trophy rewards)."
      ]
    },
    "feedback": {
      "toasts": [
        "Use Sonner: '+25 Starlites'",
        "'Trophy unlocked' with tier color"
      ],
      "motion": "Gold sparkle burst (CSS particles) only on reward moments; keep lightweight."
    }
  },

  "game_modes_logic_notes": {
    "classic": "No timer; score based on chain length + rarity.",
    "blitz_60": "60s timer; submit adds +1s on correct (cap +10s) to create flow.",
    "survival": "3 hearts; wrong/timeout loses heart; hearts can be regained via streak milestones.",
    "sudden_death": "1 mistake ends run; higher multipliers.",
    "zen": "No fail state; earns XP mostly, minimal Starlites.",
    "daily_chain": "Seeded prompt set; one attempt; leaderboard-ready even without backend (local best + share code).",
    "letter_link": "Each turn requires including a highlighted letter; letter changes every 2 links.",
    "compound": "Must form compound pair (e.g., 'snow' -> 'ball'); show hint category occasionally."
  },

  "achievements": {
    "structure": "~40 achievements, each with 4 tiers (bronze/silver/gold/platinum) and Starlite rewards.",
    "examples": [
      "Chain Starter: 10/25/50/100 valid links",
      "Speed Demon: submit within 2s 5/15/30/60 times",
      "No Mercy (Sudden Death): 1/3/7/15 wins",
      "Daily Devotee: 3/7/14/30 day streak",
      "Collector: own 3/6/10/18 keyboard skins",
      "Golden Touch: chain 5/15/30/60 Starlite Words"
    ],
    "ui": "Trophy tile shows tier badge + progress bar + reward amount; locked shows silhouette + requirement."
  },

  "motion_microinteractions": {
    "library": "framer-motion",
    "principles": [
      "Fast, snappy: 180–240ms for taps; 320–420ms for screen transitions.",
      "Use transform + opacity; avoid animating box-shadow heavily during gameplay.",
      "Respect reduced motion setting: disable parallax, reduce bursts."
    ],
    "patterns": {
      "button_press": "whileTap scale 0.98 + translateY(1px)",
      "card_hover_desktop": "hover: translateY(-2px) + border-white/16",
      "reward_burst": "scale 0.9->1 + opacity + small particle sprinkle",
      "combo_pulse": "on tier up: quick ring flash using accent"
    }
  },

  "accessibility": {
    "rules": [
      "WCAG AA contrast: text-0 on bg-1; avoid low-contrast gray on gray.",
      "All interactive elements must have visible focus (shadow ring accent).",
      "Tap targets >= 44px; keyboard keys >= 44px height.",
      "Provide reduced motion toggle; also honor prefers-reduced-motion.",
      "Sound/haptics toggles must not block gameplay."
    ]
  },

  "data_testid_convention": {
    "rule": "kebab-case describing role, not appearance",
    "examples": [
      "home-play-button",
      "mode-select-start-button",
      "game-powerup-freeze-button",
      "shop-item-card",
      "settings-system-keyboard-toggle"
    ]
  },

  "image_urls": {
    "arena_backgrounds": [
      {
        "url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "use": "Default arena subtle grain texture (overlay at 0.10 opacity)"
      },
      {
        "url": "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "use": "Alternate arena texture for Shop/Results headers (overlay at 0.08 opacity)"
      }
    ],
    "accent_abstract_optional": [
      {
        "url": "https://images.unsplash.com/photo-1648878136576-5ac4e7d11111?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "use": "Optional decorative header art (keep under 20% viewport; blur OFF; opacity 0.12)"
      }
    ]
  },

  "instructions_to_main_agent": [
    "Replace CRA starter App.css centering patterns; do NOT center-align the whole app container.",
    "Implement a single AppShell with max-w-[520px] and bottom nav; gameplay uses a denser top HUD and avoids blur.",
    "Read Treesh accent from CSS variable --accent (or message from parent iframe) and set --treesh-accent accordingly.",
    "Use IndexedDB for: runs history, inventory, trophies progress, settings snapshot; LocalStorage for quick toggles + last-known Starlites.",
    "Every button/input/toggle/tab/item card MUST include data-testid.",
    "Use Sonner for toasts; keep reward toasts gold-themed.",
    "Keyboard: implement both custom on-screen keyboard and system keyboard mode; persist preference.",
    "Starlites: show pending during gameplay; bank at results with breakdown animation.",
    "Trophies: 40 items with tiers; show progress bars and reward amounts; unlocking triggers toast + results section."
  ],

  "general_ui_ux_design_guidelines": [
    "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms",
    "- You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text",
    "- NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json",
    " **GRADIENT RESTRICTION RULE**",
    "NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc",
    "NEVER use dark gradients for logo, testimonial, footer etc",
    "NEVER let gradients cover more than 20% of the viewport.",
    "NEVER apply gradients to text-heavy content or reading areas.",
    "NEVER use gradients on small UI elements (<100px width).",
    "NEVER stack multiple gradient layers in the same viewport.",
    "**ENFORCEMENT RULE:**",
    "    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors",
    "**How and where to use:**",
    "   • Section backgrounds (not content backgrounds)",
    "   • Hero section header content. Eg: dark to light to dark color",
    "   • Decorative overlays and accent elements only",
    "   • Hero section with 2-3 mild color",
    "   • Gradients creation can be done for any angle say horizontal, vertical or diagonal",
    "- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**",
    "- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead.",
    "- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.",
    "- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.",
    "- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly",
    "    Eg: - if it implies playful/energetic, choose a colorful scheme",
    "           - if it implies monochrome/minimal, choose a black–white/neutral scheme",
    "**Component Reuse:**",
    "\t- Prioritize using pre-existing components from src/components/ui when applicable",
    "\t- Create new components that match the style and conventions of existing components when needed",
    "\t- Examine existing components to understand the project's component patterns before creating new ones",
    "**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component",
    "**Best Practices:**",
    "\t- Use Shadcn/UI as the primary component library for consistency and accessibility",
    "\t- Import path: ./components/[component-name]",
    "**Export Conventions:**",
    "\t- Components MUST use named exports (export const ComponentName = ...)",
    "\t- Pages MUST use default exports (export default function PageName() {...})",
    "**Toasts:**",
    "  - Use `sonner` for toasts\"",
    "  - Sonner component are located in `/app/src/components/ui/sonner.tsx`",
    "Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
  ]
}
