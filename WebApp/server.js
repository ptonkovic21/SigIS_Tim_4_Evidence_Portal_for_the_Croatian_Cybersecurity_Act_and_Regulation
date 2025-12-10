import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "")));

app.get("/", (req, res) => {
	res.redirect("/dashboard");
});

app.get("/index", (req, res) => {
	res.redirect("/dashboard");
});

app.get("/index.html", (req, res) => {
	res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
	res.sendFile(path.join(__dirname, "dashboard.html"));
});

app.get("/catalog", (req, res) => {
	res.sendFile(path.join(__dirname, "./html/catalog.html"));
});

app.get("/export", (req, res) => {
	res.sendFile(path.join(__dirname, "./html/export.html"));
});

app.get("/obligation", (req, res) => {
	res.sendFile(path.join(__dirname, "./html/obligation.html"));
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
