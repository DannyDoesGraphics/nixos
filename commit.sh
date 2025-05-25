#!/user/bin/env bash
# Commit stuff

git add *
git commit -m "Update"
nixos-rebuild --flake /etc/nixos/#default

