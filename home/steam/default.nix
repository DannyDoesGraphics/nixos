# /etc/nixos/home/steam/default.nix
{ config, lib, pkgs, ... }: {
  config = {
    home.packages = with pkgs; [
      # Steam with all necessary components
      protonup
      lutris
      # HDR and gaming tools
      vulkan-tools
      vulkan-loader
      mesa-demos
    ];

    # Configure Steam environment variables
    home.sessionVariables = {
      STEAM_EXTRA_COMPAT_TOOLS_PATHS =
        "\\\${config.home.homeDirectory}/.steam/root/compatibilitytools.d";
      # HDR Support
      ENABLE_HDR_WSI = "1";
      DXVK_HDR = "1";
      VKD3D_CONFIG = "dxr";
    };
  };
}
