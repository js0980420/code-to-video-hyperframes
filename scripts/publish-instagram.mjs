import fs from "fs";
import path from "path";

function findEnvFile() {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function loadEnv() {
  const envPath = findEnvFile();
  if (!envPath) return;
  const text = fs.readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      opts[key] = "true";
      continue;
    }
    opts[key] = next;
    i++;
  }
  return opts;
}

async function api(method, base, token, pathSeg, params = {}) {
  const url = new URL(`${base}/${pathSeg}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, { method });
      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(`IG API ${method} ${pathSeg} -> ${resp.status}\n${text}`);
      }
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      if (err.message?.startsWith("IG API")) throw err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw lastErr;
}

loadEnv();

const TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID ?? "me";
const BASE = "https://graph.instagram.com/v25.0";

if (!TOKEN) {
  console.error("Missing IG_ACCESS_TOKEN in .env");
  process.exit(1);
}

const opts = parseArgs(process.argv.slice(2));
const videoUrl = opts.url;
const caption = opts.caption ?? "";
const shareToFeed = opts["share-to-feed"] !== "false";
let coverUrl = opts.cover;

if (!videoUrl) {
  console.error(
    'Usage: node scripts/publish-instagram.mjs --url <https-mp4-url> [--caption "..."] [--cover <https-jpg-url>] [--share-to-feed false]',
  );
  process.exit(1);
}

if (!/^https:\/\//.test(videoUrl)) {
  console.error("Video URL must be HTTPS.");
  process.exit(1);
}

if (!coverUrl) {
  const derived = videoUrl
    .replace(/-threads\.mp4$/, "-reel.jpg")
    .replace(/-reel\.mp4$/, "-reel.jpg")
    .replace(/\.mp4$/, ".jpg");
  if (derived !== videoUrl) {
    coverUrl = derived;
    console.log(`Derived cover URL: ${coverUrl}`);
  }
}

if (coverUrl && !/^https:\/\//.test(coverUrl)) {
  console.error("Cover URL must be HTTPS.");
  process.exit(1);
}

async function main() {
  console.log("Instagram Reels publish");
  console.log(`video: ${videoUrl}`);
  if (coverUrl) console.log(`cover: ${coverUrl}`);
  console.log(`share_to_feed: ${shareToFeed}`);

  const created = await api("POST", BASE, TOKEN, `${IG_USER_ID}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    cover_url: coverUrl,
    share_to_feed: shareToFeed ? "true" : "false",
  });
  const creationId = created.id;
  console.log(`creation_id: ${creationId}`);

  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const status = await api("GET", BASE, TOKEN, creationId, {
      fields: "status_code,status",
    });
    process.stdout.write(
      `[${i + 1}/${maxAttempts}] status_code=${status.status_code}${status.status ? ` (${status.status})` : ""}        \r`,
    );
    if (status.status_code === "FINISHED") {
      console.log("\nProcessing complete");
      break;
    }
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`Container ${status.status_code}: ${status.status ?? "(no detail)"}`);
    }
    if (i === maxAttempts - 1) {
      throw new Error("Timed out waiting for Instagram processing.");
    }
  }

  const published = await api("POST", BASE, TOKEN, `${IG_USER_ID}/media_publish`, {
    creation_id: creationId,
  });
  console.log(`Published media id: ${published.id}`);

  try {
    const detail = await api("GET", BASE, TOKEN, published.id, {
      fields: "permalink,timestamp,media_type",
    });
    console.log(detail.permalink ?? `Published media id: ${published.id}`);
  } catch {
    console.log(`Published media id: ${published.id}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
