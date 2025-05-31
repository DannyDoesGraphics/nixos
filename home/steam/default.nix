# /etc/nixos/home/steam/default.nix
# User-specific Steam configuration (system config in modules/gaming/steam.nix)
{ config, lib, pkgs, ... }: {
  config = {
    # User-specific packages only (system packages now in gaming module)
    home.packages = with pkgs;
      [
        # User-specific gaming tools if needed
        # Most Steam/gaming packages are now at system level
      ];

    # User-specific Steam environment overrides (if needed)
    home.sessionVariables = {
      # Only user-specific overrides here
      # Most environment variables are now set at system level
    };
  };
}
