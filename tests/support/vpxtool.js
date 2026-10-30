// ============================================================
// A cabinet with vpxtool installed in the pack's tools folder, for scenarios
// that start every Add-on on: without it, Table ROMs logs an error at init.
// It answers --version with the Script Reader Version, any table with a
// script that loads no ROM. Never loaded by PinballY.
// ============================================================

const VPXTOOL = "C:\\PinballY\\Scripts\\ExpansionPack\\tools\\vpxtool.exe";

export const installVpxtool = fake => fake.addProgram(VPXTOOL, args => ({ output: args[0] === "--version" ? "vpxtool git:v0.38.0\n" : "" }));
