# Benchmarks

All benchmarks run with `bun --expose-gc` on Intel i5-4310M @ 2.70GHz.

## Scripts

- `bun run bench` — hybrid vs infinibrowser (fast, ~30s per savefile)
- `bun run bench:catstone` — catstone only (slow, up to minutes per savefile)
- `bun run bench:init` — depth precomputation for all implementations

Results are saved as `.txt` files in `benchmarks/results/` with timestamp filenames.
