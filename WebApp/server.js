import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import archiver from "archiver";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "data", "db.json");


// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute za stranice
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/catalog", (req, res) => res.sendFile(path.join(__dirname, "public", "catalog.html")));
app.get("/export", (req, res) => res.sendFile(path.join(__dirname, "public", "export.html")));
app.get("/obligation", (req, res) => res.sendFile(path.join(__dirname, "public", "obligation.html")));

//Baza
const readDb = () => {
	try {
		if (!fs.existsSync(DB_PATH)) return [];
		return JSON.parse(fs.readFileSync(DB_PATH, "utf8") || "[]");
	} catch (e) {
		return [];
	}
};
const writeDb = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
app.get("/api/evidence", (req, res) => res.json(readDb()));

// Upload
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadPath = path.join(__dirname, "uploads");
		if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
		cb(null, uploadPath);
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + '-' + file.originalname);
	}

});

const upload = multer({ storage });
app.post("/api/evidence", upload.single("file"), (req, res) => {
	const db = readDb();
	const newEvidence = {
		id: `EV-${Date.now()}`,
		obligationId: req.body.obligationId,
		type: req.body.type,
		title: req.body.title,
		owner: req.body.owner,
		filename: req.file ? req.file.filename : null,
		createdAt: new Date().toISOString()
	};

	db.push(newEvidence);
	writeDb(db);
	res.json(newEvidence);
});

// Export
app.post("/api/export", (req, res) => {
	const ids = req.body.obligationIds || [];
	const db = readDb();
	const evidence = db.filter(ev => ids.includes(ev.obligationId));
	res.attachment('Audit_Package.zip');
	const archive = archiver('zip');
	archive.pipe(res);
	archive.append(JSON.stringify(evidence, null, 2), { name: 'manifest.json' });
	evidence.forEach(ev => {
		if (ev.filename) {
			const p = path.join(__dirname, "uploads", ev.filename);
			if (fs.existsSync(p)) archive.file(p, { name: ev.filename });
		}
	});
	archive.finalize();
});

app.listen(PORT, () => console.log(`Server radi na http://localhost:${PORT}`));