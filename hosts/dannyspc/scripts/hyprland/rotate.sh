#!/usr/bin/env bash

WP_DIR="$HOME/Pictures/Wallpapers"
INTERVAL=60   # seconds between changes

# wait for hyprpaper to be available
wait_for_hyprpaper() {
  echo "Waiting for hyprpaper to be available..."
  while ! hyprctl hyprpaper listloaded &>/dev/null; do
    sleep 1
  done
  echo "hyprpaper is now available"
}

# ensure directory exists
[[ -d "$WP_DIR" ]] || {
  echo "Wallpapers directory not found: $WP_DIR" >&2
  exit 1
}

# function to get current list of image files
get_wallpaper_files() {
  local -n file_array=$1
  mapfile -t file_array < <(
    find "$WP_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \)
  )
}

# function to update counts when files change
update_counts_for_files() {
  local -n current_files=$1
  local -n count_array=$2
  
  # create a temporary associative array for new counts
  declare -A new_counts
  
  # preserve counts for files that still exist
  for f in "${current_files[@]}"; do
    if [[ -v count_array["$f"] ]]; then
      new_counts["$f"]=${count_array["$f"]}
    else
      new_counts["$f"]=0
    fi
  done
  
  # replace the original counts array
  count_array=()
  for f in "${current_files[@]}"; do
    count_array["$f"]=${new_counts["$f"]}
  done
}

# declare associative array for counts (no cache persistence)
declare -A counts

# wait for hyprpaper to be ready
wait_for_hyprpaper

while true; do
  # refresh file list to handle added/removed wallpapers
  get_wallpaper_files files
  
  # check if we have any wallpapers
  if (( ${#files[@]} == 0 )); then
    echo "No images found in $WP_DIR, waiting..." >&2
    sleep "$INTERVAL"
    continue
  fi
  
  # update counts for current file list
  update_counts_for_files files counts
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

  # apply wallpaper with error handling
  if hyprctl hyprpaper preload "$next" 2>/dev/null && \
     hyprctl hyprpaper wallpaper ", $next" 2>/dev/null; then
    # update count only if wallpaper was successfully applied
    (( counts["$next"]++ ))
    echo "Applied wallpaper: $(basename "$next")"
  else
    echo "Failed to apply wallpaper, hyprpaper may not be available" >&2
    # wait for hyprpaper to be available again
    wait_for_hyprpaper
  fi

  sleep "$INTERVAL"
done

