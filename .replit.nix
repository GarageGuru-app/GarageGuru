# Replit Nix configuration for testing dependencies
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.npm
  ];
}