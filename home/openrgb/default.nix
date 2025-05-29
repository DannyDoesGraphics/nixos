# /etc/nixos/home/openrgb/default.nix

{ config, lib, pkgs, ... }: {
  config = {
    #home.packages = with pkgs; [ i2c-tools openrgb-with-all-plugins ];
  };
}
