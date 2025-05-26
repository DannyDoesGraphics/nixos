# /etc/nixos/modules/hardware/gpus/nvidia.nix

{ config, pkgs, lib, ... }:
{
  nixpkgs.config.nvidia.acceptLicense = true;
  hardware.nvidia = {
    modesetting.enable = true;
    nvidiaSettings = true;
    open = false; # Use proprietary drivers
    package = config.boot.kernelPackages.nvidiaPackages.production;
  };
}