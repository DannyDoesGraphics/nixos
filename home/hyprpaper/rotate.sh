#!/usr/bin/env bash
WP_DIR="$HOME/Pictures/Wallpapers"
if [ ! -d "$WP_DIR" ]; then
  echo "Wallpapers directory not found: $WP_DIR" >&2
  exit 1
fi

mapfile -d '' files < <(find "$WP_DIR" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)
last_file=""

while true; do
  if [ "${#files[@]}" -eq 0 ]; then
    echo "No images found in $WP_DIR" >&2
    exit 1
  fi

  # Shuffle files, ensuring the first isn't the same as the last shown
  shuffled=()
  while true; do
    shuffled=($(printf "%s\n" "${files[@]}" | shuf))
    if [ "${shuffled[0]}" != "$last_file" ] || [ "${#files[@]}" -eq 1 ]; then
      break
    fi
  done

  for file in "${shuffled[@]}"; do
    hyprctl hyprpaper preload "$file"
    hyprctl hyprpaper wallpaper ", $file"
    last_file="$file"
    sleep 10
  done
done
