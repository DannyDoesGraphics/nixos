# /etc/nixos/home/steam/default.nix
{ config, lib, pkgs, ... }: {
  config = {
    home.packages = with pkgs; [
      # Steam with all necessary components
      protonup
      lutris
    ];

    # Configure Steam environment variables
    home.sessionVariables = {
      STEAM_EXTRA_COMPAT_TOOLS_PATHS =
        "\\\${config.home.homeDirectory}/.steam/root/compatibilitytools.d";
      # HDR Support
      PROTON_USE_NTSYNC = "1";
      ENABLE_HDR_WSI = "1";
      DXVK_HDR = "1";
      PROTON_ENABLE_AMD_AGS = "1";
      PROTON_ENABLE_NVAPI = "1";
      ENABLE_GAMESCOPE_WSI = "1";
      STEAM_MULTIPLE_XWAYLANDS = "1";
    };
  };
}
