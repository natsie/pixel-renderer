import { spawn } from "node:child_process";
import { cp, rm, watch } from "node:fs/promises";

const _server = spawn("pwsh", ["-Command", "npx ns . 8080"], { stdio: "inherit" });
const _compiler = spawn("pwsh", ["-Command", "npx tsc --watch"], { stdio: "inherit" });
const pushToWebDirectory = async () => {
  await rm("./web/js/pixel/", { force: true, recursive: true }).catch(() => {});
  await cp("./dist/", "./web/js/pixel/", {
    force: true,
    recursive: true,
    preserveTimestamps: true,
  }).catch((error) => {
    console.log("Failed to copy compiled JavaScript files.");
    console.log(error);
  });
};

await pushToWebDirectory()

const eyes = watch("./dist/");
let timeout = void 0
for await (const _observation of eyes) {
  clearTimeout(timeout);
  timeout = setTimeout(pushToWebDirectory, 500);
}
