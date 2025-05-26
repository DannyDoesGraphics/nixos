# /etc/nixos/modules/hardware/gpu/opengl.nix

{ config, pkgs, lib, ... }:
{
  hardware.graphics.enable = true;
  hardware.graphics.enable32Bit = true; # 32-bit backwards compatability
  services.dbus.enable = true;
}