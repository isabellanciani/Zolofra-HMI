const litersInput = document.getElementById('litersInput');
const priceOutput = document.getElementById('priceOutput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const bottleToggleBtn = document.getElementById('bottleToggleBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const dailyLiters = document.getElementById('dailyLiters');
const dailyBags = document.getElementById('dailyBags');
const historyBody = document.getElementById('historyBody');
const bottleStatus = document.getElementById('bottleStatus');
const processStatus = document.getElementById('processStatus');
const pilotLight = document.getElementById('pilotLight');
const systemStatus = document.getElementById('systemStatus');
const appContent = document.getElementById('appContent');
const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');
const progressText = document.getElementById('progressText');
const timeStatus = document.getElementById('timeStatus');

const pricePerLiter = 2.5;
const flowRate = 3.5;
const bagFactor = 0.18;

let dailyLitersValue = 0;
let dailyBagsValue = 0;
let processTimer = null;
let processInterval = null;
let history = [];
let bottleDetected = false;

function formatMoney(value) {
  return value.toFixed(2);
}

function updatePrice() {
  const liters = Number(litersInput.value) || 0;
  priceOutput.value = formatMoney(liters * pricePerLiter);
}

function updateDailyCounters() {
  dailyLiters.textContent = `${dailyLitersValue} L`;
  dailyBags.textContent = `${dailyBagsValue}`;
}

function renderHistory() {
  historyBody.innerHTML = history
    .map((row) => `
      <tr>
        <td>${row.date}</td>
        <td>${row.liters} L</td>
        <td>${row.bags}</td>
      </tr>
    `)
    .join('');
}

function addHistoryRow(date, liters, bags) {
  history.unshift({ date, liters, bags });
  renderHistory();
}

function setProcessState(running) {
  if (pilotLight) {
    pilotLight.textContent = running ? 'Encendida' : 'Apagada';
    pilotLight.className = running ? 'state state-on' : 'state state-off';
  }
  processStatus.textContent = running ? 'Suministrando' : 'En espera';
  processStatus.className = running ? 'state state-on' : 'state state-off';
}

function syncWorkflow(stepIndex) {
  const steps = document.querySelectorAll('.workflow-step');

  steps.forEach((step, index) => {
    step.classList.toggle('is-active', index === stepIndex);
    step.classList.toggle('is-done', index < stepIndex);
  });
}

function resetWorkflow() {
  syncWorkflow(0);
}

function setBottleState(detected) {
  bottleDetected = detected;
  bottleStatus.textContent = detected ? 'Detectado' : 'No detectado';
  bottleStatus.className = detected ? 'state state-on' : 'state state-off';
  bottleToggleBtn.textContent = detected ? 'Botellón presente' : 'Botellón ausente';
  bottleToggleBtn.className = 'btn btn-tertiary';
  bottleToggleBtn.setAttribute('aria-pressed', detected ? 'true' : 'false');
}

function stopProcess(manual = false) {
  if (processTimer) {
    clearTimeout(processTimer);
    processTimer = null;
  }

  if (processInterval) {
    clearInterval(processInterval);
    processInterval = null;
  }

  timeStatus.textContent = '0 s';
  progressText.textContent = manual ? 'Proceso detenido manualmente.' : 'Proceso finalizado.';
  setProcessState(false);
  syncWorkflow(0);
}

function startProcess() {
  const liters = Number(litersInput.value);

  if (!liters || liters <= 0) {
    progressText.textContent = 'Ingrese una cantidad válida de litros.';
    return;
  }

  if (!bottleDetected) {
    progressText.textContent = 'Esperando detección del botellón por sensor capacitivo.';
    return;
  }

  const durationSeconds = Math.max(4, Math.round((liters / flowRate) * 6));
  let elapsed = 0;

  setProcessState(true);
  progressText.textContent = 'Bomba y válvula activadas. Suministrando agua...';
  syncWorkflow(2);

  processInterval = setInterval(() => {
    elapsed += 1;
    timeStatus.textContent = `${Math.max(durationSeconds - elapsed, 0)} s`;
  }, 1000);

  processTimer = setTimeout(() => {
    const bagsProduced = Math.max(1, Math.round(liters * bagFactor));
    dailyLitersValue += liters;
    dailyBagsValue += bagsProduced;
    updateDailyCounters();
    addHistoryRow(new Date().toLocaleDateString('es-BO'), liters, bagsProduced);
    progressText.textContent = 'Suministro completado correctamente.';
    stopProcess(false);
  }, durationSeconds * 1000);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.remove('active'));
    tabPanels.forEach((panel) => panel.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

litersInput.addEventListener('input', updatePrice);
bottleToggleBtn.addEventListener('click', () => {
  setBottleState(!bottleDetected);
  syncWorkflow(bottleDetected ? 1 : 0);
  progressText.textContent = bottleDetected
    ? 'Botellón detectado. Ya puede iniciar la recarga.'
    : 'Aún no hay botellón. Colóquelo para continuar.';
});
startBtn.addEventListener('click', () => {
  if (!bottleDetected) {
    syncWorkflow(1);
  }
  startProcess();
});
stopBtn.addEventListener('click', () => stopProcess(true));
clearHistoryBtn.addEventListener('click', () => {
  history = [];
  renderHistory();
});

setBottleState(false);
setProcessState(false);
resetWorkflow();
updatePrice();
updateDailyCounters();
renderHistory();