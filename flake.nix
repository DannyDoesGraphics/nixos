# /etc/nixos/flake.nix

{
  description = "Root flake";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    hyprland.url = "github:hyprwm/Hyprland";
    hyprutils = {
      url = "github:hyprwm/HyprUtils";
      inputs.nixpkgs.follows = "hyprland/nixpkgs";
    };
    hyprpolkitagent = {
      url = "github:hyprwm/HyprPolkitAgent";
      inputs.nixpkgs.follows = "hyprland/nixpkgs";
      inputs.hyprutils.follows = "hyprutils";
    };
    hyprcursor = {
      url = "github:hyprwm/HyprCursor";
      inputs.nixpkgs.follows = "hyprland/nixpkgs";
    };
    hyprlock = {
      url = "github:hyprwm/Hyprlock";
      inputs.nixpkgs.follows = "hyprland/nixpkgs";
      inputs.hyprutils.follows = "hyprutils";
    };
    #waybar = {
    #  url = "github:alexays/waybar";
    #  inputs.nixpkgs.follows = "nixpkgs";
    #};
    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nil = {
      url = "github:oxalica/nil";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    zen-browser = {
      url = "github:0xc000022070/zen-browser-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    helix = {
      url = "github:helix-editor/helix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = { self, nixpkgs, astal, ags, ... }@inputs:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      packages.${system}.default = pkgs.stdenvNoCC.mkDerivation rec {
        name = "my-shell";
        src = ./home/ags;
        nativeBuildInputs = [
          ags.packages.${system}.default
          pkgs.wrapGAppsHook
          pkgs.gobject-introspection
        ];

        buildInputs = with astal.packages.${system}; [
          astal4
          io
          # any other package
        ];

        extraPackages = with astal.packages.${system};
          [
            # hyprland package moved to home.nix for CLI access
          ];

        installPhase = ''
          mkdir -p $out/bin
          ags bundle app.ts $out/bin/${name}
        '';
      };

      nixosConfigurations = {
        default = nixpkgs.lib.nixosSystem {
          specialArgs = { inherit inputs; };
          modules = [
            ./hosts/dannyspc/configuration.nix
            inputs.home-manager.nixosModules.default
          ];
        };
      };
    };
}
