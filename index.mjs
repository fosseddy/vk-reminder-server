import { readFileSync } from "fs";

// set env vars
const content = readFileSync(".env", { encoding: "utf8" });
for (const line of content.trim().split("\n")) {
  const [key, val] = line.split("=");
  process.env[key] = val;
}

const { app } = await import("#src/app.mjs").catch(err => {
  console.error(err);
  process.exit(1);
});

const { PORT } = process.env;
app.listen(PORT, () => console.log("Server is listening on port:", PORT));
