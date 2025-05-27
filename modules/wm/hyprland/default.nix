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
