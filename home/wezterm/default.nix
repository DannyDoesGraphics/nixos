# /etc/nixos/home/wezterm/default.nix
{ lib, ... }: {
  packages.wezterm = {
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
}
