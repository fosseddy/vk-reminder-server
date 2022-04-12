import { app } from "#src/app.mjs";

const port = 5000;
app.listen(port, () => console.log("Server is listening on port: %s", port));
