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

# function to update reservoir when files change
update_reservoir_for_files() {
  local -n current_files=$1
  local -n reservoir_array=$2
  
  # remove files from reservoir that no longer exist
  local temp_reservoir=()
  for f in "${reservoir_array[@]}"; do
    # check if file still exists in current files
    for current_f in "${current_files[@]}"; do
      if [[ "$f" == "$current_f" ]]; then
        temp_reservoir+=("$f")
        break
      fi
    done
  done
  
  # update reservoir with filtered list
  reservoir_array=("${temp_reservoir[@]}")
}

# reservoir sampling selection
select_wallpaper_reservoir() {
  local -n current_files=$1
  local -n reservoir_array=$2
  local reservoir_size=$3
  
  # if reservoir is not full, pick from unused files first
  if (( ${#reservoir_array[@]} < reservoir_size )); then
    # find files not in reservoir
    local unused_files=()
    for f in "${current_files[@]}"; do
      local in_reservoir=false
      for r in "${reservoir_array[@]}"; do
        if [[ "$f" == "$r" ]]; then
          in_reservoir=true
          break
        fi
      done
      [[ "$in_reservoir" == false ]] && unused_files+=("$f")
    done
    
    # if we have unused files, pick one randomly
    if (( ${#unused_files[@]} > 0 )); then
      echo "${unused_files[RANDOM % ${#unused_files[@]}]}"
      return
    fi
  fi
  
  # reservoir is full or no unused files, use reservoir sampling
  # pick a random file from all files
  local selected="${current_files[RANDOM % ${#current_files[@]}]}"
  
  # with probability k/n, replace a random item in reservoir
  local k=${#reservoir_array[@]}
  local n=${#current_files[@]}
  
  if (( k < reservoir_size && RANDOM % n < reservoir_size )); then
    # reservoir not full, just add
    reservoir_array+=("$selected")
  elif (( RANDOM % n < k )); then
    # replace random item in reservoir
    local replace_idx=$((RANDOM % k))
    reservoir_array[replace_idx]="$selected"
  fi
  
  echo "$selected"
}

# declare reservoir array for recently used wallpapers
declare -a reservoir
# reservoir size as percentage of total files (minimum 5, maximum 50)
reservoir_size=10

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
  
  # adjust reservoir size based on number of files
  local adaptive_reservoir_size=$((${#files[@]} / 3))
  (( adaptive_reservoir_size < 5 )) && adaptive_reservoir_size=5
  (( adaptive_reservoir_size > 50 )) && adaptive_reservoir_size=50
  reservoir_size=$adaptive_reservoir_size
  
  # update reservoir for current file list
  update_reservoir_for_files files reservoir
  
  # select wallpaper using reservoir sampling
  next=$(select_wallpaper_reservoir files reservoir "$reservoir_size")

  # apply wallpaper with error handling
  if hyprctl hyprpaper preload "$next" 2>/dev/null && \
     hyprctl hyprpaper wallpaper ", $next" 2>/dev/null; then
    echo "Applied wallpaper: $(basename "$next") [Reservoir size: ${#reservoir[@]}/$reservoir_size]"
  else
    echo "Failed to apply wallpaper, hyprpaper may not be available" >&2
    # wait for hyprpaper to be available again
    wait_for_hyprpaper
  fi

  sleep "$INTERVAL"
done

