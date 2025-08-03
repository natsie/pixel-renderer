import { exec } from "node:child_process";
import { promisify } from "node:util";

await promisify(exec)("npx tsc")
  .then(() => {
    console.log("Successfully compiled source files.")
  })
  .catch((error) => {
  console.log("Failed to compile TypeScript files.");
  console.log(String(error.stderr));
});


