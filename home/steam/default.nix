# /etc/nixos/home/steam/default.nix
{ config, lib, pkgs, ... }: {
  config = {
    home.packages = with pkgs; [
      # Steam with all necessary components
      steam
      steam-run

      # Proton and compatibility tools
      protonup-qt # GUI tool for managing Proton versions

      # Additional gaming utilities
      mangohud # Performance overlay
      gamemode # Optimize system for gaming
      gamescope # Wayland compositor for games

      # Steam Deck utilities (useful for any Steam setup)
      steamtinkerlaunch # Advanced Steam launch options

      # Wine and compatibility
      winetricks
      protontricks # Run Winetricks for Proton games

      # Controller support
      antimicrox # Map controller inputs to keyboard/mouse
    ];

    # Configure Steam environment variables
    home.sessionVariables = {
      # Enable Steam's native Wayland support (experimental)
      STEAM_FORCE_DESKTOPUI_SCALING = "1.5"; # Adjust scaling as needed

      # Proton configuration
      STEAM_COMPAT_DATA_PATH = "$HOME/.steam/steam/steamapps/compatdata";
      STEAM_COMPAT_CLIENT_INSTALL_PATH = "$HOME/.steam/steam";

      # Enable Proton logs for debugging
      PROTON_LOG = "1";
      PROTON_DUMP_DEBUG_COMMANDS = "1";

      # GameMode integration
      GAMEMODERUNEXEC =
        "env __NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia";

      # MangoHud configuration
      MANGOHUD = "1";
      MANGOHUD_DLSYM = "1";
    };

    # XDG desktop entries for Steam
    xdg.desktopEntries = {
      steam-gamemode = {
        name = "Steam (GameMode)";
        comment = "Launch Steam with GameMode optimization";
        exec = "gamemoderun steam";
        icon = "steam";
        categories = [ "Game" ];
      };

      steam-gamescope = {
        name = "Steam (Gamescope)";
        comment = "Launch Steam in Gamescope for better Wayland compatibility";
        exec = "gamescope -W 1920 -H 1080 -f -- steam";
        icon = "steam";
        categories = [ "Game" ];
      };
    };

    # Configure MangoHud
    home.file.".config/MangoHud/MangoHud.conf".text = ''
      # MangoHud Configuration
      toggle_hud=Shift_R+F12
      toggle_logging=Shift_L+F2
      upload_log=F5
      output_file=/tmp/mangohud

      # Display options
      gpu_stats
      gpu_temp
      gpu_core_clock
      gpu_mem_clock
      gpu_power
      gpu_text=GPU

      cpu_stats
      cpu_temp
      cpu_power
      cpu_text=CPU

      vram
      ram
      fps
      frametime=0
      frame_timing=1

      # Position and appearance
      position=top-left
      table_columns=3
      toggle_fps_limit=F1

      # Background
      background_alpha=0.4
      font_size=24

      # Vulkan
      vulkan_driver

      # Wine/Proton specific
      wine
      winesync
    '';

    # Configure GameMode
    home.file.".config/gamemode.ini".text = ''
      [general]
      renice=10
      ioprio=1
      inhibit_screensaver=1

      [filter]
      whitelist=steam
      whitelist=steamwebhelper
      whitelist=streaming_client

      [gpu]
      apply_gpu_optimisations=accept-responsibility
      nv_powermizer_mode=1
      amd_performance_level=high

      [custom]
      start=notify-send "GameMode started"
      end=notify-send "GameMode ended"
    '';
  };
}
