# /etc/nixos/home/yazi/default.nix
{ lib, config, pkgs, inputs, ... }: {
  config = {
    programs.yazi = {
      enable = true;

      # Configure Yazi settings
      settings = {
        manager = {
          # Show hidden files by default
          show_hidden = true;
          # Sort directories first
          sort_dir_first = true;
          # Use natural sorting for numbers
          sort_by = "natural";
        };

        # Configure the opener to use Neovim
        opener = {
          edit = [{
            run = ''nvim "$@"'';
            desc = "Edit with Neovim";
            block = true;
          }];
          text = [{
            run = ''nvim "$@"'';
            desc = "Edit with Neovim";
            block = true;
          }];
        };

        # File type associations
        open = {
          rules = [
            {
              mime = "text/*";
              use = "edit";
            }
            {
              mime = "application/json";
              use = "edit";
            }
            {
              mime = "application/x-nix";
              use = "edit";
            }
            {
              name =
                "*.{rs,toml,lock,md,txt,nix,js,ts,html,css,scss,lua,sh,zsh,bash,py}";
              use = "edit";
            }
          ];
        };
      };

      # Configure keymaps
      keymap = {
        manager.prepend_keymap = [
          {
            on = "e";
            run = "open --interactive";
            desc = "Open interactively";
          }
          {
            on = "<Enter>";
            run = [ "enter" "open --interactive" ];
            desc = "Enter directory or open file";
          }
        ];
      };

      # Configure Nord theme
      theme = {
        manager = {
          # Use Nord color palette
          cwd = { fg = "${config.ui.colors.palette.color8}"; };

          # File/directory colors
          hovered = {
            fg = "${config.ui.colors.palette.color6}";
            bg = "${config.ui.colors.palette.color1}";
          };
          preview_hovered = {
            fg = "${config.ui.colors.palette.color6}";
            bg = "${config.ui.colors.palette.color1}";
          };

          # Selection colors
          selected = {
            fg = "${config.ui.colors.palette.color13}";
            bg = "${config.ui.colors.palette.color2}";
          };

          # Border colors
          border_symbol = "│";
          border_style = { fg = "${config.ui.colors.palette.color3}"; };

          # Tab colors
          tab_active = {
            fg = "${config.ui.colors.palette.color6}";
            bg = "${config.ui.colors.palette.color1}";
          };
          tab_inactive = {
            fg = "${config.ui.colors.palette.color4}";
            bg = "${config.ui.colors.palette.color0}";
          };

          # File type colors
          syntect_theme = "Nord";
        };

        status = {
          separator_open = "";
          separator_close = "";
          separator_style = { fg = "${config.ui.colors.palette.color3}"; };

          # Mode colors
          mode_normal = {
            fg = "${config.ui.colors.palette.color0}";
            bg = "${config.ui.colors.palette.color8}";
            bold = true;
          };
          mode_select = {
            fg = "${config.ui.colors.palette.color0}";
            bg = "${config.ui.colors.palette.color13}";
            bold = true;
          };
          mode_unset = {
            fg = "${config.ui.colors.palette.color0}";
            bg = "${config.ui.colors.palette.color11}";
            bold = true;
          };

          # Progress bar
          progress_normal = { fg = "${config.ui.colors.palette.color8}"; };
          progress_error = { fg = "${config.ui.colors.palette.color11}"; };
        };

        input = {
          border = { fg = "${config.ui.colors.palette.color8}"; };
          title = { fg = "${config.ui.colors.palette.color6}"; };
          value = { fg = "${config.ui.colors.palette.color6}"; };
          selected = { bg = "${config.ui.colors.palette.color2}"; };
        };

        select = {
          border = { fg = "${config.ui.colors.palette.color8}"; };
          active = { fg = "${config.ui.colors.palette.color13}"; };
          inactive = { fg = "${config.ui.colors.palette.color4}"; };
        };

        tasks = {
          border = { fg = "${config.ui.colors.palette.color8}"; };
          title = { fg = "${config.ui.colors.palette.color6}"; };
          hovered = {
            fg = "${config.ui.colors.palette.color6}";
            bg = "${config.ui.colors.palette.color1}";
          };
        };

        which = {
          mask = { bg = "${config.ui.colors.palette.color0}"; };
          cand = { fg = "${config.ui.colors.palette.color8}"; };
          rest = { fg = "${config.ui.colors.palette.color4}"; };
          desc = { fg = "${config.ui.colors.palette.color5}"; };
          separator = " ~ ";
          separator_style = { fg = "${config.ui.colors.palette.color3}"; };
        };

        help = {
          on = { fg = "${config.ui.colors.palette.color13}"; };
          exec = { fg = "${config.ui.colors.palette.color8}"; };
          desc = { fg = "${config.ui.colors.palette.color5}"; };
          hovered = {
            bg = "${config.ui.colors.palette.color1}";
            bold = true;
          };
          footer = {
            fg = "${config.ui.colors.palette.color0}";
            bg = "${config.ui.colors.palette.color8}";
          };
        };

        filetype = {
          rules = [
            # Programming files
            {
              mime = "text/x-rust";
              fg = "${config.ui.colors.palette.color12}";
            }
            {
              mime = "text/x-nix";
              fg = "${config.ui.colors.palette.color9}";
            }
            {
              mime = "application/javascript";
              fg = "${config.ui.colors.palette.color13}";
            }
            {
              mime = "text/x-python";
              fg = "${config.ui.colors.palette.color14}";
            }

            # Config files
            {
              mime = "application/json";
              fg = "${config.ui.colors.palette.color13}";
            }
            {
              mime = "application/toml";
              fg = "${config.ui.colors.palette.color12}";
            }
            {
              mime = "text/x-yaml";
              fg = "${config.ui.colors.palette.color11}";
            }

            # Documents
            {
              mime = "text/markdown";
              fg = "${config.ui.colors.palette.color8}";
            }
            {
              mime = "text/plain";
              fg = "${config.ui.colors.palette.color5}";
            }

            # Media files
            {
              mime = "image/*";
              fg = "${config.ui.colors.palette.color15}";
            }
            {
              mime = "video/*";
              fg = "${config.ui.colors.palette.color11}";
            }
            {
              mime = "audio/*";
              fg = "${config.ui.colors.palette.color14}";
            }

            # Archives
            {
              mime = "application/zip";
              fg = "${config.ui.colors.palette.color12}";
            }
            {
              mime = "application/x-tar";
              fg = "${config.ui.colors.palette.color12}";
            }
            {
              mime = "application/gzip";
              fg = "${config.ui.colors.palette.color12}";
            }
          ];
        };
      };
    };
  };
}
