{
  "design_system_extension": {
    "project": "Treesh 3.0 (extend existing dark premium system)",
    "non_negotiables": {
      "keep_existing": [
        "Near-black backgrounds (#0a0a0b / #121214) + subtle animated starfield canvas",
        "Primary accent purple via CSS var --treesh-purple (default #9328ff)",
        "Secondary accent gold via CSS var --treesh-gold (default #c3ab69)",
        "Glassmorphism panels: .glass / .glass-strong (blur 20–28px, translucent white stroke rgba(255,255,255,0.12–0.15))",
        "Fonts: Special Gothic Expanded One (display), Manrope (body), Doto (numeric)",
        "Generous rounding (rounded-2xl/3xl), soft shadow token --treesh-shadow, glow utilities glow-purple/glow-gold",
        "Lucide icons via data-lucide",
        "Existing motion easing cubic-bezier(.22,1,.36,1) + respects prefers-reduced-motion"
      ],
      "do_not_restyle": [
        "Library cards",
        "What’s New carousel",
        "Existing profile module"
      ],
      "constraints": [
        "Single index.html, Tailwind CDN utilities only",
        "No build step; extend only existing <style> block for tokens/keyframes",
        "Mobile-first; thumb reach priority",
        "Avoid iOS input zoom: inputs must be >=16px",
        "Accessibility: keyboard + reduced-motion must be preserved",
        "All interactive + key informational elements MUST include data-testid (kebab-case, role-based)"
      ]
    },

    "tokens_and_css_vars_to_add": {
      "where": "<style> block (extend existing tokens; do not replace)",
      "new_vars": {
        "--treesh-panel-ultra": "rgba(255,255,255,0.04)",
        "--treesh-stroke-faint": "rgba(255,255,255,0.10)",
        "--treesh-focus": "0 0 0 1px rgba(255,255,255,0.10), 0 0 0 4px rgba(147,40,255,0.28)",
        "--treesh-ease": "cubic-bezier(.22,1,.36,1)",
        "--treesh-dur-1": "140ms",
        "--treesh-dur-2": "220ms",
        "--treesh-dur-3": "420ms",
        "--treesh-safe-bottom": "env(safe-area-inset-bottom)",
        "--treesh-safe-top": "env(safe-area-inset-top)",
        "--treesh-karaoke-line-max": "22ch"
      },
      "utility_classes_to_define": {
        ".tap": "-webkit-tap-highlight-color: transparent;",
        ".focus-ring": "box-shadow: var(--treesh-focus); outline: none;",
        ".panel": "background: var(--treesh-panel); border: 1px solid var(--treesh-stroke); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: var(--treesh-shadow);",
        ".panel-strong": "background: var(--treesh-panel-strong); border: 1px solid var(--treesh-stroke); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px); box-shadow: var(--treesh-shadow);",
        ".panel-ultra": "background: var(--treesh-panel-ultra); border: 1px solid var(--treesh-stroke-faint); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);",
        ".treesh-press": "transition: transform var(--treesh-dur-1) var(--treesh-ease);",
        ".treesh-press:active": "transform: scale(0.98);",
        ".treesh-hover": "transition: background-color var(--treesh-dur-2) var(--treesh-ease), border-color var(--treesh-dur-2) var(--treesh-ease), box-shadow var(--treesh-dur-2) var(--treesh-ease);"
      },
      "keyframes_to_add": {
        "treesh-panel-in": "from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); }",
        "treesh-panel-out": "from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(10px) scale(0.98); }",
        "treesh-gauss-drift": "0%{transform:translate3d(-6%, -4%, 0) scale(1);} 50%{transform:translate3d(6%, 4%, 0) scale(1.06);} 100%{transform:translate3d(-6%, -4%, 0) scale(1);}",
        "treesh-karaoke-fill": "from { transform: scaleX(0); } to { transform: scaleX(1); }",
        "treesh-line-swap": "0%{opacity:0; transform:translateY(10px);} 100%{opacity:1; transform:translateY(0);}"
      }
    },

    "modules": {
      "1_song_metadata_modal": {
        "goal": "From Now Playing, tap an info button to open a premium credits/details modal with structured metadata.",
        "entry_point": {
          "now_playing_info_button": {
            "placement": "Top-right cluster in Now Playing header (same row as queue/share if present)",
            "tailwind": "h-10 w-10 rounded-2xl glass treesh-hover treesh-press flex items-center justify-center border border-white/10",
            "icon": "info",
            "a11y": {
              "aria_label": "Song info",
              "data_testid": "now-playing-open-metadata-button"
            }
          }
        },
        "overlay": {
          "backdrop": "fixed inset-0 bg-black/60 backdrop-blur-[2px]",
          "panel": "fixed left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl glass-strong shadow-[var(--treesh-shadow)]",
          "safe_area": "pt-[calc(14px+var(--treesh-safe-top))] pb-[calc(14px+var(--treesh-safe-bottom))]",
          "motion": {
            "open": "animate-[treesh-panel-in_var(--treesh-dur-3)_var(--treesh-ease)_both]",
            "close": "animate-[treesh-panel-out_var(--treesh-dur-2)_var(--treesh-ease)_both]",
            "reduced_motion": "disable animations"
          }
        },
        "layout": {
          "header": {
            "left": "Artwork thumb (48px) + title/artist",
            "right": "Close button",
            "title_font": "font-display uppercase tracking-[0.14em] text-[13px] text-white/90",
            "subtitle": "text-sm text-white/60"
          },
          "content": {
            "sections": [
              {
                "name": "Release",
                "rows": ["Date", "Album", "Label"]
              },
              {
                "name": "Credits",
                "rows": ["Artist", "Featured", "Producer", "Writer", "Engineer"]
              },
              {
                "name": "Technical",
                "rows": ["BPM", "Key", "Duration", "ISRC"]
              }
            ],
            "row_pattern": {
              "container": "flex items-start justify-between gap-4 py-3",
              "label": "text-xs uppercase tracking-widest text-white/45",
              "value": "text-sm text-white/85 text-right",
              "divider": "border-t border-white/10"
            }
          },
          "footer": {
            "actions": [
              {
                "label": "Copy credits",
                "tailwind": "w-full h-11 rounded-2xl glass treesh-hover treesh-press text-sm",
                "data_testid": "metadata-copy-credits-button"
              }
            ]
          }
        }
      },

      "2_fullscreen_search_overlay_bottom_input": {
        "goal": "Replace inline search with a button that opens a full-screen overlay. Input anchored at bottom for thumb reach; live results; segmented toggle; recent history chips.",
        "trigger_button": {
          "tailwind": "h-10 px-4 rounded-2xl glass treesh-hover treesh-press flex items-center gap-2",
          "icon": "search",
          "label": "Search",
          "data_testid": "open-search-overlay-button"
        },
        "overlay_shell": {
          "container": "fixed inset-0 z-[80]",
          "backdrop": "absolute inset-0 bg-black/70",
          "top_bar": {
            "tailwind": "absolute left-0 right-0 top-0 px-4 pt-[calc(14px+var(--treesh-safe-top))]",
            "content": "Close (X) + title 'Search' (display font)"
          },
          "results_area": {
            "tailwind": "absolute inset-x-0 top-[calc(56px+var(--treesh-safe-top))] bottom-[calc(120px+var(--treesh-safe-bottom))] px-4 overflow-y-auto soft-scroll",
            "empty_state": "Centered icon + 'Start typing' + recent chips"
          },
          "bottom_dock": {
            "tailwind": "absolute inset-x-0 bottom-0 px-4 pb-[calc(14px+var(--treesh-safe-bottom))]",
            "dock_panel": "rounded-3xl glass-strong border border-white/12 shadow-[var(--treesh-shadow)]",
            "stack": ["segmented toggle", "recent chips row", "input row"]
          }
        },
        "segmented_toggle": {
          "options": ["Songs", "Artists", "Lyrics"],
          "pattern": "Use a pill segmented control with sliding active indicator.",
          "container_tailwind": "grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/5 border border-white/10",
          "item_tailwind": "h-10 rounded-xl text-sm text-white/70 treesh-press",
          "active_item_tailwind": "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.10)]",
          "data_testids": {
            "songs": "search-toggle-songs",
            "artists": "search-toggle-artists",
            "lyrics": "search-toggle-lyrics"
          }
        },
        "recent_searches": {
          "title": "Recently searched",
          "chips_container": "flex gap-2 overflow-x-auto no-scrollbar py-2",
          "chip": {
            "tailwind": "shrink-0 px-3 h-9 rounded-2xl glass treesh-hover treesh-press text-sm text-white/80",
            "icon": "clock",
            "data_testid_prefix": "search-recent-chip"
          },
          "clear_action": {
            "tailwind": "text-xs text-white/50 hover:text-white/80 transition-colors",
            "data_testid": "search-recent-clear-button"
          }
        },
        "input_row": {
          "input": {
            "tailwind": "w-full h-12 rounded-2xl bg-white/7 border border-white/12 px-4 text-[16px] text-white placeholder:text-white/40 focus:outline-none focus:ring-0",
            "focus": "apply .focus-ring via class on focus (JS toggles) OR use ring utilities: focus-visible:ring-2 focus-visible:ring-[var(--treesh-purple)]/40",
            "data_testid": "search-overlay-input"
          },
          "submit_button": {
            "tailwind": "h-12 w-12 rounded-2xl bg-[var(--treesh-purple-soft)] border border-white/10 treesh-hover treesh-press flex items-center justify-center",
            "icon": "arrow-right",
            "data_testid": "search-overlay-submit-button"
          }
        },
        "result_row_patterns": {
          "song_row": {
            "tailwind": "flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors",
            "left": "artwork 44px rounded-xl",
            "middle": "title (clamp-1) + artist (clamp-1)",
            "right": "quick actions: play, add, info",
            "data_testid_prefix": "search-result-song"
          },
          "artist_row": {
            "tailwind": "flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors",
            "left": "avatar 40px",
            "middle": "name + small stat (followers/songs)",
            "data_testid_prefix": "search-result-artist"
          },
          "lyrics_row": {
            "tailwind": "p-3 rounded-2xl hover:bg-white/5 transition-colors",
            "top": "song title + artist",
            "snippet": "2-line clamp with highlighted query spans",
            "data_testid_prefix": "search-result-lyrics"
          }
        },
        "keyboard_behavior": {
          "notes": [
            "When keyboard opens, keep bottom dock visible: use visualViewport resize handler to set bottom offset.",
            "Ensure input is always >=16px to prevent iOS zoom.",
            "Esc closes overlay; focus trap within overlay."
          ]
        }
      },

      "3_settings_screen_redesign": {
        "goal": "Make Settings feel premium: profile card, accent presets grid + custom picker, voice help, and danger zone.",
        "page_layout": {
          "container": "px-4 pt-[calc(18px+var(--treesh-safe-top))] pb-[calc(24px+var(--treesh-safe-bottom))]",
          "max_width": "max-w-xl mx-auto",
          "section_spacing": "space-y-4"
        },
        "header": {
          "title": "font-display uppercase tracking-[0.14em] text-white/90 text-xl",
          "subtitle": "text-sm text-white/55"
        },
        "settings_cards": {
          "card": "rounded-3xl glass-strong p-4",
          "card_title": "text-xs uppercase tracking-widest text-white/50",
          "row": "flex items-center justify-between gap-3 py-3",
          "row_left": "icon in 36px rounded-2xl bg-white/6 border border-white/10",
          "row_right": "chevron or switch"
        },
        "accent_presets": {
          "spec": "Add more presets but keep Treesh vibe: purples + a few deep jewel alternates; gold stays secondary.",
          "grid": "grid grid-cols-4 gap-2",
          "swatch": {
            "tailwind": "h-12 rounded-2xl border border-white/12 treesh-press treesh-hover relative overflow-hidden",
            "selected": "ring-2 ring-[var(--treesh-purple)]/50",
            "data_testid_prefix": "settings-accent-swatch"
          },
          "preset_values": [
            {"name":"Treesh Purple","value":"#9328ff"},
            {"name":"Ultraviolet","value":"#7c3aed"},
            {"name":"Electric Iris","value":"#a855f7"},
            {"name":"Deep Orchid","value":"#b026ff"},
            {"name":"Indigo Night","value":"#5b5cff"},
            {"name":"Magenta Noir","value":"#ff2ea6"},
            {"name":"Crimson Velvet","value":"#ff3b5c"},
            {"name":"Emerald Pulse","value":"#22c55e"}
          ],
          "custom_picker": {
            "label": "Custom accent",
            "input_type": "color + hex text",
            "layout": "flex items-center gap-3",
            "color_input_tailwind": "h-12 w-12 rounded-2xl bg-white/5 border border-white/12",
            "hex_input_tailwind": "flex-1 h-12 rounded-2xl bg-white/7 border border-white/12 px-4 text-[16px] font-doto",
            "data_testids": {
              "color": "settings-custom-accent-color-input",
              "hex": "settings-custom-accent-hex-input",
              "apply": "settings-custom-accent-apply-button"
            }
          }
        },
        "voice_help": {
          "pattern": "Accordion list of commands with examples; keep it scannable.",
          "item": "rounded-2xl bg-white/5 border border-white/10",
          "data_testid": "settings-voice-commands-accordion"
        },
        "danger_zone": {
          "card": "rounded-3xl bg-red-500/10 border border-red-500/20 p-4",
          "button": "h-11 px-4 rounded-2xl bg-red-500/15 hover:bg-red-500/20 transition-colors text-red-100",
          "data_testid": "settings-danger-reset-button"
        }
      },

      "4_voice_assistant_listening_module_redesign": {
        "goal": "Fix positioning/cutoff; make listening overlay feel intentional and centered with safe-area support.",
        "overlay": {
          "container": "fixed inset-0 z-[90]",
          "backdrop": "absolute inset-0 bg-black/55",
          "panel": "absolute left-1/2 top-[calc(50%+var(--treesh-safe-top)/2)] -translate-x-1/2 -translate-y-1/2 w-[min(92vw,420px)] rounded-3xl glass-strong p-5",
          "safe_area": "ensure min top/bottom padding so it never clips on iPhone mini",
          "data_testid": "voice-listening-overlay"
        },
        "content": {
          "title": "font-display uppercase tracking-[0.14em] text-white/90 text-sm",
          "subtitle": "text-sm text-white/55",
          "mic_orb": {
            "size": "96px",
            "tailwind": "relative mx-auto mt-4 h-24 w-24 rounded-full bg-[var(--treesh-purple-soft)] border border-white/12 glow-purple",
            "pulse": "reuse existing .voice-pulse pseudo rings",
            "data_testid": "voice-listening-orb"
          },
          "live_transcript": {
            "tailwind": "mt-4 rounded-2xl bg-white/5 border border-white/10 p-3 text-sm text-white/75",
            "empty": "Show 'Listening…' with animated dots (respect reduced motion)",
            "data_testid": "voice-live-transcript"
          },
          "actions": {
            "row": "mt-4 grid grid-cols-2 gap-2",
            "cancel": "h-11 rounded-2xl glass treesh-hover treesh-press",
            "stop": "h-11 rounded-2xl bg-[var(--treesh-purple-soft)] border border-white/10 treesh-hover treesh-press",
            "data_testids": {
              "cancel": "voice-cancel-button",
              "stop": "voice-stop-button"
            }
          }
        }
      },

      "5_karaoke_mode_lyrics_stage": {
        "goal": "In Now Playing lyrics, add Karaoke mode: one line at a time centered; per-letter accent fill animation; beautiful line transitions.",
        "entry_toggle": {
          "placement": "Lyrics header right side (next to font size / scroll lock controls)",
          "tailwind": "h-10 px-3 rounded-2xl glass treesh-hover treesh-press flex items-center gap-2",
          "icon": "sparkles",
          "label": "Karaoke",
          "data_testid": "lyrics-karaoke-toggle"
        },
        "stage_layout": {
          "container": "relative h-[calc(100vh-160px)] flex items-center justify-center px-6",
          "line_wrapper": "max-w-[min(92vw,560px)] text-center",
          "line_text": "font-display uppercase tracking-[0.10em] text-3xl sm:text-4xl leading-tight",
          "line_max": "use max-width: var(--treesh-karaoke-line-max) to keep lines punchy",
          "hint": "Show next line faint below (optional)"
        },
        "per_letter_fill_implementation": {
          "approach": "Two-layer text + animated mask reveal (no heavy libs).",
          "markup_pattern": {
            "base": "<div class='karaoke-line'> <span class='karaoke-base'>...</span><span class='karaoke-fill' style='--p:0.42'>...</span></div>",
            "notes": [
              "karaoke-base is white/70",
              "karaoke-fill is accent-colored and clipped by a scaleX mask",
              "Update --p (0..1) over time based on audio currentTime / line timing"
            ]
          },
          "css": {
            ".karaoke-line": "position:relative; display:inline-block;",
            ".karaoke-base": "color: rgba(255,255,255,0.72);",
            ".karaoke-fill": "position:absolute; inset:0; color: var(--treesh-purple); transform-origin:left; transform: scaleX(var(--p)); will-change: transform;",
            "reduced_motion": "If prefers-reduced-motion, snap fill per word or per line (no continuous animation)."
          },
          "line_transition": {
            "enter": "animate-[treesh-line-swap_var(--treesh-dur-2)_var(--treesh-ease)_both]",
            "exit": "opacity-0 translate-y-2 (JS class swap)"
          }
        },
        "controls": {
          "bottom_controls": "Keep minimal: Exit karaoke, Seek -/+10, Font size",
          "tailwind": "fixed inset-x-0 bottom-0 px-4 pb-[calc(14px+var(--treesh-safe-bottom))]",
          "panel": "rounded-3xl glass-strong p-3",
          "data_testid": "karaoke-controls"
        }
      },

      "6_report_lyrics_and_inline_edit": {
        "goal": "Allow users to report lyrics and locally edit lines inline (saved locally).",
        "actions_bar": {
          "placement": "Lyrics view header or overflow menu",
          "buttons": [
            {
              "label": "Edit",
              "icon": "pencil",
              "tailwind": "h-10 px-3 rounded-2xl glass treesh-hover treesh-press",
              "data_testid": "lyrics-edit-toggle-button"
            },
            {
              "label": "Report",
              "icon": "flag",
              "tailwind": "h-10 px-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/7 transition-colors",
              "data_testid": "lyrics-report-button"
            }
          ]
        },
        "inline_editor": {
          "pattern": "Tap a line to edit; show textarea in-place; Save/Cancel row.",
          "line_container": "group rounded-2xl px-3 py-2 hover:bg-white/5 transition-colors",
          "textarea": "w-full min-h-[44px] rounded-2xl bg-white/7 border border-white/12 p-3 text-[16px] text-white/85",
          "actions": {
            "row": "mt-2 flex gap-2",
            "save": "h-10 px-4 rounded-2xl bg-[var(--treesh-purple-soft)] border border-white/10 treesh-hover treesh-press",
            "cancel": "h-10 px-4 rounded-2xl glass treesh-hover treesh-press",
            "data_testids": {
              "save": "lyrics-edit-save-button",
              "cancel": "lyrics-edit-cancel-button"
            }
          },
          "local_storage": {
            "key": "treesh.lyricsEdits.{songId}",
            "note": "Show 'Edited locally' badge (gold) when overrides exist."
          }
        },
        "report_modal": {
          "panel": "rounded-3xl glass-strong p-4",
          "fields": ["Reason select", "Optional note"],
          "submit": "Primary purple-soft button",
          "data_testid": "lyrics-report-modal"
        }
      },

      "7_song_dislike_button": {
        "goal": "Add a dislike control without clutter; consistent with like/favorite.",
        "placement": "Now Playing controls row (near like).",
        "button": {
          "tailwind": "h-10 w-10 rounded-2xl glass treesh-hover treesh-press flex items-center justify-center",
          "icon": "thumbs-down",
          "states": {
            "default": "text-white/70",
            "active": "text-[var(--treesh-gold)] glow-gold border-white/15",
            "disabled": "opacity-40"
          },
          "data_testid": "now-playing-dislike-button"
        },
        "microcopy": "Optional toast: 'We’ll play this less.'"
      },

      "8_game_mode_this_or_that": {
        "goal": "New tournament game: two songs head-to-head; like one/dislike other; 30s previews; elimination after 3 dislikes; genre filter; alternate lyrics variant; premium animated gaussian gradient background.",
        "game_hub_entry": {
          "card": "Use existing game hub card style; add a new tile with icon 'swords' or 'shuffle'.",
          "data_testid": "gamehub-this-or-that-card"
        },
        "gaussian_background": {
          "restriction": "Allowed here as decorative background; keep readability; do not exceed this screen only.",
          "implementation": {
            "layers": [
              {
                "name": "base",
                "tailwind": "absolute inset-0 bg-[#0a0a0b]"
              },
              {
                "name": "blobs",
                "html": "<div class='gauss gauss-a'></div><div class='gauss gauss-b'></div><div class='gauss gauss-c'></div>",
                "css": {
                  ".gauss": "position:absolute; width:60vmax; height:60vmax; filter: blur(42px); opacity:0.55; border-radius:9999px; mix-blend-mode: screen; animation: treesh-gauss-drift 10s var(--treesh-ease) infinite;",
                  ".gauss-a": "left:-20vmax; top:-18vmax; background: radial-gradient(circle at 30% 30%, rgba(147,40,255,0.55), transparent 60%);",
                  ".gauss-b": "right:-22vmax; top:10vmax; background: radial-gradient(circle at 30% 30%, rgba(195,171,105,0.40), transparent 62%); animation-duration: 12s;",
                  ".gauss-c": "left:10vmax; bottom:-26vmax; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.10), transparent 60%); animation-duration: 14s;"
                }
              },
              {
                "name": "grain",
                "tailwind": "pointer-events-none absolute inset-0 opacity-[0.10]",
                "note": "Use a tiny base64 noise PNG or CSS repeating-radial trick; keep subtle."
              }
            ]
          },
          "reduced_motion": "Stop drift animation; keep static blobs."
        },
        "screen_structure": {
          "container": "relative min-h-screen px-4 pt-[calc(16px+var(--treesh-safe-top))] pb-[calc(18px+var(--treesh-safe-bottom))]",
          "top_row": ["Back", "Mode toggle: Audio/Lyrics", "Genre filter"],
          "progress": {
            "pattern": "Bracket/progress pill with Doto numbers",
            "tailwind": "mt-3 rounded-2xl glass px-3 py-2 flex items-center justify-between",
            "data_testid": "this-or-that-progress"
          },
          "versus": {
            "layout": "Two stacked cards on mobile; side-by-side on >=sm",
            "grid": "grid gap-3 sm:grid-cols-2",
            "card": "rounded-3xl glass-strong p-4",
            "title": "font-display uppercase tracking-[0.12em] text-base text-white/90 clamp-1",
            "meta": "text-sm text-white/55",
            "preview": {
              "audio": "30s preview player with progress bar",
              "lyrics": "Show 4 random lines in a quote block"
            },
            "actions": {
              "like": "h-11 w-full rounded-2xl bg-[var(--treesh-purple-soft)] border border-white/10 treesh-hover treesh-press",
              "dislike": "h-11 w-full rounded-2xl bg-white/5 border border-white/10 hover:bg-white/7 transition-colors",
              "data_testid_prefix": "this-or-that-card"
            }
          },
          "king_of_hill": {
            "rule_ui": "Show small 'Dislikes: 2/3' meter on each card",
            "meter": "Use tiny progress bar (bg-white/10, fill gold)"
          },
          "champion_screen": {
            "hero": "Centered champion card + confetti-lite (subtle) + share button",
            "share": "Use Web Share API if available",
            "data_testid": "this-or-that-champion-screen"
          }
        },
        "genre_filter": {
          "ui": "Bottom sheet style selector (glass-strong) with chips",
          "chips": "px-3 h-9 rounded-2xl glass",
          "data_testid": "this-or-that-genre-filter"
        }
      }
    },

    "component_path": {
      "note": "App is vanilla JS + Tailwind CDN; shadcn paths listed only as conceptual references if needed elsewhere. Prefer existing Treesh modal/drawer patterns.",
      "shadcn_reference_only": [
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/drawer.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/toggle-group.jsx",
        "/app/frontend/src/components/ui/accordion.jsx",
        "/app/frontend/src/components/ui/sonner.jsx"
      ]
    },

    "instructions_to_main_agent": [
      "Do NOT introduce a new theme; extend Treesh tokens and reuse .glass/.glass-strong, glow utilities, and existing easing.",
      "Implement new overlays/modals with fixed positioning + safe-area padding; ensure nothing clips on iPhone (use env(safe-area-inset-*)).",
      "Search overlay: trigger is a button; overlay input must be bottom-docked; results scroll above it.",
      "All inputs must be text-[16px] or larger to avoid iOS zoom.",
      "Add data-testid to every interactive element and key info row (e.g., metadata values, progress indicators).",
      "Karaoke mode: implement two-layer text with scaleX mask driven by timing; respect prefers-reduced-motion by snapping fills.",
      "This-or-That: gaussian background is allowed only on game screens; keep text readable; stop animation for reduced motion.",
      "Avoid transition: all; only transition colors/shadows/opacity; keep transforms separate."
    ]
  },

  "general_ui_ux_design_guidelines": "    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.",

  "file_path": "/app/design_guidelines.md"
}
