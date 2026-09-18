# Kura — Recommendation Engine: Recommendations & Actions

This is the single reference for every recommendation/action the app can give a
user — what triggers it, who it applies to, and the exact plain-English copy
shown on the task card. It exists so the full lawn-care content can be
reviewed in one place, separate from the engine's architecture (schema, Edge
Function, client wiring), which lives in
`docs/superpowers/specs/2026-05-11-recommendation-engine-design.md`.

**Status:** both warm-season and cool-season grass are fully worked out,
start to end of season. Grass type inference (below) is settled and
unrelated to season progress.

---

## How a recommendation fires (short version)

A daily Edge Function fetches each user's soil temperature (6cm depth, from
Open-Meteo) and compares it against the thresholds below. When a threshold is
crossed, it inserts a row into `recommendation_events` and sends a push
notification. The user sees a task card with the copy below and two choices:
confirm ("got it") or snooze ("remind me later"). Full mechanics are in the
design spec linked above.

---

## Universal recommendations (fire for every user, any grass type)

### `mower_blade_sharpen` — 45°F, rising

Fires once per season when soil temp first reaches 45°F, regardless of
`grass_type`. This is the very first thing a user ever sees each season —
before that, no recommendations fire at all (the lawn is dormant and there's
nothing to tell the user).

> **🔧 Sharpen your mower blade**
>
> Soil's warming up — mowing season is on its way. Now's the time to get your
> blade sharp before you need it.
>
> A dull blade rips grass instead of cutting it cleanly, which leaves ragged,
> brown-tipped tips that are more likely to get sick or dry out.
>
> **Our tip:** if you can, pick up one extra blade for every month you'll be
> mowing this season, and get them all sharpened at the same time — most
> sharpening shops charge less per blade when you bring in several at once.
> Then swap in a fresh one each month, so you're always cutting with a sharp
> edge without a monthly trip to the shop.
>
> Only have one blade? No problem — just get that one re-sharpened once a
> month instead.

Yes/No: "Got it, I'll sharpen my blade" / "Remind me later" (snooze). Never
asks the user how many blades they own — it's one-time guidance, not tracked
data.

---

## Warm-season grass (bermuda, zoysia, St. Augustine, centipede) — complete

Full season, in order. **Direction** shows whether a threshold fires on the
way up (spring warm-up) or the way down (fall cool-down) — several thresholds
share a temperature but mean different things depending on direction.

| # | Soil temp | Direction | Type | What's happening | Action |
|---|---|---|---|---|---|
| 1 | 45°F | Rising | `mower_blade_sharpen` (universal, see above) | Warming up, mowing season approaching | Sharpen blade now |
| 2 | 50–55°F | Rising | `pre_emergent` | Pre-emergent window opens; crabgrass germination begins | Apply pre-emergent herbicide (standalone, without heavy nitrogen) |
| 3 | 65°F | Rising | `fertilize, water, mow` | Grasses fully awake | First fertilizer application |
| 4 | 65–90°F | Rising/holding | `fertilize, water, mow` | Peak growth | Continue warm-season feeding program |
| 5 | 91–95°F | Rising | `heat_prep` | Pre-stress period | Raise mow height, confirm watering amount, ease off fertilizer timing |
| 6 | 95–100°F | Rising | `heat_stress` | Stress period, growth slows | Water deeply as normal, fertilize at half rate, mow less often |
| 7 | 100°F+ | Rising | `drought` | Drought / survival mode | Stop fertilizing, mow only if needed, extra watering day if locally permitted |
| 8 | Below 70°F | Falling | `fertilize_stop` | Growth slowing toward dormancy | No more fertilizer for the season |
| 9 | 55°F and below | Falling | `dormant` | Fully dormant for winter | No mowing, no fertilizing, no scheduled watering |

Falling back out of a heat stage (e.g. 100°F+ drought cooling back into
65–90°F) is not silent — the `fertilize, water, mow` card re-fires to let
the user know they're back in the normal feeding window. Rows 2 and 3/4
use terse action-column copy only; rows 5–9 have full card copy below.

