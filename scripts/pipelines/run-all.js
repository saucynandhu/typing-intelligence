const { spawn } = require("node:child_process");
const path = require("node:path");

const pipeline = [
  "extract-features.js",
  "update-personal-model.js",
  "update-sequence-model.js",
  "update-global-model.js",
  "update-bandit-state.js"
];

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const file = path.join(__dirname, scriptName);
    const child = spawn("node", [file], { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} failed with code ${code}`));
    });
  });
}

async function main() {
  for (const script of pipeline) {
    console.log(`\n[pipeline] running ${script}`);
    await runScript(script);
  }
  console.log("\n[pipeline] complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
