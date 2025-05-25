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

  # Hyprland
  wayland.windowManager.hyprland = {
    enable = true;
    extraConfig = ''
      experimental {
        xx_color_management_v4 = true
      }
      monitor = DP-6,5120x1440@239.76,0x0,1,bitdepth,10,cm,srgb
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
    '';
  };

  # Packages weee
  home.packages = with pkgs; [
    vscode
    ncspot
    vesktop
    bitwarden-desktop
    gcr
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
          -- define a custom Nord-based color scheme
          enable_tab_bar = false;
          hide_tab_bar_if_only_one_tab = true;
          color_scheme = "nord-from-nix";
          
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
  };
  
  programs.home-manager.enable = true;
  home.stateVersion = "25.05";
}
