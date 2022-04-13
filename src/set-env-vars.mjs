import fs from "fs";

const content = fs.readFileSync(".env");

for (const line of content.toString().trim().split("\n")) {
	const [key, val] = line.split("=");
	process.env[key] = val;
}
