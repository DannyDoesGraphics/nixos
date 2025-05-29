# /etc/nixos/home/nvchad/default.nix
{ lib, config, pkgs, inputs, ... }: {
  config = {
    imports = [ inputs.nvchad4nix.homeManagerModule ];

    programs.nvchad = {
      enable = true;
      extraPackages = with pkgs; [ ];
    };
  };
}
