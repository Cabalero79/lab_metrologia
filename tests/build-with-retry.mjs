import { spawn } from "node:child_process";

const maximumAttempts = 3;
const retryDelayMilliseconds = 350;

function runBuild() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    throw new Error("npm_execpath não está definido; execute com `npm run test:build`");
  }

  return new Promise((resolve, reject) => {
    // Calling npm-cli through the current Node executable avoids Windows'
    // inconsistent `.cmd` spawning rules without enabling a command shell.
    const child = spawn(process.execPath, [npmCli, "run", "build"], {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      windowsHide: true,
    });
    let combinedOutput = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(text);
    });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code: code ?? 1, combinedOutput }));
  });
}

for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
  const result = await runBuild();
  if (result.code === 0) process.exit(0);

  const isTransientWindowsLock =
    process.platform === "win32" && /\bEBUSY\b|resource busy or locked/i.test(result.combinedOutput);
  if (!isTransientWindowsLock || attempt === maximumAttempts) {
    process.exit(result.code);
  }

  process.stderr.write(
    `Build encontrou um bloqueio transitório do Windows; repetindo (${attempt + 1}/${maximumAttempts}).\n`,
  );
  await new Promise((resolve) => setTimeout(resolve, retryDelayMilliseconds * attempt));
}
