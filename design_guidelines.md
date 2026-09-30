{
  "brand": {
    "name": "Hoop (Treesh)",
    "attributes": [
      "restrained",
      "performance-first",
      "outdoor-readable",
      "tactile",
      "coach-like (direct, not hype)"
    ],
    "design_style_fusion": {
      "base": "Swiss / utilitarian sports UI (clear hierarchy, grid discipline)",
      "accent": "Y2K-evolution micro-glow (only on primary actions + active nav)",
      "surfaces": "matte dark cards with subtle noise + hairline borders"
    }
  },

  "typography": {
    "font_imports": {
      "note": "Reuse Treesh fonts for continuity. Add to public/index.html via Google Fonts or self-host if already present in parent app.",
      "google_fonts_example": [
        "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap",
        "(If available) Special Gothic Expanded One (display)",
        "(If available) Doto (numbers/mono)"
      ]
    },
    "font_families": {
      "display": "'Special Gothic Expanded One', system-ui, sans-serif",
      "body": "'Manrope', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      "numbers": "'Doto', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-muted-foreground",
      "section_title": "text-lg font-semibold",
      "body": "text-sm md:text-base",
      "small": "text-xs text-muted-foreground",
      "numeric": "font-[var(--font-numbers)] tabular-nums"
    },
    "copy_tone": {
      "rules": [
        "Short labels. No motivational fluff.",
        "Use coaching verbs: 'Set', 'Load', 'Snap', 'Hold'.",
        "Error text: actionable + one sentence."
      ]
    }
  },

  "color_system": {
    "mode": "dark-only",
    "contrast_goal": "Outdoor readability: prefer near-white text (#F5F6F8) on near-black surfaces; avoid low-contrast gray-on-gray.",
    "tokens_hex": {
      "bg": "#0B0B0E",
      "bg_2": "#0F1015",
      "card": "#12131A",
      "card_2": "#161824",
      "border": "#24263A",
      "text": "#F5F6F8",
      "text_muted": "#B7BBCB",
      "text_dim": "#8B90A6",

      "pink": "#FF3EA5",
      "pink_2": "#FF66BE",
      "pink_ink": "#2A0B1B",

      "success": "#2EE59D",
      "warning": "#FFCC66",
      "danger": "#FF4D4D",
      "info": "#6AA8FF",

      "ring": "#FF66BE",
      "shadow": "rgba(0,0,0,0.55)"
    },
    "semantic_mapping": {
      "--background": "bg",
      "--foreground": "text",
      "--card": "card",
      "--card-foreground": "text",
      "--muted": "card_2",
      "--muted-foreground": "text_muted",
      "--border": "border",
      "--input": "border",
      "--ring": "ring",
      "--primary": "pink",
      "--primary-foreground": "#0B0B0E",
      "--secondary": "card_2",
      "--secondary-foreground": "text",
      "--destructive": "danger",
      "--destructive-foreground": "#0B0B0E"
    },
    "gradients": {
      "restriction": "Use gradients only as decorative section backgrounds (<=20% viewport). No gradients on small UI elements.",
      "allowed_mild_gradients": {
        "hero_top_edge": "radial-gradient(900px 420px at 20% -10%, rgba(255,62,165,0.18), transparent 60%), radial-gradient(700px 360px at 90% 0%, rgba(106,168,255,0.10), transparent 55%)",
        "camera_status_glow": "radial-gradient(220px 120px at 50% 50%, rgba(255,62,165,0.22), transparent 70%)"
      }
    },
    "texture": {
      "noise_overlay_css": "background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.06\"/></svg>');"
    }
  },

  "design_tokens_css": {
    "where": "/app/frontend/src/index.css (replace :root/.dark with dark-only tokens)",
    "css_variables": "/* Hoop dark-only tokens */\n:root{\n  --font-display: 'Special Gothic Expanded One', system-ui, sans-serif;\n  --font-body: 'Manrope', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;\n  --font-numbers: 'Doto', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;\n\n  --background: 240 18% 5%; /* #0B0B0E */\n  --foreground: 220 20% 97%; /* #F5F6F8 */\n  --card: 235 18% 9%; /* #12131A */\n  --card-foreground: 220 20% 97%;\n  --popover: 235 18% 9%;\n  --popover-foreground: 220 20% 97%;\n\n  --primary: 330 100% 62%; /* #FF3EA5 */\n  --primary-foreground: 240 18% 5%;\n  --secondary: 232 20% 12%; /* #161824 */\n  --secondary-foreground: 220 20% 97%;\n\n  --muted: 232 20% 12%;\n  --muted-foreground: 226 14% 76%; /* #B7BBCB */\n  --accent: 232 20% 12%;\n  --accent-foreground: 220 20% 97%;\n\n  --destructive: 0 100% 65%; /* #FF4D4D */\n  --destructive-foreground: 240 18% 5%;\n\n  --border: 234 22% 18%; /* #24263A */\n  --input: 234 22% 18%;\n  --ring: 330 100% 70%; /* #FF66BE */\n\n  --radius: 14px;\n\n  /* spacing + elevation */\n  --container-pad: 16px;\n  --tap: 44px;\n  --shadow-1: 0 10px 30px rgba(0,0,0,.55);\n  --shadow-2: 0 18px 60px rgba(0,0,0,.65);\n}\n\nhtml, body { font-family: var(--font-body); }\n\n::selection{ background: rgba(255,62,165,.28); }\n\n/* optional: add a subtle noise layer on app root */\n.hoop-noise{ position: relative; }\n.hoop-noise:before{ content:''; position:absolute; inset:0; pointer-events:none; opacity:.55; mix-blend-mode: overlay; background-image: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.06\"/></svg>'); }"
  },

  "layout": {
    "mobile_first": true,
    "app_shell": {
      "pattern": "Top app bar + scrollable content + bottom nav (5 items) + 'More' sheet",
      "max_width": "max-w-[1100px] mx-auto (desktop content), but keep full-bleed background",
      "padding": "px-4 pb-24 pt-3",
      "safe_area": "Use env(safe-area-inset-bottom) padding for bottom nav"
    },
    "navigation": {
      "mobile_bottom_nav": {
        "items": ["Courts", "Drills", "Plan", "Dictionary", "More"],
        "more_sheet": ["Position", "Games", "Favorites", "Form Check", "Profile"],
        "interaction": "Active tab uses pink underline + icon fill; inactive stays muted",
        "component": "Use shadcn Sheet for More"
      },
      "desktop_side_rail": {
        "pattern": "Left rail with icons + labels; content on right; keep bottom nav hidden >=lg",
        "sticky": "sticky top-4"
      }
    },
    "grids": {
      "cards_grid": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
      "dictionary_grid": "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
      "drill_lanes": "horizontal ScrollArea with lane chips + snap"
    }
  },

  "components": {
    "component_path": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "command": "/app/frontend/src/components/ui/command.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "progress": "/app/frontend/src/components/ui/progress.jsx",
      "slider": "/app/frontend/src/components/ui/slider.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "switch": "/app/frontend/src/components/ui/switch.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "sonner_toasts": "/app/frontend/src/components/ui/sonner.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "avatar": "/app/frontend/src/components/ui/avatar.jsx"
    },
    "button_variants": {
      "primary": {
        "use": "Save, Start, Generate, Enable Camera",
        "tailwind": "bg-[var(--pink)] text-black hover:bg-[#FF66BE] focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "motion": "hover: translateY(-1px) + shadow; active: scale(0.98)"
      },
      "secondary": {
        "tailwind": "bg-[var(--card_2)] text-[var(--text)] border border-[var(--border)] hover:bg-[#1B1E2D]",
        "use": "Filters, Less-important actions"
      },
      "ghost": {
        "tailwind": "hover:bg-white/5 text-[var(--text_muted)] hover:text-[var(--text)]",
        "use": "Icon buttons, list row actions"
      },
      "danger": {
        "tailwind": "bg-[#FF4D4D] text-black hover:bg-[#FF6B6B]",
        "use": "Delete, Clear"
      }
    },
    "list_rows": {
      "pattern": "Full-width tappable row (min-h-[44px]) with left icon, title, meta, right chevron/star",
      "tailwind": "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-3 active:bg-white/5"
    },
    "search": {
      "courts_address_lookup": "Use Command component as typeahead (OSM/Nominatim results).",
      "dictionary_search": "Input + debounce + results grid; show Skeleton while loading."
    },
    "empty_states": {
      "style": "One-line explanation + single CTA. Use muted text + small illustration (SVG court diagram).",
      "no_emojis": true
    }
  },

  "page_blueprints": {
    "courts": {
      "top": "Search bar + 'Use my location' button",
      "results": "Card list with distance, address, 'Directions' (external maps), star save",
      "favorites_export_import": "Use Dialog for export JSON textarea + import file picker",
      "testids": [
        "courts-search-input",
        "courts-use-location-button",
        "courts-result-row",
        "courts-save-favorite-button",
        "courts-export-button",
        "courts-import-button"
      ]
    },
    "drills": {
      "layout": "Lane browser (ScrollArea) + level filter Tabs + drill cards",
      "detail": "Bottom Drawer: video embed (AspectRatio), steps list, coaching cues badges",
      "testids": [
        "drills-lane-scroll",
        "drills-level-tabs",
        "drills-drill-card",
        "drills-detail-open",
        "drills-video-embed"
      ]
    },
    "plan": {
      "generator": "Filters (duration slider, level select, lanes multi-select) + Generate button",
      "timer": "Fullscreen timer with big numbers (Doto), minimize to floating pill, close",
      "testids": [
        "plan-generate-session-button",
        "plan-duration-slider",
        "plan-start-timer-button",
        "plan-timer-minimize-button",
        "plan-timer-close-button"
      ]
    },
    "dictionary": {
      "layout": "Search + grid of term cards with mini SVG diagram thumbnail",
      "detail": "Dialog with larger illustration + definition",
      "testids": [
        "dictionary-search-input",
        "dictionary-term-card",
        "dictionary-term-dialog"
      ]
    },
    "position": {
      "layout": "Form (height, wingspan, weight, hand size optional) + results bars for PG..C",
      "visual": "Use Progress bars with pink fill; show top match card",
      "testids": [
        "position-form-submit-button",
        "position-result-bar",
        "position-top-match"
      ]
    },
    "games": {
      "layout": "List of games; each opens a scorekeeper screen",
      "scorekeepers": {
        "horse": "Letters tracker per player; tap to add letter; undo",
        "around_world": "Spot chips; tap to advance; miss toggles",
        "21": "Stepper buttons +1/+2/+3; foul toggle"
      },
      "testids": [
        "games-game-row",
        "games-scorekeeper"
      ]
    },
    "favorites": {
      "layout": "Saved courts list + export/import entry points",
      "testids": ["favorites-list", "favorites-export-button", "favorites-import-button"]
    },
    "form_check": {
      "layout": "Camera preview full-bleed card + skeleton overlay canvas + right-side (desktop) / bottom sheet (mobile) metrics",
      "checks": ["elbow", "knee-bend", "release", "follow-through", "balance"],
      "ui": "Top-left status pill (FPS, model), top-right torch/mirror toggles; bottom 'Record shot' button",
      "colors": "Green/amber/red for joints; pink only for primary CTA",
      "testids": [
        "form-camera-start-button",
        "form-camera-video",
        "form-skeleton-canvas",
        "form-shot-record-button",
        "form-report-card"
      ]
    },
    "profile": {
      "source": "Read from localStorage key 'treesh_profile' (parent app).",
      "layout": "Avatar + nickname + stats cards (sessions, drills completed, streak) + settings",
      "testids": ["profile-avatar", "profile-nickname", "profile-stats-card"]
    }
  },

  "motion": {
    "library": "framer-motion",
    "principles": [
      "Fast, subtle. 120–180ms for hover; 220–280ms for page transitions.",
      "Use opacity + y (2–6px) entrance; avoid big bouncy easing.",
      "No universal transition: all."
    ],
    "recipes": {
      "card_hover": "whileHover={{ y: -2 }} transition={{ duration: 0.16 }}",
      "page_enter": "initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}"
    }
  },

  "camera_form_check_tech": {
    "recommended": {
      "pose": "@mediapipe/tasks-vision PoseLandmarker (client-side)",
      "overlay": "Canvas overlay aligned to <video>",
      "analysis": "Compute angles in JS; store per-shot report locally; optional backend for heavier analysis"
    },
    "install_steps": [
      "npm i @mediapipe/tasks-vision",
      "(optional) npm i zustand for state (shots history, toggles)"
    ],
    "js_scaffold": {
      "note": "Project uses .js. Keep modules in /src/features/form-check/*.js",
      "core": "// pseudo-scaffold\nimport { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';\n\nexport async function createPoseLandmarker(){\n  const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');\n  return await PoseLandmarker.createFromOptions(vision, {\n    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task' },\n    runningMode: 'VIDEO',\n    numPoses: 1\n  });\n}\n\nexport function drawPose({canvas, video, result}){\n  const ctx = canvas.getContext('2d');\n  canvas.width = video.videoWidth;\n  canvas.height = video.videoHeight;\n  ctx.clearRect(0,0,canvas.width,canvas.height);\n  const utils = new DrawingUtils(ctx);\n  const landmarks = result?.landmarks?.[0];\n  if(!landmarks) return;\n  // draw connectors/landmarks with color based on checks\n  utils.drawLandmarks(landmarks, { radius: 2, color: 'rgba(245,246,248,.9)' });\n}\n"
    }
  },

  "logo": {
    "concept": "Minimal hoop mark: a thin ring + net hint + motion notch. Works at 24px.",
    "svg": "<svg width=\"96\" height=\"96\" viewBox=\"0 0 96 96\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M18 34c6-10 18-16 30-16s24 6 30 16\" stroke=\"#FF3EA5\" stroke-width=\"6\" stroke-linecap=\"round\"/>\n  <path d=\"M24 40h48\" stroke=\"#F5F6F8\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\"0.9\"/>\n  <path d=\"M30 42v18c0 10 8 18 18 18s18-8 18-18V42\" stroke=\"#F5F6F8\" stroke-width=\"4\" stroke-linecap=\"round\" opacity=\"0.9\"/>\n  <path d=\"M36 52l24 24\" stroke=\"#F5F6F8\" stroke-width=\"3\" opacity=\"0.55\"/>\n  <path d=\"M60 52L36 76\" stroke=\"#F5F6F8\" stroke-width=\"3\" opacity=\"0.55\"/>\n</svg>",
    "usage": "Use pink stroke only as accent; keep most strokes near-white for dark mode clarity."
  },

  "image_urls": {
    "hero_background_optional": [
      {
        "url": "https://images.pexels.com/photos/34036538/pexels-photo-34036538.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "category": "Courts header / empty state",
        "description": "Moody hoop at night; use as blurred, darkened background behind header only (<=20% viewport)."
      }
    ],
    "drills_header_optional": [
      {
        "url": "https://images.pexels.com/photos/6764622/pexels-photo-6764622.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "category": "Drills header",
        "description": "Close-up ball hold; crop tight; apply dark overlay for readability."
      }
    ]
  },

  "accessibility": {
    "rules": [
      "Tap targets >=44px (use --tap).",
      "Visible focus ring: 2px pink ring + 2px offset on dark surfaces.",
      "Avoid gray text below #8B90A6 on #0B0B0E for body copy.",
      "Respect prefers-reduced-motion: disable parallax + reduce entrance animations."
    ]
  },

  "data_testid_conventions": {
    "format": "kebab-case, role-based",
    "examples": [
      "bottom-nav-courts-tab",
      "more-sheet-open-button",
      "drill-detail-start-button",
      "timer-fullscreen-close-button",
      "profile-sync-status"
    ],
    "must_apply_to": [
      "buttons",
      "links",
      "inputs",
      "menus",
      "critical info text (errors, totals, distances, timers)"
    ]
  },

  "instructions_to_main_agent": [
    "Replace default CRA App.css centering patterns; do NOT center the whole app.",
    "Update /src/index.css to dark-only tokens above; remove light theme variables to avoid accidental light surfaces.",
    "Use shadcn/ui components exclusively for interactive primitives (Sheet, Dialog, Drawer, Command, Tabs, Select, Slider, Progress, Calendar).",
    "Implement mobile bottom nav + desktop side rail; keep routes under /hoop/*.",
    "Ensure every interactive element and key info has data-testid.",
    "Keep pink as accent only; most surfaces are matte charcoal with hairline borders.",
    "Camera Form Check: implement client-side pose estimation + canvas overlay; UI must remain readable outdoors (big labels, high contrast)."
  ],

  "General UI UX Design Guidelines": "- You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
