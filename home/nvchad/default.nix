# /etc/nixos/home/nvchad/default.nix
{ lib, config, pkgs, inputs, ... }: {
  config = {

    programs.nvchad = {
      enable = true;
      extraPackages = with pkgs; [ ];
    };
  };
}
