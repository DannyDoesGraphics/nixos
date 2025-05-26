# /etc/nixos/modules/wm/hyprland/default.nix

{ pkgs, libs, inputs, config, ... }:
{
  programs.hyprland = {
    enable = true;
    #package = inputs.hyprland.packages."${pkgs.system}".hyprland;
    #portalPackage = inputs.hyprland.packages.${pkgs.stdenv.hostPlatform.system}.xdg-desktop-portal-hyprland;
    xwayland.enable = true;
  };
  services.displayManager = {
    sddm.enable = true;
    sddm.wayland.enable = true;
    defaultSession = "hyprland";
  };
  xdg.portal = {
    enable = true;
    xdgOpenUsePortal = true;
    extraPortals = with pkgs; [
      xdg-desktop-portal-gtk
      xdg-desktop-portal-wlr
      xdg-desktop-portal-hyprland
      xdg-desktop-portal-kde
    ];
    config = {
      common.default = [ "*" ];
      org.freedesktop.portal.OpenURI = [ "kde" ];
    };
  };
}
