const categories = [
	{
		id: "GOV",
		name: "Governance & Management",
		description:
			"Management accountability, security policy, responsibilities.",
	},
	{
		id: "RISK",
		name: "Risk Management",
		description: "Risk assessment, treatment, and supplier risk management.",
	},
	{
		id: "INC",
		name: "Incident Handling",
		description: "Detection, reporting and response.",
	},
	{
		id: "BC",
		name: "Business Continuity",
		description: "Backup, disaster recovery, resilience testing.",
	},
	{
		id: "AWARE",
		name: "Awareness & Training",
		description: "Staff education and awareness.",
	},
];

const obligations = [
	{
		id: "GOV-01",
		lawReference: "Article 5(2)",
		title: "Management accountability for cybersecurity",
		description:
			"Top management must approve and oversee cybersecurity measures.",
		categoryId: "GOV",
		reviewCadenceMonths: 12,
		isMandatory: true,
	},
	{
		id: "RISK-01",
		lawReference: "Article 7(1)",
		title: "Periodic risk assessment",
		description:
			"Organizations must perform regular cybersecurity risk assessments.",
		categoryId: "RISK",
		reviewCadenceMonths: 24,
		isMandatory: true,
	},
	{
		id: "INC-01",
		lawReference: "Article 11(2)",
		title: "Incident reporting within legal deadlines",
		description:
			"Significant incidents must be reported to competent authorities within prescribed timeframes.",
		categoryId: "INC",
		reviewCadenceMonths: 12,
		isMandatory: true,
	},
	{
		id: "BC-01",
		lawReference: "Article 9(3)",
		title: "Business continuity and disaster recovery",
		description:
			"Organizations must ensure recovery and continuity of essential services.",
		categoryId: "BC",
		reviewCadenceMonths: 12,
		isMandatory: true,
	},
	{
		id: "AWARE-01",
		lawReference: "Article 8(4)",
		title: "Awareness and training",
		description:
			"Staff must receive regular cybersecurity awareness and training.",
		categoryId: "AWARE",
		reviewCadenceMonths: 12,
		isMandatory: true,
	},
];

const suggestions = [
	{
		obligationId: "GOV-01",
		text: "Approved cybersecurity policy signed by management.",
	},
	{
		obligationId: "GOV-01",
		text: "RACI matrix describing roles and responsibilities.",
	},
	{
		obligationId: "GOV-01",
		text: "Meeting minutes where cybersecurity is discussed.",
	},

	{
		obligationId: "RISK-01",
		text: "Formal risk assessment report (e.g. yearly).",
	},
	{
		obligationId: "RISK-01",
		text: "Risk treatment plan or register.",
	},
	{
		obligationId: "RISK-01",
		text: "Supplier risk evaluation documents.",
	},

	{
		obligationId: "INC-01",
		text: "Incident response plan document.",
	},
	{
		obligationId: "INC-01",
		text: "Incident reporting template or workflow description.",
	},
	{
		obligationId: "INC-01",
		text: "Extract from SIEM or incident log showing reporting dates.",
	},

	{
		obligationId: "BC-01",
		text: "Backup and disaster recovery policy.",
	},
	{
		obligationId: "BC-01",
		text: "Report from last DR/BCP test.",
	},
	{
		obligationId: "BC-01",
		text: "Evidence of backup restoration testing.",
	},

	{
		obligationId: "AWARE-01",
		text: "Training completion report from LMS.",
	},
	{
		obligationId: "AWARE-01",
		text: "Awareness campaign materials (posters, emails).",
	},
	{
		obligationId: "AWARE-01",
		text: "Phishing simulation results.",
	},
];

const evidence = [];

function getEvidenceForObligation(obId) {
	return evidence.filter((e) => e.obligationId === obId);
}

function calculateFreshnessStatus(obligation) {
	const items = getEvidenceForObligation(obligation.id);
	if (items.length === 0) {
		return { coverage: "NONE", freshness: "RED" };
	}

	const cadence = obligation.reviewCadenceMonths;
	if (!cadence) {
		return { coverage: "FULL", freshness: "GREEN" };
	}

	const latestReview = items.reduce((latest, item) => {
		const d = new Date(item.lastReviewedAt);
		return d > latest ? d : latest;
	}, new Date(0));

	const now = new Date();
	const diffMs = now - latestReview;
	const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);

	let freshness;
	if (diffMonths <= cadence * 0.75) {
		freshness = "GREEN";
	} else if (diffMonths <= cadence) {
		freshness = "AMBER";
	} else {
		freshness = "RED";
	}

	return {
		coverage: "FULL",
		freshness,
	};
}

