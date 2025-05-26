{ config, pkgs, inputs, lib, ... }:

{
  # Enable Hyprland program and portal support
  programs.hyprland = {
    enable = true;
    package = inputs.hyprland.packages.${pkgs.system}.hyprland;
    portalPackage = inputs.hyprland.packages.${pkgs.system}.xdg-desktop-portal-hyprland;
    xwayland.enable = true;
  };

  # XDG portal configuration for Hyprland
  xdg.portal.config = {
    common.default = [ "*" ];
    hyprland.default = [ "gtk" "hyprland" ];
  };

  # Wayland environment variables
  environment.variables = {
    XDG_CURRENT_DESKTOP = "Hyprland";
    XDG_SESSION_DESKTOP = "Hyprland";
    XDG_SESSION_TYPE    = "wayland";
  };

  environment.sessionVariables = {
    MOZ_ENABLE_WAYLAND      = "1";
    NIXOS_OZONE_WL          = "1";
    T_QPA_PLATFORM          = "wayland";
    GDK_BACKEND             = "wayland";
    WLR_NO_HARDWARE_CURSORS = "1";
  };

  # Polkit agent for session
  systemd.user.services.polkit-gnome-authentication-agent-1 = {
    description = "polkit-gnome-authentication-agent-1";
    wantedBy = [ "graphical-session.target" ];
    wants    = [ "graphical-session.target" ];
    after    = [ "graphical-session.target" ];
    serviceConfig = {
      Type            = "simple";
      ExecStart       = "${inputs.hyprpolkitagent.packages.${pkgs.system}.hyprpolkitagent}/bin/hyprpolkitagent";
      Restart         = "on-failure";
      RestartSec      = 1;
      TimeoutStopSec  = 10;
    };
  };
}
