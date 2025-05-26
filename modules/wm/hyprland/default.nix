# /etc/nixos/modules/wm/hyprland/default.nix

{ pkgs, libs, inputs, config, ... }:
{
  services.displayManager = {
    sddm.enable = true;
    sddm.wayland.enable = true;
    defaultSession = "hyprland";
  };
  xdg.portal = {
    enable = true;
    xdgOpenUsePortal = true;
    config = {
      common.default = ["hyprland" "gtk" ];
      hyprland.default = ["hyprland" "gtk"];
    };
  };
}