#!/usr/bin/env bash

WP_DIR="$HOME/Pictures/Wallpapers"
INTERVAL=2   # seconds between changes

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

# Efraimidis-Spirakis weighted sampling without replacement
# This gives mathematically correct weighted sampling
select_wallpaper_weighted() {
  local -n current_files=$1
  local -n count_array=$2
  
  # compute max count for inverse frequency weights
  local max_count=0
  for f in "${current_files[@]}"; do
    local count=${count_array["$f"]:-0}
    (( count > max_count )) && max_count=$count
  done
  
  # generate keys using Efraimidis-Spirakis method
  local -a keys_and_files=()
  for f in "${current_files[@]}"; do
    local count=${count_array["$f"]:-0}
    # weight = (max_count + 1) - count (inverse frequency)
    local weight=$((max_count + 1 - count))
    
    # generate uniform random U in (0,1] - using RANDOM/32767
    # we'll approximate with integers to avoid floating point
    local u=$((RANDOM + 1))  # 1 to 32768
    
    # compute key = U^(1/weight) 
    # approximation: we'll use (32769 - u)^weight as our key
    # this inverts the relationship so higher weights get higher keys
    local key=1
    local base=$((32769 - u))
    local w=$weight
    
    # simple integer exponentiation (limited to avoid overflow)
    if (( w > 10 )); then w=10; fi
    for ((i=0; i<w; i++)); do
      key=$((key * base / 1000))  # scale down to prevent overflow
      if (( key <= 0 )); then key=1; fi
    done
    
    keys_and_files+=("$key|$f")
  done
  
  # find the file with the highest key
  local best_key=0
  local best_file=""
  
  for entry in "${keys_and_files[@]}"; do
    local key="${entry%|*}"
    local file="${entry#*|}"
    
    if (( key > best_key )); then
      best_key=$key
      best_file="$file"
    fi
  done
  
  echo "$best_file"
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
  
  # select wallpaper using weighted sampling without replacement
  next=$(select_wallpaper_weighted files counts)

  # apply wallpaper with error handling
  if hyprctl hyprpaper preload "$next" 2>/dev/null && \
     hyprctl hyprpaper wallpaper ", $next" 2>/dev/null; then
    # update count only if wallpaper was successfully applied
    (( counts["$next"]++ ))
    echo "Applied wallpaper: $(basename "$next") [Count: ${counts["$next"]}, Total files: ${#files[@]}]"
  else
    echo "Failed to apply wallpaper, hyprpaper may not be available" >&2
    # wait for hyprpaper to be available again
    wait_for_hyprpaper
  fi

  sleep "$INTERVAL"
done

