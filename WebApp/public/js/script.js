// --- KONFIGURACIJA I PODACI ---
const categories = [
    { id: "GOV", name: "Governance & Management", description: "Management accountability, security policy." },
    { id: "RISK", name: "Risk Management", description: "Risk assessment, treatment." },
    { id: "INC", name: "Incident Handling", description: "Detection, reporting and response." },
    { id: "BC", name: "Business Continuity", description: "Backup, disaster recovery." },
    { id: "AWARE", name: "Awareness & Training", description: "Staff education." }
];

const obligations = [
    { id: "GOV-01", title: "Management accountability", categoryId: "GOV", lawRef: "Article 5(2)", cadence: 12 },
    { id: "RISK-01", title: "Periodic risk assessment", categoryId: "RISK", lawRef: "Article 7(1)", cadence: 24 },
    { id: "INC-01", title: "Incident reporting", categoryId: "INC", lawRef: "Article 11(2)", cadence: 12 },
    { id: "BC-01", title: "Business continuity", categoryId: "BC", lawRef: "Article 9(3)", cadence: 12 },
    { id: "AWARE-01", title: "Awareness and training", categoryId: "AWARE", lawRef: "Article 8(4)", cadence: 12 }
];

const suggestions = [
    { obligationId: "GOV-01", text: "Approved cybersecurity policy signed by management." },
    { obligationId: "RISK-01", text: "Formal risk assessment report." },
    { obligationId: "INC-01", text: "Incident response plan." }
];

let evidence = []; 

// NAVIGACIJA ROUTER
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await fetch("/api/evidence");
        evidence = await res.json();
    } catch (err) { console.error(err); }

    const path = window.location.pathname;

    if (path === "/" || path.includes("dashboard")) initDashboard();
    else if (path.includes("catalog")) initCatalog();
    else if (path.includes("obligation")) initObligation();
    else if (path.includes("export")) initExport();
});

function getStatus(obId) {
    const items = evidence.filter(e => e.obligationId === obId);
    if (items.length === 0) return { text: "Missing", cls: "red" };
    return { text: "Valid", cls: "green" };
}

// 1. DASHBOARD LOGIKA
function initDashboard() {
    const cards = document.querySelectorAll(".card p");
    if(cards.length >= 3) {
        cards[0].textContent = obligations.length;
        const covered = obligations.filter(o => evidence.some(e => e.obligationId === o.id)).length;
        cards[1].textContent = covered;
    }

    const tbody = document.querySelector(".table tbody");
    if(tbody) {
        tbody.innerHTML = "";
        obligations.forEach(ob => {
            const status = getStatus(ob.id);
            const catName = categories.find(c => c.id === ob.categoryId)?.name || "";
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${ob.id}</td>
                <td><a href="/obligation?id=${ob.id}">${ob.title}</a></td>
                <td>${catName}</td>
                <td>${status.text === "Valid" ? "FULL" : "NONE"}</td>
                <td><span class="badge ${status.cls}">${status.text}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// 2. CATALOG LOGIKA
function initCatalog() {
    const params = new URLSearchParams(window.location.search);
    const activeCatId = params.get('cat') || "GOV";

    const catList = document.querySelector(".category-list");
    if(catList) {
        catList.innerHTML = "";
        categories.forEach(cat => {
            const li = document.createElement("li");
            if(cat.id === activeCatId) li.classList.add("active");
            
            li.innerHTML = `
                ${cat.name}
                <p class="muted">${cat.description}</p>
            `;
            li.style.cursor = "pointer";
            
            li.addEventListener("click", () => {
                window.location.href = `/catalog?cat=${cat.id}`;
            });
            catList.appendChild(li);
        });
    }

    const contentTitle = document.querySelector(".content h3");
    if(contentTitle) {
        const catName = categories.find(c => c.id === activeCatId)?.name;
        contentTitle.textContent = `${catName} - Obligations`;
    }

    const obList = document.querySelector(".obligation-list");
    if(obList) {
        obList.innerHTML = "";
        const filtered = obligations.filter(o => o.categoryId === activeCatId);
        
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
        const h2 = document.querySelector("section h2");
        if(h2) h2.textContent = `${ob.id} - ${ob.title}`;
        
        const legalP = document.querySelector("p.muted");
        if(legalP) legalP.textContent = `Legal reference: ${ob.lawRef}`;

        const backBtn = document.querySelector(".secondary-btn");
        if(backBtn) backBtn.href = `/catalog?cat=${ob.categoryId}`;
        
        const suggList = document.querySelector(".suggestion-list");
        if(suggList) {
            suggList.innerHTML = "";
            const suggs = suggestions.filter(s => s.obligationId === ob.id);
            if(suggs.length === 0) suggList.innerHTML = "<li>No specific suggestions.</li>";
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
        const btn = form.querySelector("button");
        if(btn) btn.textContent = "Save Evidence";

        form.addEventListener("submit", (e) => {
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
            });
        });
    }
}

function renderEvidenceList(obId) {
    const list = document.querySelector(".evidence-list");
    if(!list) return;

    list.innerHTML = "";
    const items = evidence.filter(e => e.obligationId === obId);

    if(items.length === 0) {
        list.innerHTML = "<li><em>No evidence added yet.</em></li>";
        return;
    }

    items.forEach(ei => {
        const li = document.createElement("li");
        const date = new Date(ei.createdAt).toLocaleDateString();
        li.innerHTML = `
            <strong>[${ei.type}]</strong> ${ei.title} <br/>
            <span class="muted">Owner: ${ei.owner} · Added: ${date}</span>
            ${ei.filename ? `<br/><a href="/uploads/${ei.filename}" target="_blank">View File</a>` : ""}
        `;
        list.appendChild(li);
    });
}

// EXPORT
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

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const selected = formData.getAll("obligationIds");
        
        if(selected.length === 0) {
            alert("Please select at least one obligation.");
            return;
        }

        const btn = form.querySelector("button");
        const originalText = btn.textContent;
        btn.textContent = "Generating...";

        fetch("/api/export", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
            btn.textContent = originalText;
        })
        .catch(err => {
            console.error(err);
            alert("Export failed");
            btn.textContent = originalText;
        });
    });
}