# /etc/nixos/home/ollama/default.nix
{ lib, config, pkgs, ... }: {
  config = {
    home.packages = [ pkgs.ollama ];
  };
}
