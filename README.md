# causalgame.github.io

Website for **CausalGame: Benchmarking Causal Thinking of LLM Agents in Games**
(ICML 2026, Oral) — paper page, leaderboard, and benchmark documentation.

Live at <https://causalgame.github.io>.

## Stack

- [Astro](https://astro.build) static site, React island for the interactive leaderboard
- Deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## Updating the leaderboard

`src/data/leaderboard.json` is the single data file behind the leaderboard and the
home-page preview. It is generated from the camera-ready paper tables — regenerate it
with the private-side export script and commit the new JSON; do not edit numbers by
hand.

## Benchmark code

The benchmark itself (simulation engine, agent harness, scenario configs) lives at
<https://github.com/viewsetting/CausalGame>.
