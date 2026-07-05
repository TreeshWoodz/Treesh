{
  "project": {
    "name": "Treesh 3.0",
    "scope": "Blueprints for two new components that must match the existing Treesh premium dark + glass identity. No palette/font/theme changes.",
    "audience": "Mobile-first (iPhone Safari) music fans; must scale to desktop.",
    "critical_constraints": [
      "Preserve existing tokens exactly: near-black bg, Treesh Purple #9328ff glow, Gold #c3ab69, glass panels rgba(255,255,255,0.06)+blur(20px)+1px stroke rgba(255,255,255,0.14).",
      "Typography stays: Special Gothic Expanded One (display), Manrope (body), Doto (mono/stat).",
      "Motion stays: spring-ish cubic-bezier(.22,1,.36,1), 150–460ms; existing slide-up, spring-in, backdrop fade, drawer slide, mini-player rise, toasts.",
      "Icons: lucide.",
      "Vanilla JS + Tailwind CDN; guidelines must be JS-friendly (no TSX assumptions).",
      "All interactive + key informational elements MUST include data-testid (kebab-case, role-based)."
    ]
  },

  "existing_tokens_reference": {
    "css_vars": {
      "bg": ["--treesh-bg-0 (#0a0a0b)", "--treesh-bg-1 (#121214)"],
      "panel": "--treesh-panel (rgba(255,255,255,0.06))",
      "panel_strong": "--treesh-panel-strong (rgba(255,255,255,0.09))",
      "stroke": "--treesh-stroke (rgba(255,255,255,0.14))",
      "purple": "--treesh-purple (#9328ff)",
      "gold": "--treesh-gold (#c3ab69)",
      "glow_purple": "--treesh-glow-purple (0 0 0 1px rgba(147,40,255,.28), 0 0 28px rgba(147,40,255,.24))",
      "glow_gold": "--treesh-glow-gold (0 0 0 1px rgba(195,171,105,.24), 0 0 26px rgba(195,171,105,.2))"
    },
    "utility_classes_already_present": [
      ".glass, .glass-strong",
      ".glow-purple, .glow-gold",
      ".clamp-1, .clamp-2",
      ".no-scrollbar, .soft-scroll",
      ".shimmer (brand moment text)",
      ".marquee-track (long titles)",
      ".eq (playing indicator)"
    ],
    "easing": "cubic-bezier(.22,1,.36,1)",
    "durations_ms": [150, 220, 320, 460]
  },

  "component_blueprints": {
    "component_a_treesh_picks_showcase": {
      "goal": "A curated editorial spotlight for up to 6 randomly-selected songs; must read clearly different from the existing full-bleed 16:9 'What's New' hero carousel.",
      "recommended_direction": "Direction 1 (Portrait 'Peek' Spotlight Row) — best fit for Treesh because it contrasts the 16:9 hero with tall editorial covers, feels collectible, and works perfectly with thumb-driven horizontal scroll on iPhone.",
      "variation_directions": {
        "direction_1_portrait_peek_row_recommended": {
          "layout": {
            "section_header": {
              "left": "H2: 'TREESH’S PICKS' (display font, uppercase, wide tracking)",
              "right": "Small ghost button 'Shuffle' (lucide: Shuffle) + optional 'See all' link",
              "spacing": "px-4 (mobile) / px-6 (desktop), mt-6, mb-3"
            },
            "scroller": {
              "type": "Horizontal scroll + snap-x mandatory + 'peek' next card",
              "container_classes": "flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-2",
              "card_size": {
                "mobile": "w-[220px] min-w-[220px] h-[320px]",
                "desktop": "w-[240px] min-w-[240px] h-[340px]"
              },
              "peek_rule": "Ensure last card has right padding (pr-4) so next card peeks ~24–32px. This makes it feel editorial and distinct from the full-bleed hero."
            }
          },
          "card_anatomy": {
            "outer": {
              "surface": "glass panel (use .glass) with rounded-3xl, 1px stroke, subtle shadow",
              "classes": "glass rounded-3xl overflow-hidden relative shadow-[var(--treesh-shadow)]",
              "hover_lift": "hover:-translate-y-1 (desktop only) + glow on focus/hover",
              "testid": "data-testid=\"treesh-picks-card\""
            },
            "cover": {
              "type": "Portrait cover art (aspect-[3/4])",
              "classes": "w-full aspect-[3/4] object-cover",
              "overlay": "Bottom scrim for text legibility: from rgba(0,0,0,0) to rgba(0,0,0,0.72) over bottom ~45% (NOT a saturated gradient; keep neutral black alpha)."
            },
            "gold_identity": {
              "treatment": "Gold ribbon tag that feels like a label seal (not like the hero category pill).",
              "placement": "Top-left, slightly inset (12px), rotated -8deg",
              "classes": "absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] tracking-[0.18em] uppercase",
              "colors": "bg-[rgba(195,171,105,0.16)] border border-[rgba(195,171,105,0.35)] text-[var(--treesh-gold)]",
              "icon": "lucide: Sparkles or Star",
              "testid": "data-testid=\"treesh-picks-ribbon\""
            },
            "play_affordance": {
              "treatment": "Circular play button that floats mid-right over the cover (distinct from hero’s white play button).",
              "placement": "absolute right-3 top-[52%] -translate-y-1/2",
              "surface": "glass-strong + purple glow on hover/focus",
              "classes": "glass-strong rounded-full w-11 h-11 grid place-items-center",
              "states": {
                "default": "icon color white/90",
                "hover": "add glow-purple + bg opacity slightly higher",
                "active_press": "scale-95",
                "playing": "swap icon to Pause + show tiny .eq indicator near bottom-right"
              },
              "testid": "data-testid=\"treesh-picks-play-button\""
            },
            "meta_block": {
              "placement": "Bottom content area inside card (over scrim)",
              "title": "Song title (Manrope semibold, clamp-1)",
              "artist": "Artist (Manrope regular, opacity 0.78, clamp-1)",
              "genre_pill": "Small pill (Badge) bottom-left; use neutral glass pill with gold text OR purple dot",
              "classes": "absolute inset-x-0 bottom-0 p-3"
            }
          },
          "interaction_states": {
            "hover_desktop": [
              "Card lifts -translate-y-1 and increases border alpha to --treesh-stroke-strong",
              "Cover subtly zooms (scale 1.03) with 320ms easing",
              "Play button gains .glow-purple"
            ],
            "press_mobile": [
              "Card press: scale-[0.99] (not 0.95 to avoid jank in scroll)",
              "Play button press: scale-95"
            ],
            "focus_keyboard": [
              "Use visible ring: ring-2 ring-[var(--treesh-purple)] ring-offset-0",
              "Ensure focus order: card -> play -> overflow menu (if any)"
            ],
            "context_menu_optional": "Long-press on card opens a small glass context menu (Add to playlist, Like, View artist). Use existing dropdown/context-menu patterns if present."
          },
          "empty_loading_error_states": {
            "loading": {
              "pattern": "Skeleton cards in same scroller geometry (6 placeholders).",
              "classes": "skeleton h-[320px] w-[220px] rounded-3xl",
              "testid": "data-testid=\"treesh-picks-loading\""
            },
            "empty": {
              "copy": "‘No picks right now. Pull to refresh or check back later.’",
              "cta": "Ghost button ‘Refresh’",
              "visual": "Use a subtle glass card with lucide: Sparkles outline",
              "testid": "data-testid=\"treesh-picks-empty\""
            },
            "error": {
              "copy": "‘Couldn’t load Treesh’s Picks.’",
              "cta": "Button ‘Try again’",
              "testid": "data-testid=\"treesh-picks-error\""
            }
          },
          "why_it_reads_different_from_whats_new": [
            "Portrait editorial cards vs full-bleed 16:9 hero slides.",
            "Gold ribbon seal (rotated) vs category pill.",
            "Floating circular play affordance vs hero’s large white CTA.",
            "Scroll-snap ‘peek’ row feels like a curated shelf, not a billboard carousel."
          ]
        },

        "direction_2_split_feature_plus_stack": {
          "layout": "One featured pick on the left (or top on mobile) as a larger glass card with cover + copy; to the right (or below) a compact vertical list of 4–5 picks with tiny covers and inline play.",
          "mobile": "Featured card first (full width), then a 2-column mini grid or list.",
          "desktop": "Two-column: featured (60%) + list (40%) inside a single glass container.",
          "pros": ["More editorial, less scrolling"],
          "cons": ["Can visually compete with the existing hero if the featured card becomes too large"]
        }
      },
      "implementation_notes_tailwind": {
        "section_wrapper": "mt-6",
        "header": "flex items-end justify-between px-4",
        "title": "font-display uppercase tracking-[0.22em] text-sm text-white/90",
        "subtle_divider": "Use a thin separator line under header: h-px bg-white/10 mx-4 mt-3",
        "scroller": "flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 no-scrollbar"
      }
    },

    "component_b_profile_module_avatar_origin_sheet": {
      "goal": "A profile module that expands outward from the circular avatar button in the fixed header (top-right), animating as if it grows from that avatar. Contains profile header + combined Favorites and Playlists.",
      "recommended_container": "Use a custom anchored panel (desktop) + full-height sheet (mobile). You can implement with existing shadcn primitives (Sheet/Drawer/Dialog) but you MUST override animation to originate from avatar via transform-origin and a measured anchor rect.",

      "open_close_motion_choreography": {
        "shared_principles": [
          "Transform origin must be the avatar center (top-right).",
          "Use easing cubic-bezier(.22,1,.36,1).",
          "Avoid animating expensive properties; animate transform + opacity only.",
          "Backdrop fades separately (opacity only).",
          "Respect prefers-reduced-motion: jump-cut with backdrop fade only."
        ],
        "mobile_sheet": {
          "position": "Fixed, inset-0; panel is full-height sheet with top padding for safe-area; anchored visually to avatar via a ‘growth’ illusion.",
          "panel_geometry": "w-full h-[100dvh] rounded-t-3xl (if sliding from bottom) OR rounded-3xl with small margins (if centered). Recommended: top-anchored growth from avatar into a near-fullscreen panel with 12px margins.",
          "recommended": "Near-fullscreen panel with margins: inset-3 sm:inset-4; keeps the ‘origin from avatar’ believable and premium.",
          "keyframes_open": {
            "backdrop": "0ms→220ms: opacity 0 → 1 (bg-black/55).",
            "panel": "0ms→460ms: transform-origin: calc(100% - 20px) 20px; transform: translate3d(0,-8px,0) scale(0.18); opacity: 0 → 1; then settle to scale(1) translate(0,0).",
            "micro": "At ~320ms, fade in inner content (opacity 0→1 over 150ms) to avoid text scaling artifacts."
          },
          "keyframes_close": {
            "panel": "0ms→320ms: content opacity 1→0 (first 120ms), then transform scale(0.18) translate3d(0,-8px,0) opacity 1→0.",
            "backdrop": "120ms→320ms: opacity 1→0."
          },
          "notes_ios_safari": [
            "Use 100dvh instead of 100vh to avoid Safari URL bar jumps.",
            "Use translate3d to force GPU compositing.",
            "Lock body scroll while open (overflow:hidden on body) and keep internal scroll within panel."
          ]
        },
        "desktop_anchored_panel": {
          "position": "Fixed panel anchored near avatar: top: headerHeight+8px; right: 16px; max-w: 420–520px; max-h: min(78vh, 720px).",
          "panel_geometry": "rounded-3xl glass-strong with stroke; subtle shadow + purple glow only on focus within.",
          "keyframes_open": {
            "backdrop": "Optional on desktop: very light backdrop (bg-black/25) 0→1 over 150ms OR none if you prefer click-outside only.",
            "panel": "0ms→320ms: transform-origin: top right (avatar center); transform: translate3d(0,-6px,0) scale(0.22); opacity 0→1; settle to scale(1)."
          },
          "keyframes_close": {
            "panel": "0ms→220ms: scale(0.22) translate3d(0,-6px,0) opacity 1→0",
            "backdrop": "0ms→220ms: opacity 1→0"
          }
        },
        "js_scaffold_for_origin": {
          "approach": "Measure avatar button bounding rect and set CSS vars for transform-origin.",
          "snippet": "// Vanilla JS\nconst avatarBtn = document.querySelector('[data-testid="header-profile-avatar-button"]');\nconst panel = document.querySelector('[data-testid="profile-module-panel"]');\n\nfunction setOriginVars() {\n  const r = avatarBtn.getBoundingClientRect();\n  // origin relative to viewport\n  document.documentElement.style.setProperty('--profile-origin-x', `${r.left + r.width/2}px`);\n  document.documentElement.style.setProperty('--profile-origin-y', `${r.top + r.height/2}px`);\n}\n\nwindow.addEventListener('resize', setOriginVars);\nwindow.addEventListener('scroll', setOriginVars, { passive: true });\n\n// When opening:\nsetOriginVars();\npanel.style.transformOrigin = `var(--profile-origin-x) var(--profile-origin-y)`;\n",
          "css_hook": "[data-testid='profile-module-panel']{ transform-origin: var(--profile-origin-x) var(--profile-origin-y); }"
        }
      },

      "structure_and_hierarchy": {
        "trigger": {
          "element": "Header avatar button (existing)",
          "requirements": [
            "Add aria-expanded and aria-controls",
            "data-testid=\"header-profile-avatar-button\""
          ]
        },
        "panel_shell": {
          "surface": "glass-strong + stroke + shadow",
          "close_affordances": [
            "Top-right close button inside panel (lucide: X) — always visible",
            "Tap backdrop to close",
            "Esc closes on desktop"
          ],
          "testids": {
            "panel": "profile-module-panel",
            "backdrop": "profile-module-backdrop",
            "close": "profile-module-close-button"
          }
        },
        "profile_header": {
          "layout": "Row: avatar (48) + name block + edit icon button; optional zodiac chip aligned right or under name.",
          "spacing": "p-4 pb-3",
          "nickname": "Manrope semibold, clamp-1",
          "edit": "Icon button (ghost) with hover glow-purple",
          "zodiac_chip": "Small pill badge with gold stroke (subtle), data-testid=\"profile-zodiac-chip\""
        },
        "internal_navigation_recommendation": {
          "recommended": "Segmented Tabs (Favorites / Playlists) pinned under header — best for replacing removed bottom-nav tabs without making the module too long.",
          "why": [
            "Users previously had separate tabs; segmented control preserves mental model.",
            "Keeps scroll manageable and avoids a mega-scroll sheet.",
            "Works well on desktop anchored panel with limited height."
          ],
          "component": "Use shadcn Tabs (src/components/ui/tabs.jsx) styling to match glass.",
          "tabs_testids": {
            "root": "profile-module-tabs",
            "favorites": "profile-module-tab-favorites",
            "playlists": "profile-module-tab-playlists"
          }
        }
      },

      "favorites_tab_layout": {
        "sections": [
          {
            "name": "Liked Tracks",
            "layout_mobile": "Compact list (ScrollArea) with 56px rows: tiny cover (40), title/artist, trailing play button.",
            "layout_desktop": "Same list; allow 2-line title clamp if needed.",
            "row_interactions": {
              "tap": "Row opens track detail / starts playback (your existing behavior)",
              "play_button": "Dedicated play/pause icon button",
              "like_toggle": "Heart icon (optional)"
            },
            "testids": {
              "list": "favorites-liked-tracks-list",
              "row": "favorites-liked-track-row",
              "play": "favorites-liked-track-play-button"
            }
          },
          {
            "name": "Favorite Lyrics",
            "layout_mobile": "2-column masonry-ish cards (not true masonry; use grid-cols-2 with variable text clamp).",
            "layout_desktop": "grid-cols-2 or 3 depending on width.",
            "card": {
              "surface": "glass rounded-2xl p-3",
              "content": "Lyric excerpt (clamp-3) + song/artist meta in Doto small",
              "actions": "Open lyric card, share, remove",
              "testid": "favorites-lyrics-card"
            }
          }
        ],
        "empty_loading_error": {
          "loading": "Skeleton list rows + skeleton lyric cards; data-testid=\"favorites-loading\"",
          "empty": {
            "copy": "‘No favorites yet.’",
            "cta": "Button ‘Browse Library’ (closes module and navigates)",
            "testid": "favorites-empty"
          },
          "error": {
            "copy": "‘Favorites failed to load.’",
            "cta": "Button ‘Retry’",
            "testid": "favorites-error"
          }
        }
      },

      "playlists_tab_layout": {
        "header_row": {
          "left": "Title ‘Playlists’",
          "right": "Create button (pill, purple glow on hover) with lucide: Plus",
          "testids": {
            "create": "playlists-create-button"
          }
        },
        "grid": {
          "mobile": "grid grid-cols-2 gap-3",
          "desktop": "grid-cols-2 (anchored panel) or 3 (if wider modal) gap-3",
          "playlist_card": {
            "surface": "glass rounded-2xl overflow-hidden",
            "thumb": "Square cover collage or single cover (aspect-square)",
            "meta": "Name (clamp-1) + track count in Doto",
            "hover": "lift + border brighten",
            "testid": "playlist-card"
          }
        },
        "empty_loading_error": {
          "loading": "Skeleton grid cards; data-testid=\"playlists-loading\"",
          "empty": {
            "copy": "‘No playlists yet.’",
            "cta": "Primary button ‘Create playlist’",
            "testid": "playlists-empty"
          },
          "error": {
            "copy": "‘Playlists failed to load.’",
            "cta": "Button ‘Retry’",
            "testid": "playlists-error"
          }
        }
      },

      "scroll_and_sizing": {
        "mobile": {
          "panel": "fixed inset-3 rounded-3xl h-[100dvh-24px] (use calc in CSS) with overflow-hidden",
          "internal_scroll": "Use ScrollArea for tab content; keep header + tabs sticky",
          "sticky": "Profile header + tabs: sticky top-0 with glass-strong background to prevent content bleed"
        },
        "desktop": {
          "panel": "fixed right-4 top-[72px] w-[460px] max-h-[72vh] overflow-hidden",
          "internal_scroll": "ScrollArea inside panel body"
        }
      },

      "bottom_nav_after_removal": {
        "new_items": ["Library", "Icons/Artists", "Game", "Settings"],
        "balance": {
          "rule": "4 items = perfect symmetry; increase hit area and spacing since fewer icons.",
          "layout": "grid grid-cols-4 gap-2 px-3",
          "hit_target": "min-h-[52px] per item; icon + label",
          "active_state": "purple glow underline or pill highlight; keep consistent with existing nav"
        },
        "testids": {
          "nav": "bottom-nav",
          "item": "bottom-nav-item"
        }
      }
    }
  },

  "component_path": {
    "shadcn_available": {
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "drawer": "/app/frontend/src/components/ui/drawer.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "avatar": "/app/frontend/src/components/ui/avatar.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "button": "/app/frontend/src/components/ui/button.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx"
    },
    "note": "Even though this app is Vanilla JS + Tailwind CDN, these paths indicate the closest existing primitives/patterns to mirror. If you are not importing React components, replicate their DOM structure + classes."
  },

  "instructions_to_main_agent": [
    "Do NOT change palette, fonts, or background/starfield system. Only implement layout/interaction/motion as specified.",
    "Component A: implement Direction 1 portrait peek row with snap scrolling; ensure it is visually distinct from the existing 16:9 hero carousel.",
    "Component B: implement avatar-origin expansion by measuring avatar rect and setting transform-origin via CSS vars; animate transform+opacity only with cubic-bezier(.22,1,.36,1).",
    "Use 100dvh on mobile for Safari; lock body scroll while module open.",
    "Add data-testid to every interactive element and key info text (titles, empty/error messages).",
    "Avoid transition: all; only transition opacity/background-color/border-color/box-shadow where needed (never transforms globally)."
  ],

  "image_urls": {
    "note": "No new imagery requested; Treesh’s Picks uses existing cover art assets."
  },

  "general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
