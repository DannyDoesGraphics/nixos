# /etc/nixos/home/mako/default.nix
{ lib, config, pkgs, ... }: {
  config = {
    home.packages = [ pkgs.mako pkgs.libnotify ];
    services.mako = { enable = true; };
    home.file.".config/mako/config".text = ''
      background-color = ${config.ui.colors.palette.color0}
      border-color = ${config.ui.colors.palette.color1}
    '';
  };
}
