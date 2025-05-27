# /etc/nixos/modules/wm/hyprland/default.nix

{ pkgs, libs, inputs, config, ... }:
{
  programs.hyprland = {
    enable = true;
    package = inputs.hyprland.packages."${pkgs.system}".hyprland;
    portalPackage = inputs.hyprland.packages.${pkgs.stdenv.hostPlatform.system}.xdg-desktop-portal-hyprland;
    xwayland.enable = true;
    systemd.enable = true;
  };
  services.displayManager = {
    sddm.enable = true;
    sddm.wayland.enable = true;
    defaultSession = "hyprland";
  };
  xdg.portal = {
    enable = true;
    xdgOpenUsePortal = true;
    extraPortals = [
      inputs.hyprland.packages.${pkgs.stdenv.hostPlatform.system}.xdg-desktop-portal-hyprland
      pkgs.xdg-desktop-portal-gtk
    ];
    config.common.default = "*";
    config.common."org.freedesktop.impl.portal.OpenURI" = [ "hyprland" ];
    config.hyprland.default = ["hyprland" "gtk"];
  };
}
