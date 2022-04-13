import "./src/set-env-vars.mjs";
import { app } from "#src/app.mjs";

const { PORT } = process.env;
app.listen(PORT, () =>
	console.log("Server is listening on port:", PORT)
);
