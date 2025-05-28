{
  description = "Rust development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };
        # Read the file relative to the flake's root
        overrides = (builtins.fromTOML
          (builtins.readFile (self + "/rust-toolchain.toml")));
        rustVersion = overrides.toolchain.channel;
        rust = pkgs.rust-bin.${rustVersion}.latest.default.override {
          extensions = [ "rust-src" ];
        };

        rustPlatform = pkgs.makeRustPlatform {
          cargo = rust;
          rustc = rust;
        };

        libPath = with pkgs;
          lib.makeLibraryPath [
            # load external libraries that you need in your rust project here
          ];
      in {
        packages.default = rustPlatform.buildRustPackage rec {
          pname = "rotate";
          version = "0.1.0";

          src = ./.;

          cargoLock = { lockFile = ./Cargo.lock; };

          nativeBuildInputs = with pkgs; [ pkg-config ];

          buildInputs = with pkgs;
            [
              # Add any runtime dependencies here
            ];

          # Set any environment variables needed for compilation
          RUSTC_VERSION = rustVersion;
        };
        devShells.default = pkgs.mkShell rec {
          nativeBuildInputs = [ pkgs.pkg-config ];
          buildInputs = with pkgs; [ rust clang llvmPackages.bintools ];

          RUSTC_VERSION = rustVersion;

          # https://github.com/rust-lang/rust-bindgen#environment-variables
          LIBCLANG_PATH =
            pkgs.lib.makeLibraryPath [ pkgs.llvmPackages_latest.libclang.lib ];

          shellHook = ''
            export PATH=$PATH:${rust}/bin
          '';

          # Add precompiled library to rustc search path
          RUSTFLAGS = (builtins.map (a: "-L ${a}/lib") [
            # add libraries here (e.g. pkgs.libvmi)
          ]);

          LD_LIBRARY_PATH =
            pkgs.lib.makeLibraryPath (buildInputs ++ nativeBuildInputs);

          # Add glibc, clang, glib, and other headers to bindgen search path
          BINDGEN_EXTRA_CLANG_ARGS =
            # Includes normal include path
            (builtins.map (a: ''-I"${a}/include"'') [
              # add dev libraries here (e.g. pkgs.libvmi.dev)
              pkgs.glibc.dev
            ])
            # Includes with special directory paths
            ++ [
              ''
                -I"${pkgs.llvmPackages_latest.libclang.lib}/lib/clang/${pkgs.llvmPackages_latest.libclang.version}/include"''
              ''-I"${pkgs.glib.dev}/include/glib-2.0"''
              "-I${pkgs.glib.out}/lib/glib-2.0/include/"
            ];
        };
      });
}
