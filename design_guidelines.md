{
  "brand": {
    "name": "Treesh 3.0",
    "tagline": "Music to Live For",
    "attributes": [
      "premium",
      "nightlife",
      "underground",
      "lively",
      "glassy",
      "high-contrast",
      "motion-forward"
    ],
    "non_negotiables": [
      "Near-black base (#0a0a0a–#121212)",
      "Electric purple accent (#9328ff)",
      "Luxe gold accent (#c3ab69)",
      "White text + subtle white borders (rgba(255,255,255,0.15–0.2))",
      "Glassmorphism panels with backdrop-blur",
      "Animated star/particle field background",
      "Vinyl/record-player motif in Now Playing",
      "Smooth spring easing motion",
      "No Games/Videos sections"
    ]
  },

  "typography": {
    "google_fonts": {
      "display": {
        "family": "Special Gothic Expanded One",
        "weights": [400],
        "usage": "Wordmark, hero/section display headings, big numbers in Now Playing"
      },
      "ui": {
        "family": "Manrope",
        "weights": [200, 300, 400, 500, 600, 700, 800],
        "usage": "All UI/body text"
      },
      "numerals_optional": {
        "family": "Doto",
        "weights": [400, 600],
        "usage": "Timecodes (00:42), scrubber timestamps, tiny technical labels"
      }
    },
    "tailwind_text_hierarchy": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl",
      "h2": "text-base md:text-lg",
      "body": "text-sm md:text-base",
      "small": "text-xs"
    },
    "type_rules": [
      "Use Manrope for everything by default; reserve Special Gothic Expanded One for brand moments only (avoid overuse).",
      "Use tracking-tight on headings; use tracking-wide on tiny labels (genre, explicit, metadata).",
      "Prefer font-weight 500–700 for actionable labels; 300–400 for secondary metadata."
    ]
  },

  "color_system": {
    "gradient_restriction_rule": {
      "prohibited": [
        "blue-500 to purple-600",
        "purple-500 to pink-500",
        "green-500 to blue-500",
        "red to pink",
        "any dark/saturated gradient combos"
      ],
      "rules": [
        "NEVER let gradients cover more than 20% of the viewport.",
        "NEVER apply gradients to text-heavy content or reading areas.",
        "NEVER use gradients on small UI elements (<100px width).",
        "NEVER stack multiple gradient layers in the same viewport.",
        "IF gradient area exceeds 20% of viewport OR affects readability THEN use solid colors."
      ],
      "allowed_usage": [
        "Hero/Now Playing header background only (decorative)",
        "Large section background overlays",
        "Very subtle accent glows behind vinyl or CTA clusters"
      ]
    },
    "tokens_css_variables": {
      "instructions": "Replace current shadcn defaults in /app/frontend/src/index.css :root and .dark with Treesh tokens below. Keep HSL format for shadcn compatibility.",
      "css": ":root {\n  /* Treesh uses dark theme by default; keep :root aligned to dark to avoid flash */\n  --background: 0 0% 4%; /* ~#0a0a0a */\n  --foreground: 0 0% 98%;\n\n  --card: 240 6% 7%; /* ~#111114 */\n  --card-foreground: 0 0% 98%;\n\n  --popover: 240 6% 7%;\n  --popover-foreground: 0 0% 98%;\n\n  --primary: 270 100% 58%; /* Treesh purple #9328ff */\n  --primary-foreground: 0 0% 100%;\n\n  --secondary: 240 6% 12%;\n  --secondary-foreground: 0 0% 98%;\n\n  --muted: 240 6% 10%;\n  --muted-foreground: 0 0% 72%;\n\n  --accent: 44 38% 59%; /* Treesh gold #c3ab69 */\n  --accent-foreground: 240 6% 10%;\n\n  --destructive: 0 72% 52%;\n  --destructive-foreground: 0 0% 98%;\n\n  --border: 0 0% 100% / 0.16;\n  --input: 0 0% 100% / 0.16;\n  --ring: 270 100% 58% / 0.55;\n\n  --radius: 0.9rem;\n\n  /* Treesh custom tokens */\n  --treesh-bg-0: #0a0a0a;\n  --treesh-bg-1: #121212;\n  --treesh-panel: rgba(255,255,255,0.06);\n  --treesh-panel-strong: rgba(255,255,255,0.09);\n  --treesh-stroke: rgba(255,255,255,0.16);\n  --treesh-stroke-strong: rgba(255,255,255,0.22);\n  --treesh-purple: #9328ff;\n  --treesh-purple-soft: rgba(147,40,255,0.22);\n  --treesh-gold: #c3ab69;\n  --treesh-gold-soft: rgba(195,171,105,0.18);\n  --treesh-shadow: 0 18px 60px rgba(0,0,0,0.55);\n  --treesh-glow-purple: 0 0 0 1px rgba(147,40,255,0.25), 0 0 28px rgba(147,40,255,0.22);\n  --treesh-glow-gold: 0 0 0 1px rgba(195,171,105,0.22), 0 0 26px rgba(195,171,105,0.18);\n}\n\n.dark {\n  /* Keep .dark identical to :root so toggling doesn't invert Treesh */\n  --background: 0 0% 4%;\n  --foreground: 0 0% 98%;\n  --card: 240 6% 7%;\n  --card-foreground: 0 0% 98%;\n  --popover: 240 6% 7%;\n  --popover-foreground: 0 0% 98%;\n  --primary: 270 100% 58%;\n  --primary-foreground: 0 0% 100%;\n  --secondary: 240 6% 12%;\n  --secondary-foreground: 0 0% 98%;\n  --muted: 240 6% 10%;\n  --muted-foreground: 0 0% 72%;\n  --accent: 44 38% 59%;\n  --accent-foreground: 240 6% 10%;\n  --destructive: 0 72% 52%;\n  --destructive-foreground: 0 0% 98%;\n  --border: 0 0% 100% / 0.16;\n  --input: 0 0% 100% / 0.16;\n  --ring: 270 100% 58% / 0.55;\n}\n"
    },
    "palette_usage": {
      "backgrounds": [
        "Use --treesh-bg-0 for app root background.",
        "Use --treesh-bg-1 for large sections behind content (subtle separation)."
      ],
      "surfaces": [
        "Cards/panels: rgba(255,255,255,0.06) with backdrop-blur.",
        "Elevated panels (Now Playing lyrics/about): rgba(255,255,255,0.09)."
      ],
      "accents": [
        "Purple = primary actions, active states, progress, focus rings.",
        "Gold = premium highlights (Treesh Choice badge, special dividers, subtle highlights)."
      ]
    }
  },

  "layout_and_grid": {
    "global_structure": {
      "mobile": [
        "Top: compact header (wordmark + search icon / mic icon).",
        "Body: scrollable content with sections.",
        "Bottom: persistent mini-player (appears after selecting a song) + bottom nav."
      ],
      "desktop": [
        "Left: glass sidebar nav (Library, Icons, Favorites, Playlists, Settings).",
        "Main: content area with max-w and generous gutters.",
        "Right (optional): Now Playing queue/lyrics panel (only when playing).",
        "Bottom: mini-player spans content width (not full-bleed under sidebar)."
      ]
    },
    "container_rules": [
      "Do NOT center-align all text globally.",
      "Use max-w-6xl for main content on desktop with px-4 sm:px-6 lg:px-8.",
      "Use 2–3x more spacing than feels comfortable: section gap 24–40px, card gap 12–16px."
    ],
    "song_grid": {
      "mobile": "grid grid-cols-2 gap-3",
      "tablet": "sm:grid-cols-3 sm:gap-4",
      "desktop": "lg:grid-cols-4 xl:grid-cols-5"
    }
  },

  "components": {
    "component_path": {
      "shadcn": {
        "button": "/app/frontend/src/components/ui/button.jsx",
        "card": "/app/frontend/src/components/ui/card.jsx",
        "badge": "/app/frontend/src/components/ui/badge.jsx",
        "input": "/app/frontend/src/components/ui/input.jsx",
        "slider": "/app/frontend/src/components/ui/slider.jsx",
        "progress": "/app/frontend/src/components/ui/progress.jsx",
        "tabs": "/app/frontend/src/components/ui/tabs.jsx",
        "dialog": "/app/frontend/src/components/ui/dialog.jsx",
        "drawer": "/app/frontend/src/components/ui/drawer.jsx",
        "sheet": "/app/frontend/src/components/ui/sheet.jsx",
        "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
        "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
        "avatar": "/app/frontend/src/components/ui/avatar.jsx",
        "toggle_group": "/app/frontend/src/components/ui/toggle-group.jsx",
        "command": "/app/frontend/src/components/ui/command.jsx",
        "sonner": "/app/frontend/src/components/ui/sonner.jsx",
        "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
        "separator": "/app/frontend/src/components/ui/separator.jsx",
        "switch": "/app/frontend/src/components/ui/switch.jsx",
        "calendar": "/app/frontend/src/components/ui/calendar.jsx"
      },
      "notes": [
        "Use shadcn components as primitives; wrap them into Treesh-specific components (SongCard, MiniPlayer, VinylPlayer, GenreChips, ArtistRingAvatar).",
        "Project uses .js files (not .tsx). Keep components in .jsx/.js accordingly."
      ]
    },

    "treesh_specific_components_spec": {
      "AppShell": {
        "description": "Root layout with starfield background canvas, sidebar/bottom nav, and mini-player portal.",
        "tailwind": "min-h-dvh bg-[var(--treesh-bg-0)] text-white relative overflow-hidden",
        "layers": [
          "Background: <StarfieldCanvas /> absolute inset-0 z-0",
          "Noise overlay: pseudo-element or div z-10 pointer-events-none",
          "Content: relative z-20"
        ]
      },

      "StarfieldCanvas": {
        "description": "Lightweight canvas starfield (no heavy libs). Subtle parallax on pointer move; optional shooting stars on interval.",
        "performance": [
          "Cap stars to ~120 on mobile, ~220 on desktop.",
          "Use devicePixelRatio clamp (Math.min(window.devicePixelRatio, 2)).",
          "Pause animation when tab hidden (visibilitychange)."
        ],
        "visual": [
          "Stars: white with alpha 0.25–0.85; occasional purple-tinted stars (alpha low).",
          "Very subtle vignette overlay (radial) behind content.",
          "No gradients covering >20% viewport; keep starfield as primary background texture."
        ]
      },

      "TopHeader": {
        "description": "Wordmark left, search input center (desktop) or icon (mobile), mic button right.",
        "wordmark": {
          "font": "Special Gothic Expanded One",
          "tailwind": "font-[\"Special_Gothic_Expanded_One\"] uppercase tracking-[0.08em]"
        },
        "search": {
          "component": "Input + Command (for typeahead)",
          "tailwind": "bg-white/5 border-white/15 focus-visible:ring-[color:var(--treesh-purple)]"
        },
        "data_testids": [
          "top-header",
          "global-search-input",
          "voice-mic-button"
        ]
      },

      "GenreChips": {
        "description": "Scrollable chip row with active glow. Use ToggleGroup for single-select + 'All'.",
        "tailwind": {
          "wrap": "flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]",
          "chip": "data-[state=on]:shadow-[var(--treesh-glow-purple)] data-[state=on]:border-white/25 bg-white/5 border border-white/15 hover:bg-white/8"
        },
        "data_testids": [
          "genre-chips",
          "genre-chip-all",
          "genre-chip-{genre-slug}"
        ]
      },

      "SongCard": {
        "description": "Cover art + title/artist + badges + quick actions (like, add to playlist).",
        "structure": [
          "Card with AspectRatio cover",
          "Overlay: play button appears on hover (desktop) / always visible small on mobile",
          "Badges: Explicit (white/10), Treesh Choice (gold glow)"
        ],
        "tailwind": {
          "card": "group relative rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[var(--treesh-shadow)] hover:border-white/25",
          "cover": "rounded-xl overflow-hidden",
          "title": "font-semibold leading-tight",
          "meta": "text-xs text-white/70",
          "playBtn": "absolute bottom-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        },
        "micro_interactions": [
          "Hover: card lifts (translate-y-[-2px]) + purple glow ring (box-shadow token).",
          "Press: scale-95 on play button only.",
          "Loading: skeleton shimmer (subtle, not bright)."
        ],
        "data_testids": [
          "song-card-{songId}",
          "song-card-play-button-{songId}",
          "song-card-like-button-{songId}",
          "song-card-add-to-playlist-button-{songId}"
        ]
      },

      "MiniPlayerBar": {
        "description": "Persistent bottom bar with cover, title/artist, play/pause, progress, expand to Now Playing.",
        "tailwind": {
          "wrap": "fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]",
          "panel": "mx-auto max-w-6xl rounded-2xl border border-white/15 bg-white/6 backdrop-blur-2xl shadow-[var(--treesh-shadow)]",
          "inner": "flex items-center gap-3 p-3"
        },
        "behavior": [
          "Tap anywhere on left/middle expands Now Playing (Drawer on mobile, route/modal on desktop).",
          "Progress is clickable/seekable on desktop; on mobile keep it as visual only to avoid accidental seeks (optional)."
        ],
        "data_testids": [
          "mini-player",
          "mini-player-play-pause-button",
          "mini-player-next-button",
          "mini-player-expand-button",
          "mini-player-progress"
        ]
      },

      "NowPlayingView": {
        "description": "Full-screen Now Playing with vinyl spinner, big cover, controls, lyrics/about tabs.",
        "layout": {
          "mobile": [
            "Top: back/close + track title marquee",
            "Center: vinyl + cover",
            "Bottom: scrubber + controls + tabs"
          ],
          "desktop": [
            "Two-column: left vinyl/cover, right lyrics/about + metadata",
            "Controls anchored under vinyl"
          ]
        },
        "vinyl": {
          "visual": [
            "Outer disc: radial gradients simulated with layered divs (NOT huge gradients; keep within vinyl element).",
            "Grooves: repeating-conic-gradient with low alpha.",
            "Center label: purple/gold ring.",
            "Needle arm: optional decorative element on desktop only."
          ],
          "animation": [
            "Spin only when playing (CSS keyframes).",
            "Use prefers-reduced-motion to disable spin and replace with subtle pulse."
          ]
        },
        "controls": {
          "use": ["Slider (seek)", "Button", "Tooltip"],
          "buttons": {
            "primary": "Play/Pause as circular button with purple glow",
            "secondary": "Prev/Next, Shuffle, Repeat as ghost buttons with hover ring"
          }
        },
        "tabs": {
          "use": "Tabs for Lyrics / About / Credits",
          "tailwind": "bg-white/5 border border-white/15 rounded-2xl"
        },
        "data_testids": [
          "now-playing",
          "now-playing-close-button",
          "now-playing-play-pause-button",
          "now-playing-prev-button",
          "now-playing-next-button",
          "now-playing-shuffle-button",
          "now-playing-repeat-button",
          "now-playing-seek-slider",
          "now-playing-volume-slider",
          "now-playing-lyrics-tab",
          "now-playing-about-tab"
        ]
      },

      "ArtistRingAvatar": {
        "description": "Circular artist avatar with glowing ring + role label. Click opens artist detail.",
        "tailwind": {
          "wrap": "group flex flex-col items-start gap-2",
          "ring": "relative rounded-full p-[2px] bg-white/10 border border-white/15 shadow-[var(--treesh-glow-purple)] group-hover:shadow-[var(--treesh-glow-gold)]",
          "img": "rounded-full overflow-hidden"
        },
        "data_testids": [
          "artist-card-{artistId}",
          "artist-card-open-button-{artistId}"
        ]
      },

      "Playlists": {
        "description": "Playlist list + create/rename/delete dialogs; playlist detail shows songs.",
        "use_components": ["Dialog", "Input", "Button", "ScrollArea", "Card"],
        "data_testids": [
          "playlists-page",
          "create-playlist-button",
          "create-playlist-name-input",
          "confirm-create-playlist-button",
          "rename-playlist-button-{playlistId}",
          "delete-playlist-button-{playlistId}"
        ]
      },

      "Favorites": {
        "description": "List view with cover thumbnail, title/artist, heart toggle.",
        "empty_state": "Show a glass card with a subtle equalizer animation and CTA to browse Library.",
        "data_testids": [
          "favorites-page",
          "favorites-empty-state",
          "favorite-toggle-button-{songId}"
        ]
      },

      "ProfileOnboarding": {
        "description": "Local profile modal: nickname, birthday (zodiac), avatar upload, theme accent/backdrop.",
        "use_components": ["Dialog or Drawer", "Input", "Calendar", "Avatar", "Button", "Select", "Switch"],
        "zodiac": "Compute zodiac from birthday; show as gold badge.",
        "data_testids": [
          "profile-onboarding",
          "profile-nickname-input",
          "profile-birthday-calendar",
          "profile-avatar-upload-input",
          "profile-save-button"
        ]
      },

      "ThemeCustomization": {
        "description": "Accent color picker (preset swatches) + backdrop style (glass strength, noise). Persist to localStorage and backend /api/profile.",
        "presets": [
          "#9328ff (default)",
          "#7a2cff (deep violet)",
          "#b58cff (lavender neon)",
          "#c3ab69 (gold accent mode)"
        ],
        "data_testids": [
          "theme-settings",
          "theme-accent-swatch-{hex}",
          "theme-backdrop-select",
          "theme-save-button"
        ]
      },

      "VoiceControl": {
        "description": "Mic button triggers Web Speech API commands. Provide a listening overlay with animated pulse + waveform bars.",
        "listening_ui": [
          "Overlay: small glass pill near top or center with 'Listening…' + live bars.",
          "Pulse ring: purple outer ring + gold inner spark.",
          "Auto-dismiss after command or timeout."
        ],
        "commands": [
          "play",
          "pause",
          "next",
          "previous",
          "shuffle",
          "repeat",
          "search {query}",
          "play {song name}"
        ],
        "data_testids": [
          "voice-control",
          "voice-control-mic-button",
          "voice-control-listening-overlay",
          "voice-control-transcript"
        ]
      }
    }
  },

  "motion_and_microinteractions": {
    "library": {
      "framer_motion": {
        "usage": [
          "Route/page transitions (fade + slight y).",
          "SongCard hover lift + glow.",
          "Now Playing open/close spring.",
          "Voice listening overlay entrance/exit."
        ],
        "spring": {
          "type": "spring",
          "stiffness": 260,
          "damping": 26,
          "mass": 0.9
        }
      }
    },
    "css_keyframes": {
      "vinyl_spin": "@keyframes treesh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }",
      "shimmer": "@keyframes treesh-shimmer { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }",
      "equalizer": "@keyframes treesh-eq { 0%,100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }"
    },
    "interaction_rules": [
      "No universal transition (no transition: all).",
      "Buttons: transition-colors + shadow only.",
      "Cards: transition-[box-shadow,border-color,background-color] only.",
      "Respect prefers-reduced-motion: disable vinyl spin and heavy parallax."
    ]
  },

  "states": {
    "loading": {
      "use": "Skeleton",
      "pattern": "Show 8–12 SongCard skeletons in grid; keep header/chips visible."
    },
    "empty": {
      "library_search_empty": "Glass panel with 'No matches' + suggestion chips (genres) + clear search button.",
      "playlists_empty": "Glass panel + CTA to create playlist.",
      "favorites_empty": "Glass panel + CTA to browse Library."
    },
    "error": {
      "pattern": "Inline Alert component with retry button; keep tone calm and premium.",
      "data_testids": ["global-error-alert", "retry-fetch-button"]
    }
  },

  "accessibility": {
    "rules": [
      "WCAG AA contrast: white/90 text on near-black; avoid low-contrast gray on glass.",
      "Focus states: visible ring using --ring (purple) + offset.",
      "Hit targets: min 44x44 for mobile controls.",
      "Keyboard: all controls reachable; Now Playing trap focus when open (Dialog/Drawer handles).",
      "ARIA labels for icon-only buttons (play/pause/next/prev/mic)."
    ]
  },

  "performance": {
    "rules": [
      "Lazy-load heavy views (Now Playing, Artist detail) with React.lazy.",
      "Memoize SongCard and ArtistRingAvatar.",
      "Use <img loading=\"lazy\"> for grids; prioritize current track cover.",
      "Starfield canvas: single instance; do not re-render on state changes (imperative draw loop)."
    ]
  },

  "image_urls": {
    "note": "App already uses real external cover art + artist images. Do not replace. Add only optional decorative assets if needed.",
    "optional_free_assets": [
      {
        "category": "texture",
        "description": "CSS-only noise overlay (no image) preferred. If image needed, use a tiny seamless noise PNG from a free source and commit to repo.",
        "url": ""
      }
    ]
  },

  "instructions_to_main_agent": [
    "Update /app/frontend/src/index.css tokens to Treesh dark tokens (see css block).",
    "Remove CRA default App.css styles (logo/header) and replace with Treesh-specific minimal CSS (vinyl keyframes, noise overlay utilities).",
    "Implement StarfieldCanvas as a single canvas behind the app; keep it lightweight and pause on hidden tab.",
    "Use shadcn primitives; create Treesh wrappers in /src/components (SongCard, MiniPlayerBar, VinylPlayer, GenreChips, ArtistRingAvatar).",
    "Ensure every interactive element and key info has data-testid (kebab-case).",
    "Use Dialog/Drawer/Sheet for overlays; Now Playing should feel like a full-screen premium overlay with spring motion.",
    "Keep gradients minimal and decorative only; rely on glow + glass + starfield for liveliness.",
    "No Games/Videos routes or nav items."
  ],

  "general_ui_ux_design_guidelines_appendix": "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
