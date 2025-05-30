# /etc/nixos/modules/hardware/gpu/nvidia.nix

{ config, pkgs, lib, ... }: {
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
        # HDR Support
        powerManagement.enable = false;
        powerManagement.finegrained = false;
      };
      nixpkgs.config.cudaSupport = true;
      environment.systemPackages = with pkgs; [
        cudaPackages.cudatoolkit
        cudaPackages.cudnn
        cudaPackages.cuda_cudart
      ];
      environment.sessionVariables = {
        CUDA_HOME = "${pkgs.cudaPackages.cudatoolkit}";
        LD_LIBRARY_PATH = lib.makeLibraryPath [
          "${pkgs.cudaPackages.cudatoolkit}"
          "${pkgs.cudaPackages.cudatoolkit}/lib64"
          pkgs.cudaPackages.cudnn
          pkgs.cudaPackages.cuda_cudart
          pkgs.stdenv.cc.cc.lib
        ];
        CUDA_MODULE_LOADING = "LAZY";
      };
    }
  ];
}