function freshnessLabel(status) {
	switch (status) {
		case "GREEN":
			return "Valid";
		case "AMBER":
			return "Near expiry";
		case "RED":
			return "Expired / missing";
		default:
			return "N/A";
	}
}

const views = {
	dashboard: document.getElementById("view-dashboard"),
	catalog: document.getElementById("view-catalog"),
	obligation: document.getElementById("view-obligation"),
	export: document.getElementById("view-export"),
};

const navButtons = document.querySelectorAll(".nav-btn");

function showView(name) {
	Object.entries(views).forEach(([key, el]) => {
		el.classList.toggle("visible", key === name);
	});
	navButtons.forEach((btn) => {
		btn.classList.toggle("active", btn.dataset.view === name);
	});
}

navButtons.forEach((btn) => {
	btn.addEventListener("click", () => {
		showView(btn.dataset.view);
		if (btn.dataset.view === "dashboard") renderDashboard();
		if (btn.dataset.view === "catalog") renderCatalog();
		if (btn.dataset.view === "export") renderExport();
	});
});

function renderDashboard() {
	const tbody = document.querySelector("#dashboard-table tbody");
	tbody.innerHTML = "";

	let countCovered = 0;
	let green = 0,
		amber = 0,
		red = 0;

	obligations.forEach((ob) => {
		const { coverage, freshness } = calculateFreshnessStatus(ob);
		if (coverage !== "NONE") countCovered++;
		if (freshness === "GREEN") green++;
		if (freshness === "AMBER") amber++;
		if (freshness === "RED") red++;

		const tr = document.createElement("tr");
		tr.innerHTML = `
      <td>${ob.id}</td>
      <td>${ob.title}</td>
      <td>${categories.find((c) => c.id === ob.categoryId)?.name ?? ""}</td>
      <td>${coverage}</td>
      <td>
        <span class="badge ${freshness.toLowerCase()}">${freshnessLabel(
			freshness
		)}</span>
      </td>
    `;
		tbody.appendChild(tr);
	});

	document.getElementById("total-obligations").textContent = obligations.length;
	document.getElementById("covered-obligations").textContent = countCovered;
	document.getElementById("count-green").textContent = green;
	document.getElementById("count-amber").textContent = amber;
	document.getElementById("count-red").textContent = red;
}

let currentCategoryId = null;
let currentObligationId = null;

function renderCatalog() {
	const catList = document.getElementById("category-list");
	const obList = document.getElementById("obligation-list");
	const catTitle = document.getElementById("catalog-category-title");

	catList.innerHTML = "";
	categories.forEach((cat) => {
		const li = document.createElement("li");
		li.textContent = cat.name;
		li.title = cat.description;
		li.dataset.id = cat.id;
		if (cat.id === currentCategoryId) li.classList.add("active");
		li.addEventListener("click", () => {
			currentCategoryId = cat.id;
			renderCatalog();
		});
		catList.appendChild(li);
	});

	obList.innerHTML = "";
	if (!currentCategoryId && categories.length > 0) {
		currentCategoryId = categories[0].id;
	}

	const cat = categories.find((c) => c.id === currentCategoryId);
	if (cat) {
		catTitle.textContent = `${cat.name}`;
		const obs = obligations.filter((o) => o.categoryId === cat.id);
		obs.forEach((ob) => {
			const li = document.createElement("li");
			const { freshness } = calculateFreshnessStatus(ob);
			li.innerHTML = `
        <span class="id">${ob.id}</span>
        <span>${ob.title}</span>
        <span class="badge ${freshness.toLowerCase()} outline" style="float:right">${freshness}</span>
      `;
			li.addEventListener("click", () => {
				openObligationDetail(ob.id);
			});
			obList.appendChild(li);
		});
	}
}

const backToCatalogBtn = document.getElementById("back-to-catalog");
backToCatalogBtn.addEventListener("click", () => {
	showView("catalog");
});

