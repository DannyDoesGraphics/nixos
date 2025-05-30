# /etc/nixos/home/wezterm/default.nix
{ lib, config, ... }: {
  config = {
    programs.wezterm = {
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
          max_fps = 240,

          -- define a custom Nord-based color scheme
          enable_tab_bar = false;
          hide_tab_bar_if_only_one_tab = true;
          window_background_opacity = 0.9;
          
          colors = {
            foreground = palette.color6;
            background = palette.color0;

            ansi = {
              palette.color1,  -- black (dark grey)
              palette.color11, -- red  
              palette.color14, -- green
              palette.color13, -- yellow
              palette.color9,  -- blue
              palette.color15, -- magenta
              palette.color8,  -- cyan
              palette.color5,  -- white
            };

            brights = {
              palette.color3,  -- bright black (grey)
              palette.color11, -- bright red
              palette.color14, -- bright green  
              palette.color13, -- bright yellow
              palette.color10, -- bright blue
              palette.color15, -- bright magenta
              palette.color7,  -- bright cyan
              palette.color6,  -- bright white
            };

            -- you can also remap things like cursor/bg/selection:
            cursor_bg    = palette.color5;
            selection_bg = palette.color2;
          }
        }
      '';
    };
  };
}