### Card copy

**`heat_prep` — "Get ahead of the heat"** (91–95°F)
> Soil's heading into a stressful range for your lawn. A few adjustments now
> will help it handle the heat that's coming.
>
> - **Raise your mowing height to 3–4 inches.** Taller grass shades its own
>   roots and holds onto moisture better.
> - **Water about 1 inch a week.** That's enough — no need to add extra just
>   because it's getting hot.
> - **Still okay to fertilize**, but skip it if a heat wave is about to hit —
>   fertilizing right before one can stress the grass further.

**`heat_stress` — "Your lawn is under heat stress"** (95–100°F)
> Growth slows down in this heat, so your lawn needs less than usual right
> now — not more.
>
> - **Keep watering deeply, same as before** — about 1 inch a week, no
>   change.
> - **Cut your fertilizer to half the normal amount.** Growth has slowed, so
>   it can't use a full dose.
> - **Mow less often.** Slower growth means it won't need cutting as
>   frequently.

**`drought` — "Drought conditions — protect what you have"** (100°F+)
> This heat puts your lawn in survival mode. The goal now is to protect it,
> not push growth.
>
> - **Stop fertilizing** until temperatures come back down.
> - **Mow only when the grass actually needs it.**
> - **Check your local watering rules.** Many cities and counties restrict
>   watering during droughts — if yours allows an extra day, adding one can
>   help your lawn get through this stretch.

**`fertilize_stop` — "Last call for fertilizer this season"** (below 70°F, falling)
> Soil's cooling back down below 70°F, and your lawn's growth is slowing for
> the year. Fertilizing now would push out tender new growth right before
> frost — and that new growth is the first thing cold weather damages, which
> weakens your lawn heading into winter.
>
> **Stop fertilizing now.** Your lawn doesn't need it again until things warm
> back up in spring.

**`dormant` — "Your lawn has gone dormant for the season"** (55°F and below, falling)
> Soil's dropped to 55°F and below — your grass has stopped actively growing
> and turned brown for the winter. That's completely normal, not a sign it's
> dying. It's just conserving energy until it warms back up in spring.
>
> - **No need to mow** unless you're clearing fallen leaves or debris.
> - **No need to fertilize** — the lawn can't use it while dormant.
> - **No need to water on a schedule.** Dormant grass needs very little
>   moisture.

---

## Cool-season grass — complete

Full season, in order. Same **Direction** convention as warm-season — a
threshold fires on the way up (spring warm-up) or the way down (fall
cool-down).

| # | Soil temp | Direction | Type | What's happening | Action |
|---|---|---|---|---|---|
| 1 | 40–45°F | Rising | — (internal only, no card) | Root growth begins | Too early for fertilizer; roots growing but shoots dormant |
| 2 | 50°F | Rising | `pre_emergent` | Pre-emergent window opens; grass breaking dormancy | Apply pre-emergent herbicide (standalone, without heavy nitrogen) |
| 3 | 55°F | Rising | `fertilize, water, mow` | Actively growing; crabgrass germination begins | First spring fertilizer window |
| 4 | 55–65°F | Rising/holding | `fertilize, water, mow` | Optimal growth range | Primary fertilizer window; slow-release nitrogen most effective |
| 5 | 77–80°F | Rising | `heat_stress` | Root growth stops; heat-stressed | Raise mow height, hold watering steady, stop fertilizing, stay off the lawn |
| 6 | 50–45°F | Falling | `winterizer` | Cooling toward dormancy | Apply a winterizer fertilizer |
| 7 | Below 45°F | Falling | `fertilize_stop` | Approaching dormancy | No more fertilizer until spring |
| 8 | Below 40°F | Falling | `dormant` | Fully dormant for winter | No mowing, no fertilizing, no scheduled watering |

