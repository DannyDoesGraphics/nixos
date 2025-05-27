# /etc/nixos/modules/colors/default.nix

{ lib, config, pkgs, ... }:

{
  options.ui.colors = {
    scheme = lib.mkOption {
      type = lib.types.enum [ "nord" "catppuccin-mocha" "dracula" ];
      default = "nord";
      description = ''
        Color scheme to use across the system.
        Available options: nord, catppuccin-mocha, dracula
      '';
    };

    palette = lib.mkOption {
      type = lib.types.attrsOf lib.types.str;
      readOnly = true;
      description = ''
        A flat, indexed color palette (keys color0 … color15) used for UI theming.
        This is automatically set based on the selected color scheme.
      '';
    };
  };

  config = {
    ui.colors.palette = if config.ui.colors.scheme == "nord" then
      import ./palettes/nord.nix
    else if config.ui.colors.scheme == "catppuccin-mocha" then
      import ./palettes/catppuccin-mocha.nix
    else if config.ui.colors.scheme == "dracula" then
      import ./palettes/dracula.nix
    else
      throw "Unknown color scheme: ${config.ui.colors.scheme}";
  };
}
