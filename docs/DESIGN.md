# Parity design system

Component register, routes and sources of truth: [`docs/SYSTEM.md`](./SYSTEM.md).

Source of truth: `:root` and `@theme inline` in `src/app/globals.css`, and
`AURA_THEMES` in `src/lib/aura.ts`. Tailwind v4, no config file. No animation
library: Embla moves the slides, CSS does the rest.

Design read: a consumer story deck for people who will screenshot it, in a
"Wrapped" register. Dark, high contrast, one big number per screen.

---

## Colour

### Ground and ink

| Token | Value | Use |
|---|---|---|
| `page` | `#0A0A0A` | landing ground, `<body>` |
| `ink` | `#F5F5F2` | primary text. Never `#FFFFFF` |
| `ink-muted` | `rgb(245 245 242 / .66)` | body copy, captions, eyebrows, footers |
| `ink-faint` | `rgb(245 245 242 / .14)` | hairlines, empty year blocks, chart grid |
| `brand` | `#FF3366` | landing CTA, selected mode pill, focus rings on the landing. Not inside the deck |
| `paper` / `paper-ink` | `#F2F1EC` / `#151515` | the receipt, and nothing else |
| `chart-surface` | `#161616` | the divergence chart's panel. The chart palette is validated against it |
| error | `#FF6B8A` | form error text and the invalid input border |
| dialog | `#121212` | the share dialog |

### Auras

The deck's colour is the verdict. A card's background and accent come from its
aura and nothing else; `--aura-bg`, `--aura-accent` and `--aura-on-accent` are
set on the card element and read by the `bg-aura`, `text-accent` and
`text-on-accent` utilities.

| Aura | Background | Accent | On accent | Burden ratio |
|---|---|---|---|---|
| crimson | `#0A0A0A` | `#FF3366` | `#0A0A0A` | > 1.25, severely harder |
| amber | `#0F172A` | `#FFB800` | `#0F172A` | > 1, harder |
| emerald | `#061E16` | `#10B981` | `#061E16` | <= 1, equal or easier |

The page behind the deck takes the **active** card's background with a 700ms
colour transition, so the room changes colour with the verdict. Each card also
paints its own background, so a half-dragged slide shows both honestly.

One accent per card. The hero stat, the emphasis marker, the "you" row of every
visual, and the selected toggle all use it. A second hue on a card is a bug.

### The chart palette

Categorical slots 1-4 of the dataviz reference palette, dark steps:

| Series | Colour |
|---|---|
| Min wage | `#3987E5` |
| Used car | `#D95926` |
| Earnings | `#199E70` |
| Home | `#C98500` |

Validated as a set against `#161616` (lightness band, chroma floor, CVD
separation, normal-vision floor, 3:1 contrast): all pass. The worst adjacent
pair is yellow and aqua at CVD delta E 8.4. The chart sits on its own
`chart-surface` panel so that the palette never meets an aura background it was
not validated against. Changing one colour means rerunning the validator for
all four.

---

## Type

**Geist and Geist Mono**, through `next/font/google` on the web and as committed
TTFs in the OG route. One family across the page and the PNG, so a shared image
looks like the thing it came from.

| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Hero stat | Geist | `clamp(3rem, 19cqi, 5.25rem)` | 600 | `leading .92`, `tracking-tighter`, accent. Container-query units, so it is sized by the card, not the window |
| Hero caption | Geist | 16px | 400 | `ink-muted`, directly under the stat |
| Mad-libs copy | Geist | 18px | 400 | `leading-snug`, `max-w-[34ch]`, `ink-muted` with emphasised spans in `ink` 600 |
| Eyebrow | Geist Mono | 11px | 400 | uppercase, `tracking .14em`, `ink-muted` |
| Source footer | Geist Mono | 10px | 400 | uppercase, `tracking .12em` |
| Visual labels | Geist Mono | 12px | 400 | label left in `ink-muted`, value right in `ink` |
| Landing headline | Geist | `text-4xl` to `text-5xl` | 600 | `leading 1.04`, `text-balance`, `max-w-[22ch]`, two lines at 1440 |
| Landing standfirst | Geist | 18px | 400 | `leading-relaxed`, `max-w-[46ch]` |
| Numbers in columns | inherit | | | `tabular-nums` on the receipt, the bento and the chart readout |

### Emphasis

An emphasised span in mad-libs copy is `ink`, weight 600, over a highlighter:
`linear-gradient(transparent 62%, accent at 38% 62%)`. It marks the variable,
the one thing in the sentence that is about you. Never more than three per card.

