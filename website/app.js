const cfg = window.HYBRID_METER_CONFIG || {};
const API_URL = cfg.apiUrl || "";

const demoMeters = [
    { meter_id: "MTR001", source: "NODE01", voltage: 234.2, current: 3.41, power: 798.62, frequency: 49.6, energy: 129.7, sequence: 470, hops: 0, timestamp: new Date().toISOString() },
    { meter_id: "MTR002", source: "NODE02", voltage: 233.1, current: 3.76, power: 876.46, frequency: 50.5, energy: 129.39, sequence: 439, hops: 0, timestamp: new Date().toISOString() },
    { meter_id: "MTR003", source: "NODE03", voltage: 232.6, current: 3.48, power: 809.45, frequency: 50.1, energy: 129.7, sequence: 470, hops: 0, timestamp: new Date().toISOString() }
];

const state = {
    role: "admin",
    meters: demoMeters,
    rate: Number(localStorage.getItem("hybridMeterRate") || 7.5),
    connected: false,
    loading: true,
    error: "",
    selectedHouse: "H-001"
};

const houseMap = {
    MTR001: { house: "H-001", owner: "House 01", area: "North Block" },
    MTR002: { house: "H-002", owner: "House 02", area: "East Block" },
    MTR003: { house: "H-003", owner: "House 03", area: "West Block" }
};

function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}
function money(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: cfg.currency || "INR", maximumFractionDigits: 2 }).format(n || 0); }
function num(n, d = 2) { return Number(n || 0).toFixed(d); }
function timeLabel(value) { const d = new Date(value); return isNaN(d) ? String(value || "-") : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); }

async function loadTelemetry() {
    state.loading = true;
    render();
    try {
        const response = await fetch(API_URL, { method: "GET", headers: { "Accept": "application/json" } });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const payload = await response.json();
        if (payload.status !== "success" || !Array.isArray(payload.meters)) throw new Error("Unexpected telemetry response");
        state.meters = payload.meters;
        state.connected = true;
        state.error = "";
    } catch (error) {
        state.connected = false;
        state.error = error.message || "Unable to reach telemetry API";
    } finally {
        state.loading = false;
        render();
    }
}

