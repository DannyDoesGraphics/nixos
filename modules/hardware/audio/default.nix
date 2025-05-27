# /etc/modules/

{ lib, pkgs, config, ... }: {
  services.pulseaudio.enable =
    false; # Must disable pulse audio, they're mutually exclusive
  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
    wireplumber.enable = true;
  };
}
