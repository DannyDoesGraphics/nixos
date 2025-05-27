# /etc/nixos/modules/wm/hyprland/default.nix
# IMPORTANT: This module expects a conflicting systemd service to shut off: 
{ pkgs, libs, inputs, config, ... }: {
  programs.hyprland = {
    enable = true;
    package = inputs.hyprland.packages."${pkgs.system}".hyprland;
    portalPackage =
      inputs.hyprland.packages.${pkgs.stdenv.hostPlatform.system}.xdg-desktop-portal-hyprland;
    xwayland.enable = true;
    withUWSM = true;
  };
  services.displayManager = {
    sddm = {
      enable = true;
      wayland.enable = true;
      theme = "breeze"; # You can change this to other themes
      settings = {
        General = {
          Background =
            "/home/danny/.config/hypr/lock.jpg"; # Use same wallpaper as lock screen
          CursorTheme = "Nordzy-cursors";
          Font = "JetBrainsMono Nerd Font";
        };
        Theme = {
          Current = "breeze";
          CursorTheme = "Nordzy-cursors";
          Font = "JetBrainsMono Nerd Font,10,-1,0,50,0,0,0,0,0";
        };
      };
    };
    defaultSession = "hyprland-uwsm";
  };
  xdg.portal = {
    enable = true;
    xdgOpenUsePortal = true;
    extraPortals = [ pkgs.xdg-desktop-portal-gtk ];
    config.common.default = [ "gtk" ];
    config.hyprland.default = [ "gtk" "hyprland" ];
  };
}
