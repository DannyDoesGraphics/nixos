# /etc/nixos/modules/gaming/steam.nix
# System-level Steam and gaming configuration

{ config, lib, pkgs, ... }: {
  options.gaming.steam = {
    enable = lib.mkEnableOption "Steam gaming configuration";

    gamescope = {
      resolution = {
        width = lib.mkOption {
          type = lib.types.int;
          default = 5120;
          description = "GameScope output width";
        };
        height = lib.mkOption {
          type = lib.types.int;
          default = 1440;
          description = "GameScope output height";
        };
      };
      hdr = lib.mkOption {
        type = lib.types.bool;
        default = true;
        description = "Enable HDR support in GameScope";
      };
    };
  };

  config = lib.mkIf config.gaming.steam.enable {
    # Steam configuration
    programs.steam = {
      enable = true;
      remotePlay.openFirewall = true;
      dedicatedServer.openFirewall = true;
      gamescopeSession.enable = true;
      gamescopeSession.args = [
        "-w ${toString config.gaming.steam.gamescope.resolution.width}"
        "-h ${toString config.gaming.steam.gamescope.resolution.height}"
        "-f"
        "--backend sdl"
      ] ++ lib.optionals config.gaming.steam.gamescope.hdr [ "--hdr-enabled" ];
    };

    # GameScope and GameMode
    programs.gamescope = {
      enable = true;
      capSysNice = true;
    };

    programs.gamemode = {
      enable = true;
      settings = {
        general = { renice = 10; };
        gpu = {
          apply_gpu_optimisations = "accept-responsibility";
          gpu_device = 0;
          amd_performance_level = "high";
        };
      };
    };

    # System-wide gaming environment variables
    environment.sessionVariables = {
      # Steam configuration
      STEAM_EXTRA_COMPAT_TOOLS_PATHS =
        "/home/$USER/.steam/root/compatibilitytools.d";

      # Proton/Wine optimizations
      PROTON_USE_NTSYNC = "1";
      PROTON_ENABLE_AMD_AGS = "1";
      PROTON_ENABLE_NVAPI = "1";

      # HDR Support
      ENABLE_HDR_WSI = "1";
      DXVK_HDR = "1";

      # GameScope integration
      ENABLE_GAMESCOPE_WSI = "1";
      STEAM_MULTIPLE_XWAYLANDS = "1";

      # Performance optimizations
      WINE_CPU_TOPOLOGY = "12:6"; # Adjust based on your CPU
      DXVK_ASYNC = "1";

      # Steam optimizations
      STEAM_FORCE_DESKTOPUI_SCALING = "1";

      # GPU offloading (ensure Steam uses NVIDIA)
      __NV_PRIME_RENDER_OFFLOAD = "1";
      __NV_PRIME_RENDER_OFFLOAD_PROVIDER = "NVIDIA-G0";
      __GLX_VENDOR_LIBRARY_NAME = "nvidia";

      # Vulkan configuration
      VK_ICD_FILENAMES =
        "/run/opengl-driver/share/vulkan/icd.d/nvidia_icd.json";

      # Wayland/X11 compatibility for Steam
      NIXOS_OZONE_WL = "1";
      QT_QPA_PLATFORM = "wayland;xcb";
      GDK_BACKEND = "wayland,x11";
      CLUTTER_BACKEND = "wayland";
      SDL_VIDEODRIVER = "wayland,x11";

      # XWayland scaling
      GDK_SCALE = "1";
      GDK_DPI_SCALE = "1";
    };

    # Gaming packages at system level
    environment.systemPackages = with pkgs; [
      # Proton and compatibility tools
      protonup
      lutris

      # GameScope and performance
      gamescope
      gamemode

      # Wine and related tools
      wineWowPackages.stable
      winetricks

      # X11/XWayland support for Steam
      xorg.xwininfo
      xorg.xprop
      xorg.xrandr
      xwayland

      # Debugging and monitoring
      mesa-demos

      # Additional gaming utilities
      steam-run
      steamtinkerlaunch
    ];

    # Graphics hardware support for gaming
    hardware.graphics = {
      extraPackages = with pkgs;
        [
          # GameScope WSI support handled by gamescope package
        ];
      extraPackages32 = with pkgs.pkgsi686Linux;
        [
          # 32-bit graphics support handled by opengl module
        ];
    };

    # Ensure proper user groups for gaming
    users.groups.gamemode = { };

    # Add current user to gaming groups (assuming danny is the user)
    users.users.danny.extraGroups = [ "gamemode" ];
  };
}
