#!/user/bin/env bash
# builds the default configuration
sh /etc/nixos/commit.sh &&
    nixos-rebuild build --flake /etc/nixos/#default