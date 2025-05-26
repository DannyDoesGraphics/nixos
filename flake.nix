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
    hyprpaper = {
      url = "github:hyprwm/Hyprpaper";
      inputs.nixpkgs.follows = "hyprland/nixpkgs";
      inputs.hyprutils.follows = "hyprutils";
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
    nil = {
      url = "github:oxalica/nil";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = { self, nixpkgs, ... } @ inputs: {
    nixosConfigurations = {
      default = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs; };
        modules = [
          ./hosts/dannyspc/configuration.nix
          inputs.home-manager.nixosModules.default
        ];
      };
    };
  };
}
