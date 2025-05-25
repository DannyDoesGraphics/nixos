#!/user/bin/env bash
# builds the default configuration
sh /etc/nixos/commit.sh &&
    nixos-rebuild switch --flake /etc/nixos/#default