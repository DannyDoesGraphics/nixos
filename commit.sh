#!/usr/bin/env bash
# Commit stuff
cd /etc/nixos/
git add -A
git commit -m "Update"
nixos-rebuild build --flake /etc/nixos/#default
