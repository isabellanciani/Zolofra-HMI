const litersInput = document.getElementById('litersInput');
const priceOutput = document.getElementById('priceOutput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const bottleToggleBtn = document.getElementById('bottleToggleBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const dailyLitersSpan = document.getElementById('dailyLiters');
const dailyBagsSpan = document.getElementById('dailyBags');
const historyBody = document.getElementById('historyBody');
const bottleStatusSpan = document.getElementById('bottleStatus');
const processStatusSpan = document.getElementById('processStatus');
const progressTextP = document.getElementById('progressText');
const timeStatusSpan = document.getElementById('timeStatus');
const historyCountDisplay = document.getElementById('historyCountDisplay');

const pricePerLiter = 2.5;
const flowRate = 3.5;
const bagFactor = 0.18;

let dailyLitersValue = 0;
let dailyBagsValue = 0;
let processTimer = null;
let processInterval = null;
let history = [];
let bottleDetected = false;

function formatMoney(value) { return value.toFixed(2); }
function updatePrice() {
    const liters = Number(litersInput.value) || 0;
    priceOutput.value = formatMoney(liters * pricePerLiter);
}
function updateDailyCounters() {
    dailyLitersSpan.textContent = `${dailyLitersValue} L`;
    dailyBagsSpan.textContent = `${dailyBagsValue}`;
    const bar = document.querySelector('.metric-block:first-child .mini-bar');
    if(bar) {
        let percent = Math.min(100, (dailyLitersValue / 500) * 100);
        bar.style.width = `${percent}%`;
    }
}
function renderHistory() {
    historyBody.innerHTML = history.map(row => `
        <tr><td>${row.date}</td><td>${row.liters} L</td><td>${row.bags}</td></tr>
    `).join('');
    if(historyCountDisplay) historyCountDisplay.textContent = history.length;
}
function addHistoryRow(date, liters, bags) {
    history.unshift({ date, liters, bags });
    renderHistory();
}
function setProcessState(running) {
    processStatusSpan.textContent = running ? 'SUMINISTRANDO' : 'EN ESPERA';
    processStatusSpan.className = running ? 'sensor-val state-on' : 'sensor-val state-off';
}
function syncWorkflow(stepIndex) {
    const steps = document.querySelectorAll('.step-item');
    steps.forEach((step, idx) => {
        step.classList.remove('is-active', 'is-done');
        if(idx < stepIndex) step.classList.add('is-done');
        else if(idx === stepIndex) step.classList.add('is-active');
    });
}
function resetWorkflow() { syncWorkflow(0); }
function setBottleState(detected) {
    bottleDetected = detected;
    bottleStatusSpan.textContent = detected ? 'DETECTADO' : 'NO DETECTADO';
    bottleStatusSpan.className = detected ? 'sensor-val state-on' : 'sensor-val state-off';
    bottleToggleBtn.textContent = detected ? 'BOTELLÓN VERIFICADO' : 'VERIFICAR BOTELLÓN';
    syncWorkflow(bottleDetected ? 1 : 0);
}
function stopProcess(manual = false) {
    if(processTimer) clearTimeout(processTimer);
    if(processInterval) clearInterval(processInterval);
    processTimer = null;
    processInterval = null;
    timeStatusSpan.textContent = '0 s';
    progressTextP.textContent = manual ? 'PROCESO DETENIDO MANUALMENTE' : 'CICLO FINALIZADO.';
    setProcessState(false);
    syncWorkflow(0);
}
function startProcess() {
    const liters = Number(litersInput.value);
    if (!liters || liters <= 0) {
        progressTextP.textContent = 'ERROR: LITROS INVÁLIDOS';
        return;
    }
    if (!bottleDetected) {
        progressTextP.textContent = 'SENSOR: BOTELLÓN NO DETECTADO';
        syncWorkflow(1);
        return;
    }
    const durationSeconds = Math.max(4, Math.round((liters / flowRate) * 6));
    let elapsed = 0;
    setProcessState(true);
    progressTextP.textContent = 'BOMBA ACTIVA · SUMINISTRO EN CURSO';
    syncWorkflow(2);
    if(processInterval) clearInterval(processInterval);
    processInterval = setInterval(() => {
        elapsed += 1;
        const remaining = Math.max(durationSeconds - elapsed, 0);
        timeStatusSpan.textContent = `${remaining} s`;
    }, 1000);
    processTimer = setTimeout(() => {
        const bagsProduced = Math.max(1, Math.round(liters * bagFactor));
        dailyLitersValue += liters;
        dailyBagsValue += bagsProduced;
        updateDailyCounters();
        addHistoryRow(new Date().toLocaleDateString('es-BO'), liters, bagsProduced);
        progressTextP.textContent = 'SUMINISTRO COMPLETADO EXITOSAMENTE.';
        stopProcess(false);
    }, durationSeconds * 1000);
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

function updateLiveTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-BO');
    const timeEl = document.getElementById('liveTime');
    if(timeEl) timeEl.textContent = timeStr;
}
setInterval(updateLiveTime, 1000);
updateLiveTime();

litersInput.addEventListener('input', updatePrice);
bottleToggleBtn.addEventListener('click', () => setBottleState(!bottleDetected));
startBtn.addEventListener('click', () => startProcess());
stopBtn.addEventListener('click', () => stopProcess(true));
clearHistoryBtn.addEventListener('click', () => { history = []; renderHistory(); progressTextP.textContent = 'Historial limpiado.'; });

setBottleState(false);
setProcessState(false);
resetWorkflow();
updatePrice();
updateDailyCounters();
renderHistory();