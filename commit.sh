#!/usr/bin/env bash
# Commit stuff
cd /etc/nixos/

# Add all changes
git add -A

# Commit the changes
git commit -m "Update"

# Get the commit hash for potential rollback
COMMIT_HASH=$(git rev-parse HEAD)

# Try to build
if nixos-rebuild build --flake /etc/nixos/#default; then
    echo "Build successful!"
else
    echo "Build failed! Undoing commit but keeping code changes..."
    # Reset to the previous commit but keep working directory unchanged
    git reset --soft HEAD~1
    echo "Commit undone. Your code changes are preserved and staged."
    exit 1
fi