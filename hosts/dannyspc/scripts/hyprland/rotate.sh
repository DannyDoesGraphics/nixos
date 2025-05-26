#!/usr/bin/env bash
set -euo pipefail

WP_DIR="$HOME/Pictures/Wallpapers"
CACHE="$HOME/.cache/wallpaper-counts.db"
INTERVAL=10   # seconds between changes

# ensure directory exists
[[ -d "$WP_DIR" ]] || {
  echo "Wallpapers directory not found: $WP_DIR" >&2
  exit 1
}

# get list of image files
mapfile -t files < <(
  find "$WP_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \)
)

(( ${#files[@]} )) || {
  echo "No images found in $WP_DIR" >&2
  exit 1
}

# declare associative array for counts
declare -A counts

# load existing counts
if [[ -f "$CACHE" ]]; then
  while IFS='|' read -r path cnt; do
    counts["$path"]=$cnt
  done < "$CACHE"
fi

# ensure every file has a count
for f in "${files[@]}"; do
  [[ -v counts["$f"] ]] || counts["$f"]=0
done

while true; do
  # recompute Cmax
  Cmax=0
  for cnt in "${counts[@]}"; do
    (( cnt > Cmax )) && Cmax=$cnt
  done

  # build weights
  weights=()
  for f in "${files[@]}"; do
    # weight = (Cmax - Ci) + 1
    weights+=( $(( (Cmax - counts["$f"]) + 1 )) )
  done

  # pick one by weighted random
  total=0
  for w in "${weights[@]}"; do (( total += w )); done
  pick=$(( RANDOM % total ))

  for i in "${!files[@]}"; do
    (( pick < weights[i] )) && {
      next="${files[i]}"
      break
    }
    (( pick -= weights[i] ))
  done

  # apply wallpaper
  hyprctl hyprpaper preload "$next"
  hyprctl hyprpaper wallpaper ", $next"

  # update count
  (( counts["$next"]++ ))

  # write back counts
  {
    for path in "${!counts[@]}"; do
      echo "$path|${counts[$path]}"
    done
  } > "$CACHE"

  sleep "$INTERVAL"
done

