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

// Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(__dirname, "public", "dashboard.html")));
app.get("/catalog", (req, res) => res.sendFile(path.join(__dirname, "public", "catalog.html")));
app.get("/export", (req, res) => res.sendFile(path.join(__dirname, "public", "export.html")));
app.get("/obligation", (req, res) => res.sendFile(path.join(__dirname, "public", "obligation.html")));

// Baza
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
        linkUrl: req.body.linkUrl || null,
        noteText: req.body.noteText || null,
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
    
    archive.on('error', (err) => res.status(500).send({ error: err.message }));
    archive.pipe(res);
    
    archive.append(JSON.stringify(evidence, null, 2), { name: 'manifest.json' });
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Audit Overview</title>
            <style>body{font-family:sans-serif;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f2f2f2;}</style>
        </head>
        <body>
            <h1>Audit Package Overview</h1>
            <p><strong>Organization:</strong> ${req.body.orgName || 'N/A'}</p>
            <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
            <table>
                <tr><th>Obligation</th><th>Type</th><th>Title</th><th>Filename/Link</th></tr>
                ${evidence.map(e => `
                    <tr>
                        <td>${e.obligationId}</td>
                        <td>${e.type}</td>
                        <td>${e.title}</td>
                        <td>${e.filename || e.linkUrl || 'Note'}</td>
                    </tr>
                `).join('')}
            </table>
        </body>
        </html>
    `;
    archive.append(htmlContent, { name: 'index.html' });

    evidence.forEach(ev => {
        if (ev.filename) {
            const filePath = path.join(__dirname, "uploads", ev.filename);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `evidence/${ev.filename}` });
            }
        }
    });
    
    archive.finalize();
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));