### Copy rules

- **22 words or fewer** of mad-libs per card. The hero and the visual carry the
  rest.
- **No em dash, no en dash.** Spaced hyphen for a break, hyphen for a range.
- **No terminal period in a heading or a hero stat.** Sentences in the copy end
  with one; `+0.8 YRS` does not.
- **The copy flips with the verdict.** "more years" becomes "fewer years",
  "more than a median paycheck" becomes "less than". There is no copy that only
  works for a deficit.
- **Numbers quote what is printed.** If the copy says 6.7 and 5.9, the hero says
  +0.8.
- Sentence case for every label and button on the deck; Title Case on the share
  dialog's actions (`Download PNG`, `Copy Link`), where each is a verb on an object.

---

## The card

Every card is `CardShell`, four layers top to bottom:

| Layer | What | Rule |
|---|---|---|
| 1. Eyebrow | `02 / HOUSING GRIND • 1996 VS 2026` | The one numbered label on the site. Orients the reader inside the story |
| 2. Hero | the stat and its caption | One number. A ratio, a percentage, years or hours, never a sentence |
| 3. Copy | mad-libs | Explains the hero in the reader's own figures |
| 4. Visual + footer | the micro-visual, then the source line | The visual is centred in the space left; the source is always last |

Padding `px-6`, `pt-20` (clears the progress bars and header), `pb` at least 24px
or the safe-area inset.

### The seven visuals

| Card | Visual | Encodes |
|---|---|---|
| 1 Dollar | two notes, `$1.00` then and what it buys now | width is value; the label sits beside the note, never inside, so a 1965 note at 17% still reads |
| 2 Housing | year blocks, one per year of saving | partial last block filled to its fraction; capped at 36 blocks with a `+` |
| 3 Groceries | the labour-hour receipt | minutes of work as the big number, dollars small under it |
| 4 Land | dot matrix | one dot per 100 hours, or per 1,000 when either side passes 16,000; capped at 160 dots with `+N` |
| 5 Wages vs wheels | Base 100 divergence chart | four series from the benchmark year to now |
| 6 Retirement | two bars, ages 20 to 80 | solid career block, dashed retirement remainder |
| 7 Summary | 2x2 bento | four headline figures, one tile filled with the accent |

### The receipt

Thermal-paper object on `paper`, mono throughout, dashed rules only between
header, body and total - not under every row. A segmented toggle above it
switches the wage basis (`My wage`, `Median wage`, `Minimum wage`); the selected
segment takes the accent. The benchmark-year column always uses that year's
average wage for `My wage`, because there was no "you" then, and the wage line
under the total says which wages were used.

### The divergence chart

| Rule | Value |
|---|---|
| index | every series is 100 in the benchmark year |
| marks | 2px lines, round joins; 4px dots at the crosshair with a 2px surface ring |
| grid | `ink-faint` hairlines at nice ticks; y labels at 9px |
| labels | direct labels at the line ends, de-collided to an 11px minimum gap, in `ink` |
| legend | chips above the chart that are also toggles; at least one series stays on. Colour follows the series, so hiding one never repaints another |
| readout | above the plot: the year, then each series' growth, value first, label after |
| scrub | pointer anywhere on the plot, or arrow keys when it has focus |
| drag | the chart is `data-no-drag`, so scrubbing it does not swipe the deck |
| table | an `sr-only` table of every year and series |

---

## The deck

| Part | Value |
|---|---|
| frame, phone | full bleed, `100dvh` |
| frame, desktop | `aspect-[9/16]`, `min(100dvh - 3rem, 880px)` tall, `24px` radius, 1px `ink-faint` ring, a deep shadow |
| progress | seven 3px segments, `ink/25` ground, `ink` fill |
| header | mode select, share, pause (while autoplaying), close. Over the card, `pointer-events-none` except the controls |
| tap zones | the whole card: left 30% back, right 70% forward. Controls inside the card are excluded |
| desktop arrows | 48px round buttons either side of the frame |

### Autoplay

| Rule | Value |
|---|---|
| per card | 8s, the active segment fills linearly |
| stops | for good, on the first swipe, tap, key or button by the person |
| pauses | while a press is held, while the share dialog is open, or by the pause control |
| ends | on card 7; it does not loop |
| reduced motion | never starts; every segment up to the current one is simply full |

Autoplay is the story being told; the first time someone takes control, it is
theirs.

---

## The landing page

