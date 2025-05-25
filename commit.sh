#!/user/bin/env bash
# Commit stuff

git add *
git commit -m "Update"
nixos-rebuild build --flake /etc/nixos/#default

