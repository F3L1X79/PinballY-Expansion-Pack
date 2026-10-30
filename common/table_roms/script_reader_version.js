// ============================================================
// Script Reader Version: the one place the vpxtool this Pack Version
// installs is named, with its Windows zip on the author's releases and its
// SHA-256 (docs/adr/0021). Raised once tried on the maintainer's cabinet.
// - The zip holds only vpxtool.exe; the pack never ships it.
// ============================================================

export const SCRIPT_READER_VERSION = Object.freeze({
    version: "0.38.0",
    zipUrl: "https://github.com/francisdb/vpxtool/releases/download/v0.38.0/vpxtool-windows-x86_64-v0.38.0.zip",
    sha256: "ea0b1da9408f6ee40d30f505c0aaaf5ac14c286076103d378d469c37c0d2b17d",
});
