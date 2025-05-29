# /etc/nixos/home/openrgb/default.nix

{ config, lib, pkgs, ... }: {
  config = { home.packages = with pkgs; [ openrgb-with-all-plugins ]; };
}
