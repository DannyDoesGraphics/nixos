{ config, pkgs, lib, ... }:
let
  colorsModule = import ../../modules/colors/nord.nix { inherit config pkgs lib; };
in {
  imports = [
    colorsModule
  ];

  home.username= "danny";
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
  home.packages = with pkgs; [
    vscode
    ncspot
    vesktop
    bitwarden-desktop
    gcr
    hyprpaper
    hyprcursor
    pkgs.rclone
    yazi
    wireplumber
    pipewire
    gimp
    fastfetch
    nordzy-cursor-theme
  ];
  services.gnome-keyring.enable = true;
  
  programs = {
    firefox.enable = true;
    wezterm = {
      enable = true;

      extraConfig = ''
        -- grab the palette we defined in Nix
        local palette = {
          color0  = "${config.ui.colors.palette.color0}";
          color1  = "${config.ui.colors.palette.color1}";
          color2  = "${config.ui.colors.palette.color2}";
          color3  = "${config.ui.colors.palette.color3}";
          color4  = "${config.ui.colors.palette.color4}";
          color5  = "${config.ui.colors.palette.color5}";
          color6  = "${config.ui.colors.palette.color6}";
          color7  = "${config.ui.colors.palette.color7}";
          color8  = "${config.ui.colors.palette.color8}";
          color9  = "${config.ui.colors.palette.color9}";
          color10 = "${config.ui.colors.palette.color10}";
          color11 = "${config.ui.colors.palette.color11}";
          color12 = "${config.ui.colors.palette.color12}";
          color13 = "${config.ui.colors.palette.color13}";
          color14 = "${config.ui.colors.palette.color14}";
          color15 = "${config.ui.colors.palette.color15}";
        }

        return {
          -- set the font
          font = wezterm.font("JetBrainsMono Nerd Font Mono", { weight = "Regular" }),
          font_size = 12.0,

          -- define a custom Nord-based color scheme
          enable_tab_bar = false;
          hide_tab_bar_if_only_one_tab = true;
          color_scheme = "nord-from-nix";
          window_background_opacity = 0.9;
          
          colors = {
            foreground = palette.color6;
            background = palette.color0;

            ansi = {
              palette.color0,  palette.color1,  palette.color2,  palette.color3,
              palette.color4,  palette.color5,  palette.color6,  palette.color7,
            };

            brights = {
              palette.color8,  palette.color9,  palette.color10, palette.color11,
              palette.color12, palette.color13, palette.color14, palette.color15,
            };

            -- you can also remap things like cursor/bg/selection:
            cursor_bg    = palette.color5;
            selection_bg = palette.color2;
          }
        }
      '';
    };
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
          clock = {
            format = "{:%a %b %d %H:%M}";
          };
          cpu = {
            format = "CPU {usage}%";
          };
          memory = {
            format = "RAM {used:0.1f}G/{total:0.1f}G";
          };
          pulseaudio = {
            format = "{icon} {volume}%";
            "format-muted" = "󰝟 Mute";
            "format-icons" = {
              default = [ "" "" "" ];
            };
            on-click = "pgrep pavucontrol && pkill pavucontrol || pavucontrol &";
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
    Install = {
      WantedBy = [ "graphical-session.target" ];
    };
  };
  # Hyperpolkit agent
  systemd.user.services.hyprpolkitagent = {
    Unit = {
      Description = "Hyprland PolicyKit Authentication Agent";
      After = [ "graphical-session.target" ];
    };
    Service = {
      ExecStart = "${pkgs.hyprpolkitagent}/bin/hyprpolkitagent";
      Restart   = "always";
    };
    Install = {
      WantedBy = [ "graphical-session.target" ];
    };
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
    Install = {
      WantedBy = [ "graphical-session.target" ];
    };
  };

  
  programs.home-manager.enable = true;
  home.stateVersion = "25.05";
}
