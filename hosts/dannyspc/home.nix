{ config, pkgs, lib, inputs, ... }: {
  imports = [
    ../../modules/colors/default.nix
    ../../home/wezterm/default.nix
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

  # Hyprland
  wayland.windowManager.hyprland.systemd.enable = false;
  wayland.windowManager.hyprland = {
    enable = true;
    xwayland.enable = true;
    extraConfig = ''
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
    '';
  };

  # Packages weee
  home.packages = [
    pkgs.vscode
    pkgs.ncspot
    pkgs.vesktop
    pkgs.bitwarden-desktop
    pkgs.gcr
    pkgs.hyprpaper
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
    pkgs.rustc
    pkgs.pavucontrol
    pkgs.jetbrains.rust-rover
    pkgs.code-cursor
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
    waybar = {
      enable = true;
      package = pkgs.waybar;
      settings = {
        mainBar = {
          layer = "top";
          position = "top";
          "modules-left" = [ "hyprland/workspaces" "hyprland/window" ];
          "modules-center" = [ "clock" ];
          "modules-right" = [ "cpu" "memory" "pulseaudio" "tray" ];
          clock = { format = "{:%a %b %d %H:%M}"; };
          cpu = { format = "CPU {usage}%"; };
          memory = { format = "RAM {used:0.1f}G/{total:0.1f}G"; };
          pulseaudio = {
            format = "{icon} {volume}%";
            "format-muted" = "󰝟 Mute";
            "format-icons" = { default = [ "" "" "" ]; };
            on-click =
              "pgrep pavucontrol && pkill pavucontrol || pavucontrol &";
          };
        };
      };
      style = ''
        * {
          font-family: JetBrainsMono Nerd Font Mono, monospace;
          font-size: 14px;
        }
        window#waybar {
          background-color: transparent;
        }
        #mainBar {
          background: ${config.ui.colors.palette.color0};
          color: ${config.ui.colors.palette.color6};
        }
        #workspaces,
        #clock,
        #cpu,
        #memory,
        #pulseaudio,
        #window,
        #tray {
          background: ${config.ui.colors.palette.color1};
          color: ${config.ui.colors.palette.color6};
          border-radius: 6px;
          padding: 0 10px;
          margin: 2px 4px;
        }
        #pulseaudio.muted {
          color: ${config.ui.colors.palette.color8};
        }
        #workspaces button.active {
          background: ${config.ui.colors.palette.color2};
          color: ${config.ui.colors.palette.color6};
        }
        #workspaces button.inactive {
          background: ${config.ui.colors.palette.color3};
          color: ${config.ui.colors.palette.color0};
        }
      '';
    };
  };
  services = {
    hyprpaper = {
      enable = true;
      settings = {
        ipc = "on";
        splash = false;
      };
    };
  };

  # Files
  home.file = {
    # Hyprpaper rotation script with advanced shuffling
    ".config/hyprpaper/rotate.sh".source = ./scripts/hyprland/rotate.sh;
    ".config/hyprpaper/rotate.sh".executable = true;
    ".zshrc".source = ./.config/.zshrc;
  };
  # Run hyprpaper
  systemd.user.services.hyprpaper-rotate = {
    Unit = {
      Description = "Rotate Hyprpaper Wallpapers";
      After = [ "graphical-session.target" ];
    };
    Service = {
      ExecStart = "%h/.config/hyprpaper/rotate.sh";
      Restart = "always";
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
      ExecStart = "${pkgs.hyprpolkitagent}/bin/hyprpolkitagent";
      Restart = "always";
    };
    Install = { WantedBy = [ "graphical-session.target" ]; };
  };
  systemd.user.services.waybar = {
    Unit = {
      Description = "Waybar status bar";
      After = [ "graphical-session.target" ];
    };
    Service = {
      ExecStart = "${pkgs.waybar}/bin/waybar";
      Restart = "on-failure";
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
