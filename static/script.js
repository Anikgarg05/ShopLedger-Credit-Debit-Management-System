
// ─── Business logic ───────────────────────────────────────────────────────────
// CREDIT = customer takes money/goods from shop  → balance goes UP   (they owe more)
// DEBIT  = customer pays/returns to shop         → balance goes DOWN (they owe less)
 
// ─── State ────────────────────────────────────────────────────────────────────
const amountState  = {};  // { [customerId]: 'credit' | 'debit' | null }
const summaryState = {};  // { [customerId]: 'all' | 'credit' | 'debit' | null }
 
// ─── Init ─────────────────────────────────────────────────────────────────────
window.onload = loadTopCustomers;
 
// ─── Load top customers ───────────────────────────────────────────────────────
function loadTopCustomers() {
    fetch('/topCustomers')
        .then(res => {
            if (!res.ok) throw new Error('Failed to load customers');
            return res.json();
        })
        .then(renderCustomers)
        .catch(err => {
            console.error(err);
            showToast('Could not load customers. Check your connection.');
        });
}
 
// ─── Search ───────────────────────────────────────────────────────────────────
function searchCustomer() {
    const q = document.getElementById('searchBox').value.trim();
 
    fetch('/search?q=' + encodeURIComponent(q))
        .then(res => {
            if (!res.ok) throw new Error('Search failed');
            return res.json();
        })
        .then(renderCustomers)
        .catch(err => {
            console.error(err);
            showToast('Search failed. Please try again.');
        });
}
 
document.addEventListener('DOMContentLoaded', () => {
    const box = document.getElementById('searchBox');   
    if (box) {
        box.addEventListener('keydown', e => {
            if (e.key === 'Enter') searchCustomer();
        });
    }
});
 
// ─── Render ───────────────────────────────────────────────────────────────────
function renderCustomers(data) {
    const list = document.getElementById('list');
    if (!data || data.length === 0) {
        list.innerHTML = '<div class="empty-state">No customers found.</div>';
        return;
    }
 
    list.innerHTML = data.map(c => {
        const amtOpen  = amountState[c.id];
        const summOpen = summaryState[c.id];
 
        // A positive balance means the customer OWES us money (they took credit)
        const balanceClass = c.balance > 0 ? 'balance-owed'
                           : c.balance < 0 ? 'balance-overpaid'
                           : '';
 
        const balanceLabel = c.balance > 0 ? `₹${c.balance} owed by customer`
                           : c.balance < 0 ? `₹${Math.abs(c.balance)} overpaid`
                           : '₹0 — settled';
 
        return `
        <div class="card" id="card-${c.id}">
 
            <div class="card-top">
                <div>
                    <h3>${escapeHtml(c.name)}</h3>
                    <div class="balance">
                        <span class="amount ${balanceClass}">${balanceLabel}</span>
                    </div>
                </div>
                <div class="actions">
                    <!-- CREDIT: customer takes from shop → balance goes UP (bad for shop) -->
                    <button class="act-btn credit-btn" onclick="openAmountRow(${c.id}, 'credit')"
                        title="Customer takes goods/money from you">
                        &#8593; Credit
                    </button>
                    <!-- DEBIT: customer returns/pays to shop → balance goes DOWN (good for shop) -->
                    <button class="act-btn debit-btn" onclick="openAmountRow(${c.id}, 'debit')"
                        title="Customer pays or returns to you">
                        &#8595; Debit
                    </button>
                    <button class="act-btn delete-btn" onclick="deleteCustomer(${c.id})">Delete</button>
 
                    <select class="summary-select" onchange="getSummary(${c.id}, this.value)">
                        <option value="">Summary</option>
                        <option value="all"    ${summOpen === 'all'    ? 'selected' : ''}>All</option>
                        <option value="credit" ${summOpen === 'credit' ? 'selected' : ''}>Credits (took)</option>
                        <option value="debit"  ${summOpen === 'debit'  ? 'selected' : ''}>Debits (paid)</option>
                    </select>
                </div>
            </div>
 
            <!-- Inline amount row -->
            <div class="amount-row ${amtOpen ? 'show' : ''}" id="amt-row-${c.id}">
                <label>
                    ${amtOpen === 'credit'
                        ? '&#8593; Credit — customer takes:'
                        : '&#8595; Debit — customer pays:'}
                </label>
                <input
                    type="number"
                    id="amt-input-${c.id}"
                    placeholder="e.g. 500"
                    min="1"
                    onkeydown="if(event.key==='Enter') confirmAmount(${c.id})"
                >
                <button
                    class="confirm-btn ${amtOpen === 'credit' ? 'confirm-credit' : 'confirm-debit'}"
                    onclick="confirmAmount(${c.id})"
                >
                    Confirm
                </button>
                <button class="confirm-btn cancel-btn" onclick="closeAmountRow(${c.id})">Cancel</button>
            </div>
 
            <!-- Summary list -->
            <div id="summary-${c.id}" class="summary-list" style="display:${summOpen ? 'block' : 'none'}"></div>
 
        </div>`;
    }).join('');
}
 
