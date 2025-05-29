# /etc/nixos/modules/ollama/default.nix

{ lib, config, pkgs, ... }:

{
  config = {
    # Ollama service with CUDA acceleration
    services.ollama = {
      enable = true;
      acceleration = "cuda";
      environmentVariables = {
        CUDA_VISIBLE_DEVICES = "0";
        NVIDIA_VISIBLE_DEVICES = "all";
      };
    };
  };
}
