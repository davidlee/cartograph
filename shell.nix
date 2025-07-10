{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_24
  ];

  shellHook = ''
    echo "Entering Next.js development environment..."
    yarn install # Or npm install
  '';
}
