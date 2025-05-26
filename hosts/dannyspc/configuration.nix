# /etc/nixos/hosts/dannyspc/configuration.nix

{ pkgs, libs, inputs, config, ... }:
{
  imports = [
    ./hardware-configuration.nix
    ../../modules/nixos/user.nix
    inputs.home-manager.nixosModules.default
  ];
  nixpkgs.config.allowUnfree = true;
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Networking
  networking = {
    hostName = "dannyspc";
    networkmanager.enable = true;
  };
  time.timeZone = "America/Toronto";
  i18n.defaultLocale = "en_CA.UTF-8";
  services.printing.enable = true;

  # Audio
  services.pulseaudio.enable = false;
  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
    wireplumber.enable = true;
  };
  # Video
  services.xserver = {
    enable = true;
    videoDrivers = [ "nvidia" ];
  };
  services.displayManager = {
    sddm.enable = true;
    sddm.wayland.enable = true;
    defaultSession = "hyprland";
  };
  xdg.portal = {
    enable = true;
    xdgOpenUsePortal = true;
    config = {
      common.default = ["*"];
      hyprland.default = ["gtk" "hyprland"];
    };
  };

  # GPU
  nixpkgs.config.nvidia.acceptLicense = true;
  hardware.nvidia = {
    modesetting.enable = true;
    nvidiaSettings = true;
    open = false; # Use proprietary drivers
    package = config.boot.kernelPackages.nvidiaPackages.production;
  };
  hardware.graphics.enable = true;
  hardware.graphics.enable32Bit = true; # 32-bit backwards compatability
  services.dbus.enable = true;

  # Programs
  environment.systemPackages = with pkgs; [
    vim
    wget
    curl
    git
    tree
    wezterm
    vscode
    ffmpeg
    vulkan-loader
    vulkan-tools
    vulkan-validation-layers
    xdg-desktop-portal
    unzip
  ];
  programs = {
    zsh = {
      enable = true;
      autosuggestions.enable = true;
      syntaxHighlighting.enable = true;
      enableCompletion = true;
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
  # Env vars
  environment.variables = {
    XDG_CURRENT_DESKTOP = "Hyprland";
    XDG_SESSION_DESKTOP = "Hyprland";
    XDG_SESSION_TYPE    = "wayland";
  };

  environment.sessionVariables = {
    MOZ_ENABLE_WAYLAND = "1";
    NIXOS_OZONE_WL     = "1";
    T_QPA_PLATFORM     = "wayland";
    GDK_BACKEND        = "wayland";
    WLR_NO_HARDWARE_CURSORS = "1";
  };

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