function totals() {
    return state.meters.reduce((a, m) => {
        a.power += Number(m.power || 0); a.energy += Number(m.energy || 0); return a;
    }, { power: 0, energy: 0 });
}
function currentHouseMeter() {
    const entry = Object.entries(houseMap).find(([, v]) => v.house === state.selectedHouse);
    return entry ? state.meters.find(m => m.meter_id === entry[0]) || state.meters[0] : state.meters[0];
}
function meterCard(m) {
    const h = houseMap[m.meter_id] || { house: "House", owner: "Resident", area: "" };
    return `<article class="meter-card">
    <div class="meter-head"><div><span class="eyebrow">${esc(h.house)}</span><h3>${esc(m.meter_id)}</h3></div><span class="online"><i></i> Online</span></div>
    <div class="meter-owner">${esc(h.owner)} · ${esc(h.area)}</div>
    <div class="metric-grid">
      <div><span>Voltage</span><strong>${num(m.voltage, 1)} V</strong></div>
      <div><span>Current</span><strong>${num(m.current, 2)} A</strong></div>
      <div><span>Power</span><strong>${num(m.power, 2)} W</strong></div>
      <div><span>Frequency</span><strong>${num(m.frequency, 1)} Hz</strong></div>
    </div>
    <div class="energy-row"><span>Energy consumed</span><strong>${num(m.energy, 2)} kWh</strong></div>
    <div class="meter-foot"><span>${esc(m.source)} · seq ${esc(m.sequence)}</span><span>${timeLabel(m.timestamp)}</span></div>
  </article>`;
}
function adminView() {
    const t = totals();
    return `<section class="page"><div class="page-title"><div><span class="eyebrow">ADMIN CONSOLE</span><h1>Grid overview</h1><p>Monitor all connected homes and manage the current electricity tariff.</p></div><div class="sync ${state.connected ? "ok" : "bad"}"><i></i>${state.connected ? "Live API" : "API offline"}</div></div>
    ${state.error ? `<div class="alert">${esc(state.error)} · Showing last available readings.</div>` : ""}
    <div class="stat-grid"><div class="stat"><span>Connected meters</span><strong>${state.meters.length}</strong><small>Across registered houses</small></div><div class="stat"><span>Total live power</span><strong>${num(t.power, 1)} W</strong><small>Current combined load</small></div><div class="stat"><span>Total recorded energy</span><strong>${num(t.energy, 2)} kWh</strong><small>Latest meter readings</small></div><div class="stat"><span>Current unit price</span><strong>${money(state.rate)}</strong><small>Per kWh · admin controlled</small></div></div>
    <div class="section-head"><div><h2>All houses</h2><p>Live telemetry from the smart-meter network.</p></div><button class="secondary" onclick="loadTelemetry()">↻ Refresh</button></div>
    <div class="meter-grid">${state.meters.map(meterCard).join("")}</div>
    <div class="lower-grid"><section class="panel"><div class="panel-head"><div><span class="eyebrow">TARIFF MANAGEMENT</span><h2>Electricity unit price</h2></div><span class="tag">Admin only</span></div><p class="muted">Set the current per-unit electricity price according to the applicable government/utility order. The value is applied to resident billing calculations.</p><div class="rate-form"><label>Price per kWh<input id="rateInput" type="number" min="0" step="0.01" value="${esc(state.rate)}"></label><button onclick="saveRate()">Save tariff</button></div><div class="note">Demo setting is stored locally in this browser. Connect this control to your backend/database when tariff persistence is added.</div></section><section class="panel"><div class="panel-head"><div><span class="eyebrow">NETWORK</span><h2>Mesh status</h2></div><span class="tag green">ESP-NOW</span></div><div class="network"><div class="node fixed"><b>NODE01</b><span>Gateway · USB</span></div><div class="link"></div><div class="node"><b>NODE02</b><span>MTR002 · Mesh</span></div><div class="link"></div><div class="node"><b>NODE03</b><span>MTR003 · Mesh</span></div></div></section></div></section>`;
}
function ownerView() {
    const m = currentHouseMeter() || demoMeters[0];
    const bill = Number(m.energy || 0) * state.rate;
    return `<section class="page"><div class="page-title"><div><span class="eyebrow">RESIDENT PORTAL</span><h1>${esc((houseMap[m.meter_id] || {}).house || "My House")}</h1><p>${esc((houseMap[m.meter_id] || {}).owner || "Home owner")} · Smart meter ${esc(m.meter_id)}</p></div><div class="sync ${state.connected ? "ok" : "bad"}"><i></i>${state.connected ? "Meter connected" : "Using last reading"}</div></div>
    ${state.error ? `<div class="alert">${esc(state.error)}</div>` : ""}
    <div class="bill-hero"><div><span class="eyebrow">ESTIMATED CURRENT BILL</span><div class="bill-amount">${money(bill)}</div><p>${num(m.energy, 2)} units × ${money(state.rate)} per unit</p></div><div class="bill-status">PAYMENT DUE<br><strong>Based on current reading</strong></div></div>
    <div class="section-head"><div><h2>My meter reading</h2><p>Latest telemetry received from your smart meter.</p></div><select onchange="changeHouse(this.value)"><option value="H-001">House H-001</option><option value="H-002">House H-002</option><option value="H-003">House H-003</option></select></div>
    <div class="owner-grid"><div class="reading"><span>Voltage</span><strong>${num(m.voltage, 1)} <em>V</em></strong></div><div class="reading"><span>Current</span><strong>${num(m.current, 2)} <em>A</em></strong></div><div class="reading"><span>Power</span><strong>${num(m.power, 2)} <em>W</em></strong></div><div class="reading"><span>Frequency</span><strong>${num(m.frequency, 1)} <em>Hz</em></strong></div></div>
    <section class="panel usage-panel"><div class="panel-head"><div><span class="eyebrow">CONSUMPTION</span><h2>Billing summary</h2></div><span class="tag">${money(state.rate)} / kWh</span></div><div class="billing-lines"><div><span>Energy consumed</span><strong>${num(m.energy, 2)} kWh</strong></div><div><span>Unit price set by admin</span><strong>${money(state.rate)}</strong></div><div class="total"><span>Estimated amount payable</span><strong>${money(bill)}</strong></div></div><div class="note">Last reading: ${timeLabel(m.timestamp)} · Source ${esc(m.source)}</div></section></section>`;
}
function render() {
    const root = document.getElementById("app");
    root.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">⚡</div><div><b>HYBRID</b><span>SMART METER</span></div></div><div class="role-box"><span>VIEWING AS</span><select onchange="changeRole(this.value)"><option value="admin" ${state.role === 'admin' ? 'selected' : ''}>Admin</option><option value="owner" ${state.role === 'owner' ? 'selected' : ''}>House Owner</option></select></div><nav><button class="nav-active">▦ <span>Dashboard</span></button><button>⌁ <span>Meter network</span></button><button>◷ <span>Billing</span></button></nav><div class="side-bottom"><div class="status"><i></i><span>System operational</span></div><small>ESP32 mesh · Raspberry Pi · AWS</small></div></aside><main class="main"><header class="topbar"><div class="mobile-brand">HYBRID SMART METER</div><div class="top-actions"><span>Last sync ${new Date().toLocaleTimeString('en-IN')}</span><button class="avatar">${state.role === 'admin' ? 'A' : 'H'}</button></div></header>${state.role === 'admin' ? adminView() : ownerView()}<footer>Hybrid Smart Metering System · Final-year project prototype</footer></main></div>`;
}
function changeRole(role) { state.role = role; render(); }
function changeHouse(house) { state.selectedHouse = house; render(); }
function saveRate() { const v = Number(document.getElementById('rateInput').value); if (v >= 0) { state.rate = v; localStorage.setItem('hybridMeterRate', v); render(); } }
window.changeRole = changeRole; window.changeHouse = changeHouse; window.saveRate = saveRate; window.loadTelemetry = loadTelemetry;
render();
loadTelemetry();