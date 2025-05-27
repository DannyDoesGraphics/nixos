# /etc/nixos/modules/hardware/security/fido2.nix
# FIDO2/WebAuthn security key support

{ config, pkgs, lib, ... }: {
  # Enable FIDO2/WebAuthn support
  security.pam.u2f.enable = true;

  # Install necessary packages for FIDO2 support
  environment.systemPackages = with pkgs; [
    libfido2
    pamu2fcfg
    yubikey-manager
    yubikey-personalization
  ];

  # Enable pcscd service for smart card support (needed for some security keys)
  services.pcscd = {
    enable = true;
    plugins = [ pkgs.ccid ];
  };

  # Add udev rules for FIDO2 devices
  services.udev.packages = with pkgs; [ libu2f-host yubikey-personalization ];

  # Enable hardware security for FIDO2
  hardware.nitrokey.enable = true;

  # Add users to plugdev group for hardware access
  users.groups.plugdev = { };
}
