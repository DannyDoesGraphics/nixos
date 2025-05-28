{ config, pkgs, lib, ... }: {
  home.packages = [ pkgs.brightnessctl ];
  services.hypridle = {
    enable = true;
    general = {
      lock_cmd = "pidof hyprlock || hyprlock";
      before_sleep_cmd = "hypridle --lock";
      after_wake_cmd = "hypridle --unlock";
    };
    listener = [{
      timeout = 300;
      on-timeout = "loginctl lock-session";
    }];
  };
}
