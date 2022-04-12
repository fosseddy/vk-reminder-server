import express from "express";

const app = express();

app.get("/", (req, res) => {
	res.send("<h1>hello, world</h1>\n");
});

export { app };
