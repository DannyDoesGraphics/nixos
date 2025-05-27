{ lib, ... }: {
  nix.gc = {
    automatic = true;
    dates = "weekly"; # any time in a week
    options = "--delete-older-than 10d";
  };
}
