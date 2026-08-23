// 1. Initial State & Setup
document.getElementById('invDate').valueAsDate = new Date();
let items = [{ desc: "Web Development", hsn: "9983", qty: 1, rate: 10000, gst: 18 }];

const moneyFormat = (amount) => "₹" + parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escapeHTML = (str) => String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

// 2. Render Form Items
function renderItems() {
    const tbody = document.getElementById('itemRows');
    tbody.innerHTML = items.map((item, index) => `
        <tr class="group">
            <td class="py-3 pr-2"><input type="text" class="input-box" value="${item.desc}" oninput="updateItem(${index}, 'desc', this.value)"></td>
            <td class="py-3 pr-2"><input type="text" class="input-box" value="${item.hsn}" oninput="updateItem(${index}, 'hsn', this.value)"></td>
            <td class="py-3 pr-2"><input type="number" class="input-box" value="${item.qty}" min="1" oninput="updateItem(${index}, 'qty', this.value)"></td>
            <td class="py-3 pr-2"><input type="number" class="input-box" value="${item.rate}" min="0" oninput="updateItem(${index}, 'rate', this.value)"></td>
            <td class="py-3 pr-2">
                <select class="input-box" onchange="updateItem(${index}, 'gst', this.value)">
                    ${[0, 5, 12, 18, 28].map(g => `<option value="${g}" ${+item.gst === g ? "selected" : ""}>${g}%</option>`).join("")}
                </select>
            </td>
            <td class="py-3 text-right">
                <button onclick="removeItem(${index})" class="text-slate-300 hover:text-red-500 font-bold text-xl transition">&times;</button>
            </td>
        </tr>
    `).join("");
    calculateEngine();
}

// 3. Update & Remove Items
window.updateItem = (index, key, value) => {
    items[index][key] = (key === 'desc' || key === 'hsn') ? value : parseFloat(value) || 0;
    calculateEngine();
};

window.removeItem = (index) => {
    if(items.length > 1) { items.splice(index, 1); renderItems(); }
};

document.getElementById('addItemBtn').addEventListener('click', () => {
    items.push({ desc: "", hsn: "", qty: 1, rate: 0, gst: 18 });
    renderItems();
});

// 4. Advanced Calculator Engine
function calculateEngine() {
    let totals = { taxable: 0, cgst: 0, sgst: 0, igst: 0, grand: 0 };
    const sellerState = document.getElementById('sellerState').value;
    const buyerState = document.getElementById('buyerState').value;
    const isIntraState = (sellerState === buyerState);

    items.forEach(item => {
        let baseAmount = item.qty * item.rate;
        let taxAmount = baseAmount * (item.gst / 100);
        
        totals.taxable += baseAmount;
        if (isIntraState) {
            totals.cgst += taxAmount / 2;
            totals.sgst += taxAmount / 2;
        } else {
            totals.igst += taxAmount;
        }
    });

    totals.grand = totals.taxable + totals.cgst + totals.sgst + totals.igst;

    // Update UI
    document.getElementById('ui-taxable').textContent = moneyFormat(totals.taxable);
    document.getElementById('ui-cgst').textContent = moneyFormat(totals.cgst);
    document.getElementById('ui-sgst').textContent = moneyFormat(totals.sgst);
    document.getElementById('ui-igst').textContent = moneyFormat(totals.igst);
    document.getElementById('ui-grand').textContent = moneyFormat(totals.grand);
    document.getElementById('ui-mode').textContent = isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)";
}

// Listen to state changes
document.getElementById('sellerState').addEventListener('change', calculateEngine);
document.getElementById('buyerState').addEventListener('change', calculateEngine);

