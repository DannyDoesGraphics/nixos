# /etc/nixos/modules/user.nix

{ lib, pkgs, config, ... }: {
  options = {
    user = {
      enable = lib.mkEnableOption "This user";
      full_name = lib.mkOption {
        type = lib.types.str;
        description = "This user's full name";
      };
      namespace = lib.mkOption {
        type = lib.types.str;
        description = "A unique namespace for the user";
      };
      extra_groups = lib.mkOption {
        type = lib.types.listOf lib.types.str;
        default = [ "wheel" "networkmanager" "audio" "plugdev" ];
        description = "Extra groups to add to the user";
      };
      home_file = lib.mkOption {
        type = lib.types.path;
        description = "Path to home.nix file";
      };
      shell = lib.mkOption {
        type = lib.types.package;
        default = pkgs.zsh;
        description = "The user's default login shell";
      };
    };
  };

  config = lib.mkIf config.user.enable {
    users.users.${config.user.namespace} = {
      isNormalUser = true;
      description = config.user.full_name;
      extraGroups = config.user.extra_groups;
      shell = config.user.shell;
    };
    home-manager.users.${config.user.namespace} = import config.user.home_file;
  };
}