// ─── Inline amount row ────────────────────────────────────────────────────────
function openAmountRow(id, type) {
    Object.keys(amountState).forEach(otherId => {
        if (String(otherId) !== String(id)) closeAmountRow(Number(otherId));
    });
 
    amountState[id] = type;
    loadTopCustomers();
 
    setTimeout(() => {
        const inp = document.getElementById('amt-input-' + id);
        if (inp) inp.focus();
    }, 50);
}
 
function closeAmountRow(id) {
    delete amountState[id];
    const row = document.getElementById('amt-row-' + id);
    if (row) row.classList.remove('show');
}
 
function confirmAmount(id) {
    const inp    = document.getElementById('amt-input-' + id);
    const amount = Number(inp ? inp.value : 0);
    const type   = amountState[id];
 
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount greater than 0.');
        if (inp) inp.focus();
        return;
    }
 
    // CREDIT → balance increases (customer owes more)
    // DEBIT  → balance decreases (customer paid back)
    const url = type === 'credit' ? '/addCredit' : '/addDebit';
 
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount })
    })
        .then(res => {
            if (!res.ok) throw new Error('Request failed');
            return res.json();
        })
        .then(() => {
            delete amountState[id];
            const msg = type === 'credit'
                ? `₹${amount} credited — customer took from shop.`
                : `₹${amount} debited — customer paid back.`;
            showToast(msg);
            loadTopCustomers();
        })
        .catch(err => {
            console.error(err);
            showToast('Failed to update. Please try again.');
        });
}
 
// ─── Add customer ─────────────────────────────────────────────────────────────
function addCustomer() {
    const nameInput = document.getElementById('newName');
    const name      = nameInput.value.trim();
 
    if (!name) {
        showToast('Please enter a customer name.');
        nameInput.focus();
        return;
    }
 
    fetch('/addCustomer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
        .then(res => {
            if (!res.ok) throw new Error('Failed to add customer');
            return res.json();
        })
        .then(() => {
            nameInput.value = '';
            showToast(`Customer "${name}" added.`);
            loadTopCustomers();
        })
        .catch(err => {
            console.error(err);
            showToast('Failed to add customer. Please try again.');
        });
}
 
// ─── Delete one customer ──────────────────────────────────────────────────────
function deleteCustomer(id) {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
 
    fetch('/deleteCustomer/' + id, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('Delete failed');
            return res.json();
        })
        .then(() => {
            delete amountState[id];
            delete summaryState[id];
            showToast('Customer deleted.');
            loadTopCustomers();
        })
        .catch(err => {
            console.error(err);
            showToast('Failed to delete. Please try again.');
        });
}
 
// ─── Delete all customers ─────────────────────────────────────────────────────
function deleteAllCustomers() {
    if (!confirm('Delete ALL customers? This cannot be undone.')) return;
 
    fetch('/deleteAllCustomers', { method: 'DELETE' })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete all');
            return res.json();
        })
        .then(() => {
            Object.keys(amountState).forEach(k => delete amountState[k]);
            Object.keys(summaryState).forEach(k => delete summaryState[k]);
            showToast('All customers deleted.');
            loadTopCustomers();
        })
        .catch(err => {
            console.error(err);
            showToast('Failed to delete all. Please try again.');
        });
}
 
// ─── Summary ──────────────────────────────────────────────────────────────────
function getSummary(id, type) {
    const box = document.getElementById('summary-' + id);
    if (!box) return;
 
    if (!type) {
        delete summaryState[id];
        box.style.display = 'none';
        box.innerHTML = '';
        return;
    }
 
    summaryState[id] = type;
    box.style.display = 'block';
    box.innerHTML = '<p style="font-size:13px;color:#888;">Loading…</p>';
 
    fetch(`/summary/${id}?type=${encodeURIComponent(type)}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load summary');
            return res.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                box.innerHTML = '<p style="font-size:13px;color:#aaa;">No transactions found.</p>';
                return;
            }
 
            box.innerHTML = data.map(item => {

    if (typeof item === 'string') {

        // 🔥 FIXED LOGIC
        const isCr = item.toLowerCase().includes('given');

        const label = isCr ? 'took from shop' : 'paid to shop';

        return `<div class="tx-item">
            <span class="tx-badge ${isCr ? 'credit' : 'debit'}">${label}</span>
            <span>${escapeHtml(item)}</span>
        </div>`;
    }

    const isCr = item.type === 'credit';
    const label = isCr ? 'took from shop' : 'paid to shop';

    return `<div class="tx-item">
        <span class="tx-badge ${item.type}">${label}</span>
        <span>₹${item.amount}</span>
    </div>`;
}).join('');
        })
        .catch(err => {
            console.error(err);
            box.innerHTML = '<p style="font-size:13px;color:#e53e3e;">Failed to load summary.</p>';
        });
}
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3500);
}
 
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}