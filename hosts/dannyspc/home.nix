{ config, pkgs, lib, inputs, ... }: {
  imports = [
    ../../modules/colors/default.nix
    ../../home/wezterm/default.nix
    #../../home/waybar/default.nix
    #zenModule
  ];

  # Configure color scheme - change this to switch color schemes
  ui.colors.scheme = "nord";

  home.username = "danny";
  home.homeDirectory = "/home/danny";
  nixpkgs.config.allowUnfree = true;

  home.pointerCursor = {
    gtk.enable = true;
    x11.enable = true;
    package = pkgs.nordzy-cursor-theme;
    name = "Nordzy-cursors";
    size = 24;
  };

  # GTK Configuration
  gtk = {
    enable = true;
    gtk3.extraConfig = { gtk-application-prefer-dark-theme = 1; };
    gtk4.extraConfig = { gtk-application-prefer-dark-theme = 1; };
  };

  # Hyprland
  wayland.windowManager.hyprland.systemd.enable = false;
  wayland.windowManager.hyprland = {
    enable = true;
    xwayland.enable = true;
    extraConfig = ''
      # Disable title bars globally
      windowrulev2 = noblur,class:.*
      windowrulev2 = noshadow,class:.*

      decoration {
        blur {
          enabled = false   # master toggle
          size    = 0       # (ignored when disabled)
          passes  = 0
          # you can also tweak noise, contrast, brightness, etc.
        }
        rounding = 0
      }

      experimental {
        xx_color_management_v4 = true
      }
      # Setup mouse
      env = XCURSOR_THEME,Nordzy-cursors
      env = XCURSOR_SIZE,24
      env = GBM_BACKEND,nvidia-drm
      env = __GLX_VENDOR_LIBRARY_NAME,nvidia
      # Set wallpaper using hyprland
      monitor = DP-6,5120x1440@239.76,0x0,1,bitdepth,8,cm,srgb

      $mainMod = SUPER

      bind = $mainMod, Return, exec, wezterm
      # Movement
      bind = $mainMod, H, movefocus, l
      bind = $mainMod, L, movefocus, r
      bind = $mainMod, K, movefocus, u
      bind = $mainMod, J, movefocus, d

      bind = $mainMod SHIFT, H, movewindow, l
      bind = $mainMod SHIFT, L, movewindow, r
      bind = $mainMod SHIFT, K, movewindow, u
      bind = $mainMod SHIFT, J, movewindow, d
      # Switch workspaces with mainMod + [0-9]
      bind = $mainMod, 1, workspace, 1
      bind = $mainMod, 2, workspace, 2
      bind = $mainMod, 3, workspace, 3
      bind = $mainMod, 4, workspace, 4
      bind = $mainMod, 5, workspace, 5
      bind = $mainMod, 6, workspace, 6
      bind = $mainMod, 7, workspace, 7
      bind = $mainMod, 8, workspace, 8
      bind = $mainMod, 9, workspace, 9
      bind = $mainMod, 0, workspace, 10

      # Move active window to a workspace with mainMod + SHIFT + [0-9]
      bind = $mainMod SHIFT, 1, movetoworkspace, 1
      bind = $mainMod SHIFT, 2, movetoworkspace, 2
      bind = $mainMod SHIFT, 3, movetoworkspace, 3
      bind = $mainMod SHIFT, 4, movetoworkspace, 4
      bind = $mainMod SHIFT, 5, movetoworkspace, 5
      bind = $mainMod SHIFT, 6, movetoworkspace, 6
      bind = $mainMod SHIFT, 7, movetoworkspace, 7
      bind = $mainMod SHIFT, 8, movetoworkspace, 8
      bind = $mainMod SHIFT, 9, movetoworkspace, 9
      bind = $mainMod SHIFT, 0, movetoworkspace, 10

      # Resize window width/height with vim keys remapped: u/i/o/p
      bind = $mainMod, u, resizeactive, -40 0
      bind = $mainMod, p, resizeactive, 40 0
      bind = $mainMod, o, resizeactive, 0 -40
      bind = $mainMod, i, resizeactive, 0 40
      # Finer control (Super+Shift)
      bind = $mainMod SHIFT, u, resizeactive, -40 0, exact
      bind = $mainMod SHIFT, p, resizeactive, 40 0, exact
      bind = $mainMod SHIFT, o, resizeactive, 0 -40, exact
      bind = $mainMod SHIFT, i, resizeactive, 0 40, exact

      # Close window
      bind = $mainMod, Q, killactive
    '';
  };

  # Packages weee
  home.packages = [
    pkgs.vscode
    pkgs.ncspot
    pkgs.vesktop
    pkgs.bitwarden-desktop
    # pkgs.hyprpaper  # Disabled wallpaper
    pkgs.hyprcursor
    pkgs.rclone
    pkgs.yazi
    pkgs.wireplumber
    pkgs.pipewire
    pkgs.gimp
    pkgs.fastfetch
    pkgs.nordzy-cursor-theme
    pkgs.xdg-utils
    pkgs.cargo
    pkgs.clippy
    pkgs.rustc
    pkgs.pavucontrol
    pkgs.jetbrains.rust-rover
    pkgs.code-cursor
    pkgs.gtk4
    pkgs.gtk4-layer-shell
    inputs.ags.packages.${pkgs.system}.default
    inputs.astal.packages.${pkgs.system}.default
    inputs.astal.packages.${pkgs.system}.astal4
    inputs.astal.packages.${pkgs.system}.hyprland
    inputs.astal.packages.${pkgs.system}.wireplumber
    inputs.swww.packages.${pkgs.system}.swww
    #inputs.zen-browser.packages."x86_64-linux".default
  ];
  services.gnome-keyring.enable = true;

  programs = {
    firefox.enable = true;
    #zen-browser = {
    #  enable = true;
    #  policies = {
    #    DisableAppUpdate = true;
    #    DisableTelemetry = true;
    #  };
    #};
    helix = { enable = true; };
    hyprlock = {
      enable = true;
      settings = {
        general = {
          grace = 5;
          no_fade_in = false;
          disable_loading_bar = false;
        };

        background = {
          monitor = "";
          blur_passes = 0;
          path = "~/.config/hypr/lock.jpg";
        };

        label = [
          # date
          {
            monitor = "";
            text = ''cmd[update:1000] echo -e "$(date +"%A, %B %d")"'';
            color = "${config.ui.colors.palette.color6}";
            font_size = 160;
            position = "50, 370";
            font_family = "JetBrainsMono Nerd Font Mono";
            halign = "left";
            valign = "center";
          }
          # time
          {
            monitor = "";
            text = "cmd[update:10] date +%H:%M:%S:%6N";
            color = "${config.ui.colors.palette.color11}";
            font_size = 28;
            font_family = "JetBrainsMono Nerd Font Mono";
            position = "50, 200";
            halign = "left";
            valign = "center";
          }
          # user
          {
            monitor = "";
            text = "$USER";
            color = "${config.ui.colors.palette.color8}";
            outline_thickness = 2;
            dots_size = 0.2; # Scale of input-field height, 0.2 - 0.8
            dots_spacing = 0.2; # Scale of dots' absolute size, 0.0 - 1.0
            dots_center = true;
            font_size = 18;
            font_family = "JetBrainsMono Nerd Font";
            position = "50, -180";
            halign = "left";
            valign = "center";
          }
        ];

        input-field = lib.mkForce {
          monitor = "";
          size = "300, 60";
          outline_thickness = 2;
          outer_color = "${config.ui.colors.palette.color2}";
          inner_color = "${config.ui.colors.palette.color0}";
          font_color = "${config.ui.colors.palette.color6}";
          fade_on_empty = false;
          fade_timeout = 0;
          placeholder_text = "<i>Password...</i>";
          dots_size = 0;
          dots_spacing = 0;
          dots_center = false;
          dots_rounding = -1;
          font_family = "JetBrainsMono Nerd Font Mono";
          hide_input = true;
          rounding = 6;
          check_color = "${config.ui.colors.palette.color11}";
          fail_color = "${config.ui.colors.palette.color9}";
          capslock_color = "${config.ui.colors.palette.color13}";
          numlock_color = "${config.ui.colors.palette.color13}";
          bothlock_color = "${config.ui.colors.palette.color13}";
          invert_numlock = false;
          swap_font_color = false;
          position = "50, -250";
          halign = "left";
          valign = "center";
        };
      };
    };
  };

  # Files
  home.file = {
    # Map entire .config directory
    ".config".source = ./.config;
    ".config".recursive = true;

    # Override specific files if needed
    # ".config/hyprpaper/rotate.sh".source = ./scripts/hyprland/rotate.sh;  # Disabled wallpaper
    # ".config/hyprpaper/rotate.sh".executable = true;  # Disabled wallpaper

    # Other files
    ".zshrc".source = ./.config/.zshrc;
  };
  # Run hyprpaper
  #
  #systemd.user.services.hyprpaper-rotate = {
  #  Unit = {
  #    Description = "Rotate Hyprpaper Wallpapers";
  #    After = [ "graphical-session.target" ];
  #  };
  #  Service = {
  #    ExecStart = "%h/.config/hyprpaper/rotate.sh";
  #    Restart = "always";
  #  };
  #  Install = { WantedBy = [ "graphical-session.target" ]; };
  #};
  # Swww wallpaper service
  systemd.user.services.swww = {
    Unit = {
      Description = "SWWW Wallpaper Service";
      After = [ "graphical-session.target" ];
    };
    Service = {
      ExecStart = "${inputs.swww.packages.${pkgs.system}.swww}/bin/swww-daemon";
      Restart = "always";
    };
    Install = { WantedBy = [ "graphical-session.target" ]; };
  };
  # SWWW Wallpaper Rotation Service
  systemd.user.services.swww-rotate = {
    Unit = {
      Description = "SWWW Wallpaper Rotation";
      After = [ "swww.service" "hyprland-session.target" ];
      Wants = [ "swww.service" ];
    };
    Service = {
      ExecStart = "%h/.config/swww/rotate.sh";
      Restart = "always";
      RestartSec = 5;
    };
    Install = { WantedBy = [ "hyprland-session.target" ]; };
  };

  # AGS Bar Service
  systemd.user.services.ags = {
    Unit = {
      Description = "AGS Bar";
      After = [ "graphical-session.target" ];
    };
    Service = {
      ExecStart = "${inputs.ags.packages.${pkgs.system}.default}/bin/ags run .";
      ExecReload =
        "${inputs.ags.packages.${pkgs.system}.default}/bin/ags quit; ${
          inputs.ags.packages.${pkgs.system}.default
        }/bin/ags run .";
      Restart = "on-failure";
      WorkingDirectory = "/etc/nixos/home/ags";
      Environment = [
        "GI_TYPELIB_PATH=${
          inputs.astal.packages.${pkgs.system}.hyprland
        }/lib/girepository-1.0:${
          inputs.astal.packages.${pkgs.system}.default
        }/lib/girepository-1.0:${
          inputs.astal.packages.${pkgs.system}.io
        }/lib/girepository-1.0:${
          inputs.astal.packages.${pkgs.system}.wireplumber
        }/lib/girepository-1.0:${pkgs.gtk4-layer-shell}/lib/girepository-1.0"
        "LD_LIBRARY_PATH=${pkgs.gtk4-layer-shell}/lib"
        "LD_PRELOAD=${pkgs.gtk4-layer-shell}/lib/libgtk4-layer-shell.so"
        #"GTK_LAYER_SHELL=${pkgs.gtk4-layer-shell}/lib"
        #"GSETTINGS_SCHEMA_DIR=${pkgs.gtk4}/share/gsettings-schemas/${pkgs.gtk4.name}/glib-2.0/schemas"
        #"GDK_BACKEND=wayland"
      ];
    };
    Install = { WantedBy = [ "graphical-session.target" ]; };
  };
  # Hyperpolkit agent
  systemd.user.services.hyprpolkitagent = {
    Unit = {
      Description = "Hyprland PolicyKit Authentication Agent";
      After = [ "graphical-session.target" ];
    };
    Service = {
      ExecStart = "${
          inputs.hyprpolkitagent.packages.${pkgs.system}.default
        }/libexec/hyprpolkitagent";
      Restart = "always";
    };
    Install = { WantedBy = [ "graphical-session.target" ]; };
  };
  xdg.mimeApps = {
    enable = true;
    defaultApplications = {
      "text/html" = "firefox.desktop";
      "x-scheme-handler/http" = "firefox.desktop";
      "x-scheme-handler/https" = "firefox.desktop";
      "x-scheme-handler/about" = "firefox.desktop";
      "x-scheme-handler/unknown" = "firefox.desktop";
    };
  };

  programs.home-manager.enable = true;
  home.stateVersion = "25.05";
}
