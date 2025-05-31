# /etc/nixos/modules/hardware/gpu/opengl.nix

{ config, pkgs, lib, ... }: {
  hardware.graphics = {
    enable = true;
    enable32Bit = true; # 32-bit backwards compatibility

    # Add Vulkan support packages
    extraPackages = with pkgs; [
      vulkan-loader
      vulkan-validation-layers
      vulkan-tools
      mesa
    ];

    # 32-bit Vulkan support for Steam games
    extraPackages32 = with pkgs.pkgsi686Linux; [
      vulkan-loader
      vulkan-validation-layers
      mesa
    ];
  };

  services.dbus.enable = true;

  # Ensure Vulkan environment variables are set
  environment.sessionVariables = {
    VK_LAYER_PATH =
      "${pkgs.vulkan-validation-layers}/share/vulkan/explicit_layer.d";
  };
}
