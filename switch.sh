#!/usr/bin/env bash
# builds the default configuration with commit workflow

cd /etc/nixos/

# Step 1: Commit everything
echo "Adding and committing all changes..."
git add -A
git commit -m "Update"

# Get the commit hash for potential rollback
COMMIT_HASH=$(git rev-parse HEAD)

# Try to build
echo "Building NixOS configuration..."
if nixos-rebuild build --flake /etc/nixos/#default; then
    echo "Build successful!"
    
    # Soft revert the commit but keep changes staged
    git reset --soft HEAD~1
    
    # Ask user if they want to re-commit and switch
    echo "Do you want to re-commit these changes and switch to the new configuration? (Y/n) Default: Y"
    read -r response
    
    if [[ "$response" =~ ^[Nn]$ ]]; then
        echo "Changes remain staged but not committed. Configuration not switched."
    else
        echo "Re-committing changes..."
        git commit -m "Update"
        echo "Switching to new configuration..."
        nixos-rebuild switch --flake /etc/nixos/#default
        echo "Switch completed successfully!"
    fi
else
    echo "Build failed! Soft reverting commit but keeping code changes..."
    # Reset to the previous commit but keep working directory unchanged
    git reset --soft HEAD~1
    echo "Commit undone. Your code changes are preserved and staged."
    exit 1
fi