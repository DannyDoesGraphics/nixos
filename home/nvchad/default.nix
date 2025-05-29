# /etc/nixos/home/nvchad/default.nix
{ lib, config, pkgs, inputs, ... }: {
  config = {
    programs.nvchad = {
      enable = true;
      extraPackages = with pkgs; [ ];

      # Custom chadrc configuration with Nord theme and transparent background
      chadrcConfig = ''
        local M = {}

        -- Import the nord color palette from our Nix configuration
        M.ui = {
          theme = "nord",
          
          -- Make background transparent
          transparency = true,
          
          hl_override = {
            -- Override background colors to be transparent
            Normal = { bg = "NONE" },
            NormalFloat = { bg = "NONE" },
            SignColumn = { bg = "NONE" },
            StatusLine = { bg = "NONE" },
            TabLine = { bg = "NONE" },
            TabLineFill = { bg = "NONE" },
            VertSplit = { bg = "NONE" },
            -- Keep foreground colors from Nord theme
            Comment = { fg = "${config.ui.colors.palette.color3}", italic = true },
            Keyword = { fg = "${config.ui.colors.palette.color9}" },
            String = { fg = "${config.ui.colors.palette.color14}" },
            Function = { fg = "${config.ui.colors.palette.color8}" },
            Identifier = { fg = "${config.ui.colors.palette.color7}" },
            Type = { fg = "${config.ui.colors.palette.color9}" },
            Constant = { fg = "${config.ui.colors.palette.color15}" },
            Special = { fg = "${config.ui.colors.palette.color12}" },
            PreProc = { fg = "${config.ui.colors.palette.color10}" },
            Error = { fg = "${config.ui.colors.palette.color11}" },
            Warning = { fg = "${config.ui.colors.palette.color13}" },
            Information = { fg = "${config.ui.colors.palette.color8}" },
            Hint = { fg = "${config.ui.colors.palette.color7}" },
          },
          
          hl_add = {
            -- Additional Nord-themed highlights
            NvimTreeNormal = { bg = "NONE" },
            NvimTreeNormalNC = { bg = "NONE" },
            TelescopeNormal = { bg = "NONE" },
            TelescopeBorder = { fg = "${config.ui.colors.palette.color3}", bg = "NONE" },
            WhichKeyFloat = { bg = "NONE" },
          }
        }

        M.plugins = "custom.plugins"
        M.mappings = require "custom.mappings"

        return M
      '';

      # Additional Lua configuration for transparent background
      extraConfig = ''
        -- Force transparent background for all components
        vim.cmd("highlight Normal guibg=NONE ctermbg=NONE")
        vim.cmd("highlight NormalFloat guibg=NONE ctermbg=NONE")
        vim.cmd("highlight SignColumn guibg=NONE ctermbg=NONE")
        vim.cmd("highlight StatusLine guibg=NONE ctermbg=NONE")
        vim.cmd("highlight TabLine guibg=NONE ctermbg=NONE")
        vim.cmd("highlight TabLineFill guibg=NONE ctermbg=NONE")
        vim.cmd("highlight VertSplit guibg=NONE ctermbg=NONE")
        vim.cmd("highlight NvimTreeNormal guibg=NONE ctermbg=NONE")
        vim.cmd("highlight NvimTreeNormalNC guibg=NONE ctermbg=NONE")
        vim.cmd("highlight TelescopeNormal guibg=NONE ctermbg=NONE")
        vim.cmd("highlight WhichKeyFloat guibg=NONE ctermbg=NONE")

        -- Set Nord colors for syntax highlighting using our Nix color palette
        vim.cmd("highlight Comment guifg=${config.ui.colors.palette.color3} gui=italic")
        vim.cmd("highlight Keyword guifg=${config.ui.colors.palette.color9}")
        vim.cmd("highlight String guifg=${config.ui.colors.palette.color14}")
        vim.cmd("highlight Function guifg=${config.ui.colors.palette.color8}")
        vim.cmd("highlight Identifier guifg=${config.ui.colors.palette.color7}")
        vim.cmd("highlight Type guifg=${config.ui.colors.palette.color9}")
        vim.cmd("highlight Constant guifg=${config.ui.colors.palette.color15}")
        vim.cmd("highlight Special guifg=${config.ui.colors.palette.color12}")
        vim.cmd("highlight PreProc guifg=${config.ui.colors.palette.color10}")
        vim.cmd("highlight Error guifg=${config.ui.colors.palette.color11}")
        vim.cmd("highlight Warning guifg=${config.ui.colors.palette.color13}")
        vim.cmd("highlight Information guifg=${config.ui.colors.palette.color8}")
        vim.cmd("highlight Hint guifg=${config.ui.colors.palette.color7}")

        -- Ensure terminal colors match our Nord palette
        vim.g.terminal_color_0 = "${config.ui.colors.palette.color0}"
        vim.g.terminal_color_1 = "${config.ui.colors.palette.color11}"
        vim.g.terminal_color_2 = "${config.ui.colors.palette.color14}"
        vim.g.terminal_color_3 = "${config.ui.colors.palette.color13}"
        vim.g.terminal_color_4 = "${config.ui.colors.palette.color9}"
        vim.g.terminal_color_5 = "${config.ui.colors.palette.color15}"
        vim.g.terminal_color_6 = "${config.ui.colors.palette.color8}"
        vim.g.terminal_color_7 = "${config.ui.colors.palette.color5}"
        vim.g.terminal_color_8 = "${config.ui.colors.palette.color3}"
        vim.g.terminal_color_9 = "${config.ui.colors.palette.color11}"
        vim.g.terminal_color_10 = "${config.ui.colors.palette.color14}"
        vim.g.terminal_color_11 = "${config.ui.colors.palette.color13}"
        vim.g.terminal_color_12 = "${config.ui.colors.palette.color9}"
        vim.g.terminal_color_13 = "${config.ui.colors.palette.color15}"
        vim.g.terminal_color_14 = "${config.ui.colors.palette.color8}"
        vim.g.terminal_color_15 = "${config.ui.colors.palette.color6}"
      '';
    };
  };
}
