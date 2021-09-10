import * as http from "https://deno.land/std@0.106.0/http/mod.ts";
import * as io from "https://deno.land/std@0.106.0/io/mod.ts";

const envFile = await Deno.readTextFile(".env");
for (const line of envFile.trim().split("\n")) {
    const [key, value] = line.split("=");
    Deno.env.set(key, value);
}

const PORT = Number(Deno.env.get("PORT"));
const VK_GROUP_ID = Deno.env.get("VK_GROUP_ID");
const VK_TOKEN = Deno.env.get("VK_TOKEN");

if (!PORT || !VK_GROUP_ID || !VK_TOKEN) {
    console.error("env vars are not provided");
    Deno.exit(1);
}

const server = http.serve({ port: PORT });

for await (const req of server) {
    if (req.url !== "/messages" || req.method !== "POST") {
        const body = `
        <pre>
            Unhandled request url

            url: ${req.url}
            method: ${req.method}
        </pre>
        `;
        req.respond({ body });
        continue;
    }

    const bytes = await io.readAll(req.body);
    const str = new TextDecoder().decode(bytes);
    const body: { id: string } = JSON.parse(str);

    let res = await fetch(
        `https://api.vk.com/method/messages.isMessagesFromGroupAllowed?` +
        `group_id=${VK_GROUP_ID}&user_id=${body.id}&` +
        `access_token=${VK_TOKEN}&v=5.126`
    );

    res = await res.json();

    req.respond({ body: JSON.stringify(res) });
}
