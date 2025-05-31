# /etc/nixos/modules/hardware/gpu/nvidia.nix

{ config, pkgs, lib, ... }: {
  options.nvidia.xserver = lib.mkOption {
    type = lib.types.bool;
    default = false;
    description = "Enable X11 server and set NVIDIA as the video driver";
  };
  config = {
    services.xserver = {
      enable = true;
      videoDrivers = [ "nvidia" ];
    };
    nixpkgs.config.nvidia.acceptLicense = true;
    hardware.nvidia = {
      modesetting.enable = true;
      nvidiaSettings = true;
      open = false; # Use proprietary drivers for better stability
      package = config.boot.kernelPackages.nvidiaPackages.latest;
      # HDR Support
      powerManagement.enable = false;
      powerManagement.finegrained = false;

      # Force use of discrete GPU for better performance
      prime = {
        # Uncomment if you have integrated graphics and want to use hybrid mode
        # offload.enable = true;
        # intelBusId = "PCI:0:2:0";  # Check with lspci
        # nvidiaBusId = "PCI:1:0:0"; # Check with lspci
      };
    };
    nixpkgs.config.cudaSupport = true;
    environment.systemPackages = with pkgs; [
      cudaPackages.cudatoolkit
      cudaPackages.cudnn
      cudaPackages.cuda_cudart
      # Vulkan tools for testing
      vulkan-tools
      vulkan-validation-layers
      vulkan-loader
      # GLX tools for OpenGL testing
      glxinfo
      mesa-demos
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
      # Ensure NVIDIA is used for Vulkan
      VK_ICD_FILENAMES =
        "/run/opengl-driver/share/vulkan/icd.d/nvidia_icd.json";
      # Force NVIDIA as primary GPU
      __NV_PRIME_RENDER_OFFLOAD = "1";
      __NV_PRIME_RENDER_OFFLOAD_PROVIDER = "NVIDIA-G0";
      __GLX_VENDOR_LIBRARY_NAME = "nvidia";
    };
  };
}
