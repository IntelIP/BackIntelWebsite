import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

const framesDir = option("--frames");
const output = option("--output");
const framePattern = option("--pattern") || "frame-%03d.jpg";
const framesPerSecond = Number(option("--fps") || "10");
const isGifOutput = output?.toLowerCase().endsWith(".gif");
const outputFramesPerSecond = Number(
  option("--output-fps") || (isGifOutput ? "6" : String(framesPerSecond)),
);
const outputWidth = Number(
  option("--width") || (isGifOutput ? "640" : "1264"),
);
const paletteColors = Number(option("--colors") || "48");

if (
  !framesDir ||
  !output ||
  !Number.isInteger(framesPerSecond) ||
  framesPerSecond < 1 ||
  !Number.isInteger(outputFramesPerSecond) ||
  outputFramesPerSecond < 1 ||
  !Number.isInteger(outputWidth) ||
  outputWidth < 160 ||
  !Number.isInteger(paletteColors) ||
  paletteColors < 2 ||
  paletteColors > 256
) {
  console.error("Usage: npm run assets:demo -- --frames <directory> --output <gif-or-mp4> [--fps 10 --output-fps 6]");
  process.exit(1);
}

const inputPattern = resolve(framesDir, framePattern);
const outputPath = resolve(output);
const framePlaceholder = framePattern.match(/%(0?)(\d+)d/);
if (!framePlaceholder) {
  console.error(`Frame pattern must include a printf-style number placeholder: ${framePattern}`);
  process.exit(1);
}
const firstFrameNumber = String(1).padStart(Number(framePlaceholder[2]), "0");
const firstFramePath = inputPattern.replace(/%(0?)(\d+)d/, firstFrameNumber);
if (!existsSync(firstFramePath)) {
  console.error(`Missing first frame: ${firstFramePath}`);
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
const isGif = outputPath.toLowerCase().endsWith(".gif");
const filter = isGif
  ? `fps=${outputFramesPerSecond},scale=${outputWidth}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${paletteColors}[p];[s1][p]paletteuse=dither=none`
  : `fps=${outputFramesPerSecond},scale=${outputWidth}:-2:flags=lanczos`;
const result = spawnSync(
  process.env.FFMPEG_BIN || "ffmpeg",
  [
    "-y",
    "-framerate",
    String(framesPerSecond),
    "-i",
    inputPattern,
    "-vf",
    filter,
    ...(isGif
      ? ["-gifflags", "+transdiff", "-loop", "0"]
      : ["-c:v", "libx264", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]),
    outputPath,
  ],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`Could not run ffmpeg: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
