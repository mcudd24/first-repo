import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME = "/root/.cache/puppeteer/chrome/linux-148.0.7778.167/chrome-linux64/chrome";
const ENTRY  = path.join(__dirname, "remotion/index.ts");
const OUT    = path.join(__dirname, "out/zinzino-viral.mp4");

console.log("Bundling…");
const bundled = await bundle({ entryPoint: ENTRY });

console.log("Selecting composition…");
const comp = await selectComposition({
  serveUrl: bundled,
  id: "ZinzinoViral",
  browserExecutable: CHROME,
});

console.log("Rendering… (this takes a few minutes)");
await renderMedia({
  composition: comp,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: OUT,
  browserExecutable: CHROME,
  onProgress: ({ progress }) => {
    process.stdout.write(`\r${(progress * 100).toFixed(1)}%`);
  },
});

console.log("\nDone →", OUT);
