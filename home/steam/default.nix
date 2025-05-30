# /etc/nixos/home/steam/default.nix
{ config, lib, pkgs, ... }: {
  config = {
    home.packages = with pkgs;
      [
        # Steam with all necessary components
        protonup
      ];

    # Configure Steam environment variables
    home.sessionVariables = {
      STEAM_EXTRA_COMPAT_TOOLS_PATHS =
        "${config.home.homeDirectory}/.steam/root/compatibilitytools.d";
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
        exec = "gamescope -W 5120 -H 1440 -f -- steam";
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
