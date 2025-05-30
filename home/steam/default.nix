# /etc/nixos/home/steam/default.nix
{ config, lib, pkgs, ... }: {
  config = {
    home.packages = with pkgs;
      [
        # Steam with all necessary components
        protonup
      ];

    # Configure Steam environment variables
    home.sessionVariables = {
      STEAM_EXTRA_COMPAT_TOOLS_PATHS =
        "${config.home.homeDirectory}/.steam/root/compatibilitytools.d";
    };

    # XDG desktop entries for Steam
    xdg.desktopEntries = {
      steam-gamemode = {
        name = "Steam (GameMode)";
        comment = "Launch Steam with GameMode optimization";
        exec = "gamemoderun steam";
        icon = "steam";
        categories = [ "Game" ];
      };

      steam-gamescope = {
        name = "Steam (Gamescope)";
        comment = "Launch Steam in Gamescope for better Wayland compatibility";
        exec =
          "env PROTON_ENABLE_WAYLAND=1 gamescope -W 5120 -H 1440 -f -- steam";
        icon = "steam";
        categories = [ "Game" ];
      };
    };
  };
}
