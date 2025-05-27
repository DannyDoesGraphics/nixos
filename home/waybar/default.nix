{ config, pkgs, lib, ... }: {
  programs.waybar = {
    enable = true;
    package = pkgs.waybar;
    settings = {
      mainBar = {
        layer = "top";
        position = "top";
        "modules-left" = [ "hyprland/workspaces" "hyprland/window" ];
        "modules-center" = [ "clock" ];
        "modules-right" = [ "cpu" "memory" "pulseaudio" "tray" ];
        clock = { format = "{:%a %b %d %H:%M:%S.%6f}"; };
        cpu = { format = "CPU {usage}%"; };
        memory = { format = "RAM {used:0.1f}G/{total:0.1f}G"; };
        pulseaudio = {
          format = "{icon} {volume}%";
          "format-muted" = "󰝟 Mute";
          "format-icons" = { default = [ "" "" "" ]; };
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
}
