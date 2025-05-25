#!/user/bin/env bash
# Commit stuff
cd /etc/nixos/
nixos-rebuild build --flake /etc/nixos/#default
git add *
git commit -m "Update"

