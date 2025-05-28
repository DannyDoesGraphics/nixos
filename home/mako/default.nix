# /etc/nixos/home/mako/default.nix
{ lib, config, pkgs, ... }: {
  config = {
    home.packages = [ pkgs.mako pkgs.libnotify ];
    services.mako = { enable = true; };
    home.file.".config/mako/config".text = ''
      font = JetbrainsMono Nerd Font Mono Normal 12
      background-color = ${config.ui.colors.palette.color0}
      border-color = ${config.ui.colors.palette.color1}
    '';
  };
}
