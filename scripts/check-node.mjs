// Fail fast with a clear message when running on the wrong Node.
// Native modules (better-sqlite3) are built for Node 22 — see .nvmrc.
const major = Number(process.versions.node.split(".")[0]);
if (major !== 22) {
  console.error(
    `\n  \u2717 the-resume-thing needs Node 22 (native modules are compiled for it).` +
      `\n    You're on ${process.version}. Fix:  nvm use   (reads .nvmrc \u2192 22), then re-run.\n`,
  );
  process.exit(1);
}