// 5. PDF Generation with Premium Template
document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const isIntraState = (document.getElementById('sellerState').value === document.getElementById('buyerState').value);
    
    // Build PDF HTML
    const pdfContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; background: white; width: 210mm; min-height: 297mm; box-sizing: border-box;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 25px; margin-bottom: 30px;">
            <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; text-transform: uppercase;">${escapeHTML(document.getElementById('sellerName').value)}</h1>
                <p style="margin: 8px 0 0; font-size: 12px; color: #64748b; white-space: pre-wrap;">${escapeHTML(document.getElementById('sellerAddress').value)}</p>
                <p style="margin: 4px 0 0; font-size: 12px; font-weight: bold;">GSTIN: <span style="font-weight: normal;">${escapeHTML(document.getElementById('sellerGSTIN').value) || 'N/A'}</span></p>
            </div>
            <div style="text-align: right;">
                <h2 style="margin: 0; font-size: 32px; font-weight: 900; color: #4f46e5; letter-spacing: -1px;">INVOICE</h2>
                <p style="margin: 10px 0 2px; font-size: 12px;"><b>Invoice No:</b> ${escapeHTML(document.getElementById('invNum').value)}</p>
                <p style="margin: 0; font-size: 12px;"><b>Date:</b> ${document.getElementById('invDate').value}</p>
            </div>
        </div>

        <!-- Billed To -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="margin: 0 0 8px; font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Billed To</p>
            <h3 style="margin: 0 0 6px; font-size: 18px; color: #0f172a;">${escapeHTML(document.getElementById('buyerName').value) || 'Client Name'}</h3>
            <p style="margin: 0 0 6px; font-size: 12px; color: #475569; white-space: pre-wrap;">${escapeHTML(document.getElementById('buyerAddress').value)}</p>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">GSTIN: <span style="font-weight: normal;">${escapeHTML(document.getElementById('buyerGSTIN').value) || 'N/A'}</span></p>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
                <tr style="background: #0f172a; color: white; text-align: left; font-size: 11px; text-transform: uppercase;">
                    <th style="padding: 12px; border-radius: 6px 0 0 6px;">Description</th>
                    <th style="padding: 12px;">HSN/SAC</th>
                    <th style="padding: 12px; text-align: center;">Qty</th>
                    <th style="padding: 12px; text-align: right;">Rate</th>
                    <th style="padding: 12px; text-align: center;">GST</th>
                    <th style="padding: 12px; text-align: right; border-radius: 0 6px 6px 0;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => {
                    let amt = item.qty * item.rate;
                    let tax = amt * (item.gst / 100);
                    return `
                    <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                        <td style="padding: 12px; font-weight: 600; color: #0f172a;">${escapeHTML(item.desc)}</td>
                        <td style="padding: 12px; color: #64748b;">${escapeHTML(item.hsn)}</td>
                        <td style="padding: 12px; text-align: center;">${item.qty}</td>
                        <td style="padding: 12px; text-align: right;">${moneyFormat(item.rate)}</td>
                        <td style="padding: 12px; text-align: center;">${item.gst}%</td>
                        <td style="padding: 12px; text-align: right; font-weight: 600;">${moneyFormat(amt + tax)}</td>
                    </tr>`;
                }).join("")}
            </tbody>
        </table>

        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end;">
            <div style="width: 300px;">
                <table style="width: 100%; font-size: 13px; color: #475569;">
                    <tr><td style="padding: 6px 0;">Taxable Amount:</td><td style="text-align: right; font-weight: bold; color: #0f172a;">${document.getElementById('ui-taxable').textContent}</td></tr>
                    ${isIntraState ? `
                        <tr><td style="padding: 6px 0;">CGST:</td><td style="text-align: right;">${document.getElementById('ui-cgst').textContent}</td></tr>
                        <tr><td style="padding: 6px 0;">SGST:</td><td style="text-align: right;">${document.getElementById('ui-sgst').textContent}</td></tr>
                    ` : `
                        <tr><td style="padding: 6px 0;">IGST:</td><td style="text-align: right;">${document.getElementById('ui-igst').textContent}</td></tr>
                    `}
                    <tr><td colspan="2" style="border-top: 2px solid #e2e8f0; margin-top: 8px; padding-top: 12px;"></td></tr>
                    <tr style="font-size: 18px; font-weight: 900; color: #4f46e5;">
                        <td style="padding: 6px 0;">Grand Total:</td><td style="text-align: right;">${document.getElementById('ui-grand').textContent}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Footer Sign -->
        <div style="margin-top: 60px; text-align: right; font-size: 12px; color: #0f172a;">
            <div style="border-top: 1px solid #cbd5e1; width: 200px; display: inline-block; padding-top: 8px; font-weight: bold;">Authorized Signatory</div>
        </div>
    </div>`;

    const container = document.getElementById('pdf-container');
    container.innerHTML = pdfContent;
    container.style.display = 'block';

    html2pdf().set({
        margin: 0,
        filename: `${document.getElementById('invNum').value}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container.firstElementChild).save().then(() => {
        container.style.display = 'none';
        container.innerHTML = '';
    });
});

// Initialize form
renderItems();