Falling back out of `heat_stress` (77–80°F cooling back into 55–65°F) is
**not silent** — the `fertilize, water, mow` card re-fires, same as
warm-season. `winterizer`, `fertilize_stop`, and `dormant` are a **one-way
trip**: once fired, none of them re-fire or reverse on a temperature bounce
back up — fall only moves toward dormancy, it doesn't undo itself for a
warm week. Rows 2–4 use terse action-column copy only; rows 5–8 have full
card copy below.

### Card copy

**`heat_stress` — "Your lawn is under heat stress"** (77–80°F, rising)
> Cool-season grass slows down and can go semi-dormant once soil gets this
> warm — it's built for cooler weather, so this range is genuinely stressful
> for it.
>
> - **Raise your mowing height to 3–4 inches.** Taller grass shades its own
>   roots and holds onto moisture better through the heat.
> - **Keep watering on your normal schedule — about 1 inch a week.** No need
>   to add extra, just stick with what you've been doing (unless your area
>   has drought restrictions in place, in which case follow those).
> - **Stop fertilizing.** We'll let you know when it's time to start again.
> - **Stay off the lawn when you can.** Stressed grass bruises and thins more
>   easily under foot traffic in this range.

**`winterizer` — "Time for your last fertilizer application"** (50–45°F, falling)
> Soil's cooling down and your lawn is getting ready for winter. This is the
> last feeding of the season, but it's an important one — it uses a
> different kind of fertilizer than what you've been using.
>
> - **Apply a winterizer fertilizer** (look for "winterizer" or "fall
>   fertilizer" on the bag). It's higher in potassium and lower in nitrogen
>   — that helps the grass store energy in its roots for winter instead of
>   pushing new green growth right before a freeze.
> - **Water it in lightly after applying**, about a quarter inch, so it
>   soaks down to the roots.
> - **This is the last fertilizer application until spring.** After this,
>   hold off until we let you know it's time to start again.

**`fertilize_stop` — "No more fertilizer this season"** (below 45°F, falling)
> Soil's dropped below 45°F. Fertilizing now would actually hurt your lawn —
> it can force out tender new growth right when a hard freeze is likely, and
> that new growth is the first thing the cold kills. It weakens your lawn
> heading into winter instead of helping it.
>
> - **Don't fertilize again until spring.** We'll let you know when it's
>   time to start.
> - **If you missed your winterizer application, skip it now** — it's too
>   late in the season for it to help. Just wait for spring instead of
>   trying to catch up.
> - **Keep mowing if the grass is still growing at all**, but expect that to
>   taper off soon.

**`dormant` — "Your lawn has gone dormant for the season"** (below 40°F, falling)
> Soil's dropped below 40°F — your grass may have turned brown for the
> winter. That's completely normal, not a sign it's dying. It's just
> conserving energy until it warms back up in spring.
>
> - **No need to mow** unless you're clearing fallen leaves or debris.
> - **No need to fertilize** — the lawn can't use it while dormant.
> - **No need to water on a schedule.** Dormant grass needs very little
>   moisture.

---

## Grass type inference (not soil-temp-triggered, but a recommendation)

Shown once, at onboarding, only when a user picks "I'm not sure" for their
grass type:

1. Geocode their ZIP → lat/lng.
2. Infer grass type from latitude: **≥ 37°N → cool-season**, **< 37°N →
   warm-season**.
3. Show it as a suggestion, not an auto-applied fact: *"Based on your
   location, we think you have cool-season grass. Does that sound right?"*
4. User confirms or overrides.
5. After confirming: *"You can change this in Settings if you discover your
   grass type is different."*

The recommendation engine never runs for a user whose grass type is
unresolved. Full state list for the 37°N line is in the design spec.

---

## Not yet started

- Any grass-type-specific variations within warm-season (e.g. bermuda vs.
  St. Augustine vs. centipede) — currently all three are treated identically.
  Same question applies to cool-season (e.g. tall fescue vs. Kentucky
  bluegrass vs. perennial ryegrass) — currently all treated identically.
- Effort-tier gating (`min_effort_level`) interaction with these
  recommendations — do heat-stress/drought cards apply regardless of effort
  tier, or only at tier 2+? Not decided yet.
