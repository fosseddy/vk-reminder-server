// set env
import { readFile } from "fs/promises";

let err = null;
const content = await readFile(".env", { encoding: "utf8" }).catch(e => err = e);
if (err) {
	console.error(err);
	process.exit(1);
}

for (const line of content.trim().split("\n")) {
	const [key, val] = line.split("=");
	process.env[key] = val;
}

console.log(process.env.VK_TOKEN);

import { app } from "#src/app.mjs";

const port = 5000;
app.listen(port, () => console.log("Server is listening on port: %s", port));
