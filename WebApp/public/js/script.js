// --- KONFIGURACIJA I PODACI ---
const categories = [
    { id: "GOV", name: "Governance & Management", description: "Accountability, policy, responsibilities." },
    { id: "RISK", name: "Risk Management", description: "Assessments, mitigation, supply chain." },
    { id: "TECH", name: "Technical Measures", description: "Access control, crypto, patching." },
    { id: "INC", name: "Incident Handling", description: "Detection, reporting, response." },
    { id: "BC", name: "Business Continuity", description: "Backup, disaster recovery." },
    { id: "AWARE", name: "Awareness & Training", description: "Staff education." },
    { id: "VENDOR", name: "Vendor Oversight", description: "Supplier audits, contracts." }
];

const obligations = [
    { id: "GOV-01", title: "Management Accountability", categoryId: "GOV", lawRef: "Art 5(2)", cadence: 12 },
    { id: "GOV-02", title: "Cybersecurity Policy", categoryId: "GOV", lawRef: "Art 6(1)", cadence: 12 },
    { id: "RISK-01", title: "Periodic Risk Assessment", categoryId: "RISK", lawRef: "Art 7(1)", cadence: 24 },
    { id: "RISK-02", title: "Supply Chain Risk", categoryId: "RISK", lawRef: "Art 7(3)", cadence: 12 },
    { id: "TECH-01", title: "Access Control & MFA", categoryId: "TECH", lawRef: "Art 14(2)", cadence: 12 },
    { id: "INC-01", title: "Incident Reporting (24h/72h)", categoryId: "INC", lawRef: "Art 11(2)", cadence: 12 },
    { id: "INC-02", title: "Incident Response Plan", categoryId: "INC", lawRef: "Art 11(4)", cadence: 12 },
    { id: "BC-01", title: "Business Continuity Plan", categoryId: "BC", lawRef: "Art 9(3)", cadence: 12 },
    { id: "BC-02", title: "Disaster Recovery Testing", categoryId: "BC", lawRef: "Art 9(5)", cadence: 12 },
    { id: "AWARE-01", title: "Staff Awareness Training", categoryId: "AWARE", lawRef: "Art 8(4)", cadence: 12 },
    { id: "VENDOR-01", title: "Supplier Security Audit", categoryId: "VENDOR", lawRef: "Art 15(1)", cadence: 24 }
];

const suggestions = [
    { obligationId: "GOV-01", text: "Meeting minutes, RACI matrix, signed responsibility acceptance." },
    { obligationId: "RISK-01", text: "Risk assessment document, risk treatment plan." },
    { obligationId: "INC-01", text: "Notification template, screenshots from SIEM, incident log." },
    { obligationId: "BC-01", text: "Backup policy, DR test report, recovery logs." },
    { obligationId: "AWARE-01", text: "Training completion export, phishing simulation results." },
    { obligationId: "VENDOR-01", text: "Vendor questionnaire, security clauses in contracts." }
];

let evidence = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("/api/evidence");
        evidence = await res.json();
        
        // Seed initial data if DB is empty
        if (evidence.length === 0) {
            await seedDatabase();
            const res2 = await fetch("/api/evidence");
            evidence = await res2.json();
        }

    } catch (err) {
        console.error("Failed to load evidence:", err);
    }

    const path = window.location.pathname;

    if (path === "/" || path.includes("dashboard")) initDashboard();
    else if (path.includes("catalog")) initCatalog();
    else if (path.includes("obligation")) initObligation();
    else if (path.includes("export")) initExport();
});

async function seedDatabase() {
    const demoItems = [
        { obligationId: "GOV-01", title: "Policy v1.0", type: "Document", owner: "CISO" },
        { obligationId: "RISK-01", title: "Risk Register", type: "Document", owner: "Risk Mgr" },
        { obligationId: "AWARE-01", title: "LMS Portal Link", type: "Link", owner: "HR", linkUrl: "https://lms.example.com" }
    ];

    for (const item of demoItems) {
        const formData = new FormData();
        formData.append("obligationId", item.obligationId);
        formData.append("title", item.title);
        formData.append("type", item.type);
        formData.append("owner", item.owner);
        if(item.linkUrl) formData.append("linkUrl", item.linkUrl);
        
        await fetch("/api/evidence", { method: "POST", body: formData });
    }
}

