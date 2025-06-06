# /etc/nixos/hosts/dannyspc/configuration.nix

{ pkgs, libs, inputs, config, ... }: {
  imports = [
    ./hardware-configuration.nix
    ../../modules/nixos/user.nix
    ../../modules/hardware/gpu/nvidia.nix
    ../../modules/hardware/gpu/opengl.nix
    ../../modules/hardware/audio/default.nix
    ../../modules/hardware/security/fido2.nix
    ../../modules/wm/hyprland/default.nix
    ../../modules/colors/default.nix
    ../../modules/system/autoupgrade.nix
    ../../modules/system/gc.nix
    ../../modules/ollama/default.nix
    ../../modules/gaming/steam.nix
    inputs.home-manager.nixosModules.default
  ];

  # Configure color scheme at system level
  nixpkgs.config.allowUnfree = true;
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Add kernel parameters for better GPU stability and performance
  boot.kernelParams = [
    "nvidia-drm.modeset=1"
    "nvidia-drm.fbdev=1"
    "nvidia.NVreg_PreserveVideoMemoryAllocations=1"
    "nvidia.NVreg_TemporaryFilePath=/var/tmp"
  ];

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
  # Video (moved to hyprland/default.nix)

  # GPU config
  nvidia.xserver = true;

  # Gaming configuration
  gaming.steam.enable = true;

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
    #xdg-desktop-portal
    #xdg-desktop-portal-gtk
    xdg-utils
    unzip
    nixfmt
    time
    nordzy-cursor-theme # Your cursor theme
    # GTK4 and layer shell support
    # gamescope - moved to gaming module
    gtk4
    gtk4-layer-shell
    gobject-introspection
    glib
    openrgb-with-all-plugins
    i2c-tools
    usbutils
    pciutils
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
  };
  security.pam.services.login.enableGnomeKeyring = true;
  security.polkit.enable = true;

  # Security
  nix.settings.trusted-users = [ "@wheel" ];

  # Fonts
  fonts.packages = with pkgs; [ nerd-fonts.jetbrains-mono ];

  # user def
  user = {
    enable = true;
    full_name = "Danny Le";
    namespace = "danny";
    home_file = ./home.nix;
  };

  # OpenRGB service for RGB hardware control
  services.hardware.openrgb = {
    enable = true;
    package = pkgs.openrgb-with-all-plugins;
  };

  # Additional hardware support for RGB devices
  hardware.i2c.enable = true;
}
