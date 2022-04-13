import fs from "fs";

const content = fs.readFileSync(".env", { encoding: "utf8" });

for (const line of content.trim().split("\n")) {
	const [key, val] = line.split("=");
	process.env[key] = val;
}
