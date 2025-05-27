# /etc/nixos/modules/hardware/security/fido2.nix
# FIDO2/WebAuthn security key support

{ config, pkgs, lib, ... }: {
  # Enable FIDO2/WebAuthn support
  security.pam.u2f = {
    enable = true;
    # Control file location for U2F mappings
    control = "sufficient"; # Allow YubiKey OR password
    # For more security, use "required" to force YubiKey AND password
  };

  # Configure PAM for sudo with YubiKey support
  security.pam.services.sudo.u2fAuth = true;

  # Configure PAM for login with YubiKey support  
  security.pam.services.login.u2fAuth = true;

  # Configure PAM for display manager (SDDM) with YubiKey support
  security.pam.services.sddm.u2fAuth = true;

  # Install necessary packages for FIDO2 support
  environment.systemPackages = with pkgs; [
    libfido2
    yubikey-manager
    yubikey-personalization
    pamu2fcfg # Tool to configure U2F for PAM
    yubikey-manager-qt # GUI for YubiKey management
    yubico-piv-tool # PIV (smart card) functionality
  ];

  # Enable pcscd service for smart card support (needed for some security keys)
  services.pcscd = {
    enable = true;
    plugins = [ pkgs.ccid ];
  };
  security.pam.services = {
    login.u2fAuth = true;
    sudo.u2fAuth = true;
  };

  # Add udev rules for FIDO2 devices
  services.udev.packages = with pkgs; [ libu2f-host yubikey-personalization ];

  # Enable hardware security for FIDO2
  hardware.nitrokey.enable = true;

  # Add users to plugdev group for hardware access
  users.groups.plugdev = { };
}