function getStatus(obId) {
    const items = evidence.filter(e => e.obligationId === obId);
    
    if (items.length === 0) return { text: "Missing", cls: "red" };

    const latestDate = items.reduce((max, item) => {
        const d = new Date(item.createdAt);
        return d > max ? d : max;
    }, new Date(0));

    const now = new Date();
    const diffMonths = (now - latestDate) / (1000 * 60 * 60 * 24 * 30);
    
    const ob = obligations.find(o => o.id === obId);
    const cadence = ob ? ob.cadence : 12;

    if (diffMonths <= cadence * 0.75) return { text: "Valid", cls: "green" };
    if (diffMonths <= cadence) return { text: "Near expiry", cls: "amber" };
    return { text: "Expired", cls: "red" };
}

// 1. DASHBOARD LOGIKA
function initDashboard() {
    const totalEl = document.querySelector("#card-total");
    const coveredEl = document.querySelector("#card-covered");
    
    if(totalEl) totalEl.textContent = obligations.length;

    const coveredCount = obligations.filter(o => getStatus(o.id).text !== "Missing").length;
    if(coveredEl) coveredEl.textContent = coveredCount;

    let g = 0, a = 0, r = 0;
    obligations.forEach(o => {
        const s = getStatus(o.id);
        if(s.cls === "green") g++;
        else if(s.cls === "amber") a++;
        else r++;
    });

    const elGreen = document.getElementById("count-green");
    const elAmber = document.getElementById("count-amber");
    const elRed = document.getElementById("count-red");

    if (elGreen) elGreen.textContent = g;
    if (elAmber) elAmber.textContent = a;
    if (elRed) elRed.textContent = r;

    const tbody = document.querySelector("tbody");
    if(tbody) {
        tbody.innerHTML = "";
        obligations.forEach(ob => {
            const status = getStatus(ob.id);
            const catName = categories.find(c => c.id === ob.categoryId)?.name || "";
            const coverageText = (status.text === "Missing") ? "NONE" : "FULL";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${ob.id}</td>
                <td><a href="/obligation?id=${ob.id}">${ob.title}</a></td>
                <td>${catName}</td>
                <td>${coverageText}</td>
                <td><span class="badge ${status.cls}">${status.text}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}
// CATALOG LOGIKA
function initCatalog() {
    const params = new URLSearchParams(window.location.search);
    const activeCatId = params.get('cat') || "GOV";

    const catList = document.querySelector(".category-list");
    if(catList) {
        catList.innerHTML = "";
        categories.forEach(cat => {
            const li = document.createElement("li");
            if(cat.id === activeCatId) li.classList.add("active");
            li.innerHTML = `${cat.name}<p class="muted">${cat.description}</p>`;
            li.style.cursor = "pointer";
            li.onclick = () => window.location.href = `/catalog?cat=${cat.id}`;
            catList.appendChild(li);
        });
    }

    const titleEl = document.getElementById("catalog-category-title");
    const activeCat = categories.find(c => c.id === activeCatId);
    if(titleEl && activeCat) titleEl.textContent = activeCat.name;

    const obList = document.getElementById("obligation-list");
    if(obList) {
        obList.innerHTML = "";
        const filtered = obligations.filter(o => o.categoryId === activeCatId);
        
        if (filtered.length === 0) obList.innerHTML = "<li>No obligations defined.</li>";

        filtered.forEach(ob => {
            const status = getStatus(ob.id);
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="id">${ob.id}</span>
                <a href="/obligation?id=${ob.id}">${ob.title}</a>
                <span class="badge ${status.cls} outline" style="float:right;">${status.text}</span>
            `;
            obList.appendChild(li);
        });
    }
}

// OBLIGATION DETAIL LOGIKA
function initObligation() {
    const params = new URLSearchParams(window.location.search);
    const obId = params.get('id');
    if(!obId) return;

    const ob = obligations.find(o => o.id === obId);
    if(ob) {
        const h2 = document.querySelector("h2");
        if(h2) h2.textContent = `${ob.id} - ${ob.title}`;
        
        const mutedP = document.querySelector("p.muted");
        if(mutedP) mutedP.textContent = `Legal Ref: ${ob.lawRef}`;

        const backBtn = document.querySelector(".secondary-btn");
        if(backBtn) backBtn.href = `/catalog?cat=${ob.categoryId}`;

        const infoP = document.querySelectorAll("p")[2];
        if(infoP) {
            infoP.innerHTML = `
                <strong>Category:</strong> ${categories.find(c=>c.id === ob.categoryId)?.name}<br/>
                <strong>Review cadence:</strong> ${ob.cadence} months<br/>
                <strong>Mandatory:</strong> Yes
            `;
        }

        const suggList = document.querySelector(".suggestion-list");
        if(suggList) {
            suggList.innerHTML = "";
            const suggs = suggestions.filter(s => s.obligationId === ob.id);
            if(suggs.length === 0) suggList.innerHTML = "<li>Check general best practices.</li>";
            suggs.forEach(s => {
                const li = document.createElement("li");
                li.textContent = s.text;
                suggList.appendChild(li);
            });
        }
    }

    renderEvidenceList(obId);

    const form = document.querySelector("form");
    if(form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            formData.append("obligationId", obId);

            fetch("/api/evidence", { method: "POST", body: formData })
            .then(res => res.json())
            .then(newEv => {
                evidence.push(newEv);
                renderEvidenceList(obId);
                form.reset();
                alert("Evidence saved!");
            })
            .catch(err => alert("Error: " + err));
        };
    }
}

function renderEvidenceList(obId) {
    const list = document.querySelector(".evidence-list");
    if(!list) return;
    list.innerHTML = "";
    
    const items = evidence.filter(e => e.obligationId === obId);
    if(items.length === 0) {
        list.innerHTML = "<li><em>No evidence uploaded.</em></li>";
        return;
    }

    items.forEach(ei => {
        const li = document.createElement("li");
        const date = new Date(ei.createdAt).toLocaleDateString();
        
        let content = "";
        if (ei.filename) {
            content += `<br/>📂 <a href="/uploads/${ei.filename}" target="_blank">View File</a>`;
        }
        if (ei.linkUrl) {
            content += `<br/>🔗 <a href="${ei.linkUrl}" target="_blank">Open External Link</a>`;
        }
        if (ei.noteText) {
            content += `<br/>📝 <span style="font-style:italic; color:#555;">${ei.noteText}</span>`;
        }

        li.innerHTML = `
            <strong>[${ei.type}]</strong> ${ei.title} 
            <span class="muted" style="font-size:0.85em"> — ${ei.owner} (${date})</span>
            ${content}
        `;
        list.appendChild(li);
    });
}

function initExport() {
    const form = document.querySelector("form");
    if(!form) return;

    const fieldset = form.querySelector("fieldset");
    if(fieldset) {
        const legend = fieldset.querySelector("legend");
        fieldset.innerHTML = "";
        fieldset.appendChild(legend);

        obligations.forEach(ob => {
            const div = document.createElement("div");
            div.innerHTML = `
                <label>
                    <input type="checkbox" name="obligationIds" value="${ob.id}">
                    ${ob.id} - ${ob.title}
                </label>
            `;
            fieldset.appendChild(div);
        });
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const selected = formData.getAll("obligationIds");
        
        if(selected.length === 0) {
            alert("Select at least one obligation.");
            return;
        }

        const btn = form.querySelector("button");
        btn.textContent = "Generating...";

        fetch("/api/export", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                obligationIds: selected,
                orgName: formData.get("orgName"),
                scope: formData.get("scope")
            })
        })
        .then(res => res.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Audit_Package.zip";
            document.body.appendChild(a);
            a.click();
            btn.textContent = "Generate Package";
        })
        .catch(err => {
            console.error(err);
            alert("Error generating zip");
            btn.textContent = "Generate Package";
        });
    };
}