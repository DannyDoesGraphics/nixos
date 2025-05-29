# /etc/nixos/home/nvchad/default.nix
{ lib, config, pkgs, inputs, ... }: {
  config = {
    programs.nvchad = {
      enable = true;
      # Rust development packages
      extraPackages = with pkgs; [
        # Rust toolchain
        rustc
        cargo
        clippy
        rustfmt
        rust-analyzer

        # Additional development tools
        gcc
        pkg-config
      ];

      # Simple chadrc configuration with Nord theme and transparency
      chadrcConfig = ''
        local M = {}

        M.ui = {
          theme = "nord",
          transparency = true,
          
          hl_override = {
            -- Make backgrounds transparent - let terminal handle background
            Normal = { bg = "NONE" },
            NormalFloat = { bg = "NONE" },
            SignColumn = { bg = "NONE" },
            StatusLine = { bg = "NONE" },
            TabLine = { bg = "NONE" },
            TabLineFill = { bg = "NONE" },
            VertSplit = { bg = "NONE" },
            NvimTreeNormal = { bg = "NONE" },
            NvimTreeNormalNC = { bg = "NONE" },
            TelescopeNormal = { bg = "NONE" },
            WhichKeyFloat = { bg = "NONE" },
          }
        }

        M.plugins = "custom.plugins"
        M.mappings = require "custom.mappings"

        return M
      '';

      # Minimal config focused on transparency and Rust support
      extraConfig = ''
        -- Ensure transparent background for all UI elements
        vim.cmd("highlight Normal guibg=NONE ctermbg=NONE")
        vim.cmd("highlight NormalFloat guibg=NONE ctermbg=NONE")
        vim.cmd("highlight SignColumn guibg=NONE ctermbg=NONE")
        vim.cmd("highlight StatusLine guibg=NONE ctermbg=NONE")
        vim.cmd("highlight NvimTreeNormal guibg=NONE ctermbg=NONE")
        vim.cmd("highlight TelescopeNormal guibg=NONE ctermbg=NONE")

        -- Rust-specific configuration
        vim.g.rustfmt_autosave = 1
        vim.g.rust_clip_command = 'wl-copy'

        -- Configure Rust LSP
        require('lspconfig').rust_analyzer.setup({
          settings = {
            ['rust-analyzer'] = {
              checkOnSave = {
                command = 'clippy'
              },
              cargo = {
                allFeatures = true,
                loadOutDirsFromCheck = true,
                runBuildScripts = true,
              },
              procMacro = {
                enable = true
              },
            }
          }
        })
      '';
    };
  };
}
