# /etc/nixos/hosts/dannyspc/configuration.nix

{ pkgs, libs, inputs, config, ... }:
{
  imports = [
    ./hardware-configuration.nix
    ../../modules/nixos/user.nix
    ../../modules/hardware/gpu/nvidia.nix
    ../../modules/hardware/gpu/opengl.nix
    ../../modules/hardware/audio/default.nix
    ../../modules/wm/hyprland/default.nix
    inputs.home-manager.nixosModules.default
  ];
  nixpkgs.config.allowUnfree = true;
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Multi-threaded
  nix.settings = {
    max-jobs = "auto";
    cores = 0; # use all cores
    build-cores = 0; # use all cores
  };

  # Networking
  networking = {
    hostName = "dannyspc";
    networkmanager.enable = true;
  };
  time.timeZone = "America/Toronto";
  i18n.defaultLocale = "en_CA.UTF-8";
  services.printing.enable = true;
  # Video (moved to hyprland/default.nix

  # GPU config
  nvidia.xserver = true;

  # Programs
  environment.systemPackages = with pkgs; [
    vim
    wget
    curl
    git
    tree
    wezterm
    ffmpeg
    vulkan-loader
    vulkan-tools
    vulkan-validation-layers
    xdg-desktop-portal
    xdg-utils
    unzip
    pavucontrol
    jetbrains.rust-rover
    code-cursor
  ];
  programs = {
    zsh = {
      enable = true;
      autosuggestions.enable = true;
      syntaxHighlighting.enable = true;
      enableCompletion = true;
      ohMyZsh = {
        enable = true;
        plugins = [ "git" ];
      };
    };
    hyprland = {
      enable = true;
      package = inputs.hyprland.packages."${pkgs.system}".hyprland;
      portalPackage = inputs.hyprland.packages.${pkgs.stdenv.hostPlatform.system}.xdg-desktop-portal-hyprland;
      xwayland.enable = true;
    };
  };
  security.pam.services.login.enableGnomeKeyring = true;
  security.polkit.enable = true;

  # Security
  systemd = {
      user.services.polkit-gnome-authentication-agent-1 = {
        description = "polkit-gnome-authentication-agent-1";
        wantedBy = [ "graphical-session.target" ];
        wants = [ "graphical-session.target" ];
        after = [ "graphical-session.target" ];
        serviceConfig = {
          Type = "simple";
          ExecStart = "${pkgs.hyprland}/bin/hyprpolkitagent";
          Restart = "on-failure";
          RestartSec = 1;
          TimeoutStopSec = 10;
       };
    };
  };
  nix.settings.trusted-users = [
    "@wheel"
  ];

  # Fonts
  fonts.packages = with pkgs; [
    nerd-fonts.jetbrains-mono
  ];

  # user def
  user = {
    enable = true;
    full_name = "Danny Le";
    namespace = "danny";
    home_file = ./home.nix;
  };
}