function openObligationDetail(obId) {
	currentObligationId = obId;
	const ob = obligations.find((o) => o.id === obId);
	if (!ob) return;

	document.getElementById(
		"obligation-title"
	).textContent = `${ob.id} – ${ob.title}`;
	document.getElementById("obligation-law-ref").textContent = ob.lawReference;
	document.getElementById("obligation-description").textContent =
		ob.description;

	const cadenceText = ob.reviewCadenceMonths
		? `${ob.reviewCadenceMonths} months`
		: "Not specified";
	document.getElementById("obligation-cadence").textContent = cadenceText;

	const suggUl = document.getElementById("suggestion-list");
	suggUl.innerHTML = "";
	suggestions
		.filter((s) => s.obligationId === ob.id)
		.forEach((s) => {
			const li = document.createElement("li");
			li.textContent = s.text;
			suggUl.appendChild(li);
		});

	renderEvidenceList(ob.id);

	showView("obligation");
}

function renderEvidenceList(obId) {
	const list = document.getElementById("evidence-list");
	list.innerHTML = "";
	const items = getEvidenceForObligation(obId);
	if (items.length === 0) {
		list.innerHTML = "<li><em>No evidence added yet (demo).</em></li>";
		return;
	}
	items.forEach((ei) => {
		const li = document.createElement("li");
		const date = new Date(ei.lastReviewedAt).toLocaleDateString();
		li.innerHTML = `
      <strong>[${ei.type}]</strong> ${ei.title}
      <br/><span class="muted">${
				ei.owner || "Unknown owner"
			} · Last reviewed ${date}</span>
      ${
				ei.linkUrl
					? `<br/><a href="${ei.linkUrl}" target="_blank">Link</a>`
					: ""
			}
      ${ei.noteText ? `<br/><span>${ei.noteText}</span>` : ""}
    `;
		list.appendChild(li);
	});
}

const evidenceForm = document.getElementById("evidence-form");
evidenceForm.addEventListener("submit", (evt) => {
	evt.preventDefault();
	if (!currentObligationId) return;

	const formData = new FormData(evidenceForm);
	const now = new Date();

	const item = {
		id: `EV-${Date.now()}`,
		obligationId: currentObligationId,
		type: formData.get("type") || "DOCUMENT",
		title: formData.get("title") || "Evidence",
		owner: formData.get("owner") || "",
		linkUrl: formData.get("linkUrl") || "",
		noteText: formData.get("noteText") || "",
		createdAt: now.toISOString(),
		lastReviewedAt: now.toISOString(),
	};

	evidence.push(item);
	evidenceForm.reset();
	renderEvidenceList(currentObligationId);
	renderDashboard();
});

function renderExport() {
	const container = document.getElementById("export-obligations");
	container.innerHTML = "";
	obligations.forEach((ob) => {
		const wrapper = document.createElement("div");
		wrapper.innerHTML = `
      <label>
        <input type="checkbox" name="obligationIds" value="${ob.id}">
        ${ob.id} – ${ob.title}
      </label>
    `;
		container.appendChild(wrapper);
	});
}

const exportForm = document.getElementById("export-form");
const exportOutput = document.getElementById("export-output");

exportForm.addEventListener("submit", (evt) => {
	evt.preventDefault();
	const formData = new FormData(exportForm);
	const selected = formData.getAll("obligationIds");
	const data = {
		generatedAt: new Date().toISOString(),
		organization: "Demo Organization",
		obligations: selected.map((id) => {
			const ob = obligations.find((o) => o.id === id);
			const ev = getEvidenceForObligation(id);
			return {
				id,
				title: ob?.title ?? "",
				lawReference: ob?.lawReference ?? "",
				evidence: ev.map((ei) => ({
					id: ei.id,
					type: ei.type,
					title: ei.title,
					owner: ei.owner,
					lastReviewedAt: ei.lastReviewedAt,
					linkUrl: ei.linkUrl || undefined,
					noteText: ei.noteText || undefined,
				})),
			};
		}),
	};

	exportOutput.textContent = JSON.stringify(data, null, 2);
});

renderDashboard();
renderCatalog();
renderExport();
showView("dashboard");
