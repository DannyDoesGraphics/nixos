# /etc/nixos/modules/hardware/gpu/nvidia.nix

{ config, pkgs, lib, ... }:
{
  options.nvidia.xserver = lib.mkOption {
    type = lib.types.bool;
    default = false;
    description = "Enable X11 server and set NVIDIA as the video driver";
  };
  config = lib.mkMerge [
    (lib.mkIf config.nvidia.xserver {
      services.xserver = {
        enable = true;
        videoDrivers = [ "nvidia" ];
      };
    })
    {
      nixpkgs.config.nvidia.acceptLicense = true;
      hardware.nvidia = {
        modesetting.enable = true;
        nvidiaSettings = true;
        open = false; # Use proprietary drivers
        package = config.boot.kernelPackages.nvidiaPackages.production;
      };
    }
  ];
}