| Part | Value |
|---|---|
| layout | `lg`: `1.3fr / 0.7fr` grid, copy and form left, preview right. One column below `lg` |
| wordmark | `Parity.` with the full stop in `brand`; `translate="no"` |
| hero stack | headline, standfirst, form. Nothing else above the fold |
| form | labels above inputs, `12px` radius, `ink/6%` fill, errors below in `#FF6B8A`, the first invalid field focused on load |
| income | live thousands separators; a hidden `inc` input carries the digits |
| mode | four pills, radio inputs inside labels; the selected one is filled `brand` |
| CTA | one: `Compare`, a `brand` pill. The quick-try pills below it are links to finished stories, not a second ask |
| preview | two real cards, card 1 behind at `5deg` and 60% opacity, card 2 in front at `-3deg`. Rendered `inert` and `aria-hidden` |

---

## The share dialog

| Part | Value |
|---|---|
| shell | native `<dialog>`, `24px` radius, `#121212`, 1px `ink-faint` ring, a blurred black backdrop |
| format | segmented `9:16 Story` / `16:9 Post`; the post is 1200x630, the OG standard, not literally 16:9 |
| preview | the real PNG at its own ratio, `16px` radius, at most 48% of the viewport tall |
| loading | a pulsing panel at the image's exact ratio; the image fades in over 300ms |
| error | the panel says the preview did not load and points at Download |
| actions | `Share Image` (only where the browser can share files), `Copy Image` (only where `ClipboardItem` exists), `Download PNG` (always, a real link), `Copy Link` (always) |
| status | a polite live line under the actions: "Image copied to clipboard" |
| close | Escape, the close button, or a click on the backdrop |

The first action shown is the best one the device has: native share on a phone,
copy on a desktop that cannot share files.

---

## The OG images

`src/app/api/og/card/og-card.tsx`. The same layers and visuals as the web card,
rewritten for Satori.

| | Story | Social |
|---|---|---|
| size | 1080x1920 | 1200x630 |
| layout | one column | text left (560px), visual right (480px), 48px apart |
| padding | 96 | 56 |
| eyebrow | 28px mono | 16px mono |
| hero | up to 230px | up to 116px |
| copy | 52px | 27px |
| visual scale | x2.6 of the phone visual | x1.4 |

- **The hero shrinks to fit.** Its size is `min(max, width / (characters x
  0.58))`, so `3,683 HRS` and `+14,312%` both stay on one line.
- **Copy is laid out word by word**, because Satori cannot wrap across sibling
  spans. A space is a trailing margin on the word before it, which disappears at
  a line end instead of indenting the next line.
- The receipt always uses the person's own wage; there is no toggle in a PNG.
- The chart drops its axis labels (Satori does not render SVG text) and carries
  each series' growth in the legend instead.

---

## Radius

**Object type sets it.**

| Object | Radius |
|---|---|
| Card frame (desktop), share dialog | `24px` |
| Share preview | `16px` |
| Bento tile, chart panel, input | `12px` |
| Dollar note | `8px` |
| Receipt paper, retirement bar ends | `6px` |
| Year block | `3px` |
| Buttons, pills, toggles, progress segments, header controls | `999px` |

---

## Motion

| What | Value |
|---|---|
| aura behind the deck | `background-color` 700ms |
| progress fill | `scaleX` 0 to 1, linear, 8s |
| slide | Embla's own, on swipe, tap, key or autoplay |
| share preview | opacity 300ms once loaded |
| press | `scale .98` on CTAs, quick-try pills and share actions, `.95` on the desktop arrows |
| chart chips | opacity, on toggle |

Rules:

- **No entrance animations.** No card fades in, no number counts up. The
  information is there at frame zero, which is also what a screenshot gets.
- **No `whileInView`.**
- Only `transform`, `opacity` and colour are animated.
- `prefers-reduced-motion` sets every transition to effectively zero and stops
  autoplay. Nothing is lost: the content never lived in the motion.

---

## Checklist

Before shipping a change someone can see:

1. Does every new string pass the copy rules (22 words, no dashes, flips with
   the verdict)?
2. Is there exactly one accent on the card, and is it the aura's?
3. Does the hero still agree with the numbers in the copy?
4. Measured at 390x844 and 1440x900: no horizontal scroll, nothing clipped,
   including a $10,000,000 income against 1965?
5. Does the PNG for the same card say the same thing, in both formats?
6. If a chart colour moved, did the validator run again?
7. Does it still work with reduced motion on, and with a keyboard only?
