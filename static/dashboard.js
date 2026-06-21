// ─── Business logic ───────────────────────────────────────────────────────────
// CREDIT = shop gave goods → customer owes money  (RED)
// DEBIT  = customer paid   → shop received money  (GREEN)

let chart        = null;
let pollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    loadAudit();
    startPolling();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPolling();
        } else {
            loadAudit();
            startPolling();
        }
    });
});

function startPolling() {
    stopPolling();
    pollInterval = setInterval(loadAudit, 5000);
}

function stopPolling() {
    if (pollInterval !== null) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}

// ─── FETCH DATA ──────────────────────────────────────────────────────────────
function loadAudit() {
    fetch('/auditData')
        .then(res => {
            if (!res.ok) throw new Error('Server returned ' + res.status);
            return res.json();
        })
        .then(data => {
            hideError();

            const credit = Number(data.credit) || 0;
            const debit  = Number(data.debit)  || 0;

            updateCards(credit, debit);
            updateChart(credit, debit);
        })
        .catch(err => {
            console.error('Audit fetch error:', err);
            showError('Could not load audit data. Retrying…');
        });
}

// ─── UPDATE CARDS ────────────────────────────────────────────────────────────
function updateCards(credit, debit) {

    const net = credit - debit;

    // CREDIT = total given → customer owes
    document.getElementById('credit').innerText = '₹' + credit;

    // DEBIT = total received → customer paid
    document.getElementById('debit').innerText  = '₹' + debit;

    const netEl = document.getElementById('net');

    // Absolute value display
    netEl.innerText = '₹' + Math.abs(net);

    // ─── STATUS COLORS ───
    // net > 0 → customer still owes → RED
    // net = 0 → settled → GREEN
    // net < 0 → overpaid → BLUE

    if (net > 0) {
        netEl.className = 'net-positive';   // RED
        netEl.innerText += ' (customer owes)';
    } 
    else if (net < 0) {
        netEl.className = 'net-negative';   // BLUE
        netEl.innerText += ' (extra paid)';
    } 
    else {
        netEl.className = 'net-zero';       // GREEN
        netEl.innerText += ' (settled)';
    }
}

// ─── UPDATE CHART ────────────────────────────────────────────────────────────
function updateChart(credit, debit) {
    const ctx      = document.getElementById('chart');
    const emptyMsg = document.getElementById('emptyMsg');

    const hasData  = credit > 0 || debit > 0;

    if (!hasData) {
        emptyMsg.style.display = 'block';
        ctx.style.display      = 'none';
        return;
    }

    emptyMsg.style.display = 'none';
    ctx.style.display      = 'block';

    if (chart) {
        chart.data.datasets[0].data = [credit, debit];
        chart.update();
    } 
    else {
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    'Credit (given to customers)',
                    'Debit (received from customers)'
                ],
                datasets: [{
                    data: [credit, debit],

                    // RED = credit (given)
                    // GREEN = debit (received)
                    backgroundColor: ['#fc8181', '#68d391'],
                    borderColor:     ['#e53e3e', '#27ae60'],
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            font: { size: 13 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.parsed;

                                const pct = total > 0
                                    ? ((value / total) * 100).toFixed(1)
                                    : 0;

                                return `₹${value} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────
function showError(msg) {
    const b = document.getElementById('errorBanner');
    if (b) {
        b.innerText = msg;
        b.style.display = 'block';
    }
}

function hideError() {
    const b = document.getElementById('errorBanner');
    if (b) b.style.display = 'none';
}