// 1. All India States List
const indianStates = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
    "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", 
    "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", 
    "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
    "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// Populate Dropdowns
const sellerStateSelect = document.getElementById('sellerState');
const buyerStateSelect = document.getElementById('buyerState');

indianStates.forEach(state => {
    sellerStateSelect.add(new Option(state, state));
    buyerStateSelect.add(new Option(state, state));
});

// Set Default States (Just to start, user can change)
sellerStateSelect.value = "Punjab";
buyerStateSelect.value = "Delhi";

// 2. Initial Setup
document.getElementById('invDate').valueAsDate = new Date();
let items = [{ desc: "", hsn: "", qty: 1, rate: 0, gst: 18 }];

const moneyFormat = (amount) => "₹" + parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escapeHTML = (str) => String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

// 3. Render Items
function renderItems() {
    const tbody = document.getElementById('itemRows');
    tbody.innerHTML = items.map((item, index) => `
        <tr>
            <td class="p-1"><input type="text" class="input-box" placeholder="Item Name" value="${item.desc}" oninput="updateItem(${index}, 'desc', this.value)"></td>
            <td class="p-1"><input type="text" class="input-box" placeholder="HSN" value="${item.hsn}" oninput="updateItem(${index}, 'hsn', this.value)"></td>
            <td class="p-1"><input type="number" class="input-box" value="${item.qty}" min="1" oninput="updateItem(${index}, 'qty', this.value)"></td>
            <td class="p-1"><input type="number" class="input-box" value="${item.rate}" min="0" oninput="updateItem(${index}, 'rate', this.value)"></td>
            <td class="p-1">
                <select class="input-box" onchange="updateItem(${index}, 'gst', this.value)">
                    ${[0, 5, 12, 18, 28].map(g => `<option value="${g}" ${+item.gst === g ? "selected" : ""}>${g}%</option>`).join("")}
                </select>
            </td>
            <td class="p-1 text-center"><button onclick="removeItem(${index})" class="text-red-500 font-bold">&times;</button></td>
        </tr>
    `).join("");
    calculateEngine();
}

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

// 4. Advanced Calculator Logic
function calculateEngine() {
    let totals = { taxable: 0, cgst: 0, sgst: 0, igst: 0, grand: 0 };
    const isIntraState = (document.getElementById('sellerState').value === document.getElementById('buyerState').value);

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

    document.getElementById('ui-taxable').textContent = moneyFormat(totals.taxable);
    document.getElementById('ui-cgst').textContent = moneyFormat(totals.cgst);
    document.getElementById('ui-sgst').textContent = moneyFormat(totals.sgst);
    document.getElementById('ui-igst').textContent = moneyFormat(totals.igst);
    document.getElementById('ui-grand').textContent = moneyFormat(totals.grand);
    document.getElementById('ui-mode').textContent = isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)";
}

document.getElementById('sellerState').addEventListener('change', calculateEngine);
document.getElementById('buyerState').addEventListener('change', calculateEngine);

// 5. Pixel-Perfect PDF Generation
document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const isIntraState = (document.getElementById('sellerState').value === document.getElementById('buyerState').value);
    
    // Bank & T&C Data
    const bankName = escapeHTML(document.getElementById('bankName').value);
    const accNum = escapeHTML(document.getElementById('accNum').value);
    const ifscCode = escapeHTML(document.getElementById('ifscCode').value);
    const terms = escapeHTML(document.getElementById('termsCond').value).replace(/\n/g, '<br>');

    let bankHtml = bankName || accNum ? `
        <div style="margin-top: 20px; font-size: 11px;">
            <p style="margin: 0 0 5px; font-weight: bold; color: #64748b; text-transform: uppercase;">Bank Details:</p>
            <p style="margin: 2px 0;"><b>Bank Name:</b> ${bankName}</p>
            <p style="margin: 2px 0;"><b>A/C No:</b> ${accNum}</p>
            <p style="margin: 2px 0;"><b>IFSC:</b> ${ifscCode}</p>
        </div>` : '';

    const pdfContent = `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: #000; background: white; width: 210mm; min-height: 297mm; box-sizing: border-box;">
        
        <!-- Header -->
        <table style="width: 100%; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
            <tr>
                <td style="vertical-align: top; width: 60%;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">${escapeHTML(document.getElementById('sellerName').value) || 'COMPANY NAME'}</h1>
                    <p style="margin: 5px 0 0; font-size: 12px; white-space: pre-wrap;">${escapeHTML(document.getElementById('sellerAddress').value)}</p>
                    <p style="margin: 3px 0 0; font-size: 12px;"><b>State:</b> ${document.getElementById('sellerState').value}</p>
                    <p style="margin: 3px 0 0; font-size: 12px;"><b>GSTIN:</b> ${escapeHTML(document.getElementById('sellerGSTIN').value) || 'N/A'}</p>
                </td>
                <td style="vertical-align: top; text-align: right; width: 40%;">
                    <h2 style="margin: 0; font-size: 28px; font-weight: bold;">TAX INVOICE</h2>
                    <p style="margin: 8px 0 2px; font-size: 12px;"><b>Invoice No:</b> ${escapeHTML(document.getElementById('invNum').value)}</p>
                    <p style="margin: 0; font-size: 12px;"><b>Date:</b> ${document.getElementById('invDate').value}</p>
                </td>
            </tr>
        </table>

        <!-- Billed To -->
        <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0 0 5px; font-size: 10px; font-weight: bold; color: #555;">BILLED TO:</p>
            <h3 style="margin: 0 0 5px; font-size: 16px;">${escapeHTML(document.getElementById('buyerName').value) || 'Client Name'}</h3>
            <p style="margin: 0 0 4px; font-size: 12px; white-space: pre-wrap;">${escapeHTML(document.getElementById('buyerAddress').value)}</p>
            <p style="margin: 0 0 4px; font-size: 12px;"><b>State:</b> ${document.getElementById('buyerState').value}</p>
            <p style="margin: 0; font-size: 12px;"><b>GSTIN:</b> ${escapeHTML(document.getElementById('buyerGSTIN').value) || 'N/A'}</p>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000;">
            <thead>
                <tr style="background: #f0f0f0; font-size: 11px; text-transform: uppercase;">
                    <th style="padding: 10px; border: 1px solid #000; text-align: left;">S.No</th>
                    <th style="padding: 10px; border: 1px solid #000; text-align: left;">Description</th>
                    <th style="padding: 10px; border: 1px solid #000;">HSN/SAC</th>
                    <th style="padding: 10px; border: 1px solid #000;">Qty</th>
                    <th style="padding: 10px; border: 1px solid #000; text-align: right;">Rate</th>
                    <th style="padding: 10px; border: 1px solid #000;">GST</th>
                    <th style="padding: 10px; border: 1px solid #000; text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, idx) => {
                    let amt = item.qty * item.rate;
                    let tax = amt * (item.gst / 100);
                    return `
                    <tr style="font-size: 12px;">
                        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${idx + 1}</td>
                        <td style="padding: 10px; border: 1px solid #000;">${escapeHTML(item.desc)}</td>
                        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${escapeHTML(item.hsn)}</td>
                        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${item.qty}</td>
                        <td style="padding: 10px; border: 1px solid #000; text-align: right;">${moneyFormat(item.rate)}</td>
                        <td style="padding: 10px; border: 1px solid #000; text-align: center;">${item.gst}%</td>
                        <td style="padding: 10px; border: 1px solid #000; text-align: right;">${moneyFormat(amt + tax)}</td>
                    </tr>`;
                }).join("")}
            </tbody>
        </table>

        <!-- Totals & Bank Details -->
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: top; width: 60%; padding-right: 20px;">
                    ${bankHtml}
                    <div style="margin-top: 20px; font-size: 10px;">
                        <p style="margin: 0 0 5px; font-weight: bold; color: #64748b; text-transform: uppercase;">Terms & Conditions:</p>
                        <p style="margin: 0;">${terms}</p>
                    </div>
                </td>
                <td style="vertical-align: top; width: 40%;">
                    <table style="width: 100%; font-size: 12px; border: 1px solid #000; border-collapse: collapse;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #ccc;">Taxable Amount:</td><td style="padding: 8px; text-align: right; border-bottom: 1px solid #ccc;">${document.getElementById('ui-taxable').textContent}</td></tr>
                        ${isIntraState ? `
                            <tr><td style="padding: 8px; border-bottom: 1px solid #ccc;">CGST:</td><td style="padding: 8px; text-align: right; border-bottom: 1px solid #ccc;">${document.getElementById('ui-cgst').textContent}</td></tr>
                            <tr><td style="padding: 8px; border-bottom: 1px solid #ccc;">SGST:</td><td style="padding: 8px; text-align: right; border-bottom: 1px solid #ccc;">${document.getElementById('ui-sgst').textContent}</td></tr>
                        ` : `
                            <tr><td style="padding: 8px; border-bottom: 1px solid #ccc;">IGST:</td><td style="padding: 8px; text-align: right; border-bottom: 1px solid #ccc;">${document.getElementById('ui-igst').textContent}</td></tr>
                        `}
                        <tr style="font-size: 16px; font-weight: bold; background: #f0f0f0;">
                            <td style="padding: 10px; border-top: 2px solid #000;">Grand Total:</td><td style="padding: 10px; text-align: right; border-top: 2px solid #000;">${document.getElementById('ui-grand').textContent}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        
        <!-- Footer Sign -->
        <div style="margin-top: 80px; text-align: right; font-size: 12px;">
            <p style="margin: 0;">For <b>${escapeHTML(document.getElementById('sellerName').value) || 'Company'}</b></p>
            <div style="margin-top: 40px; border-top: 1px solid #000; width: 200px; display: inline-block; padding-top: 8px; font-weight: bold;">Authorized Signatory</div>
        </div>
    </div>`;

    const container = document.getElementById('pdf-container');
    container.innerHTML = pdfContent;
    container.style.display = 'block';

    html2pdf().set({
        margin: 0,
        filename: `Invoice_${document.getElementById('invNum').value}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container.firstElementChild).save().then(() => {
        container.style.display = 'none';
        container.innerHTML = '';
    });
});

// Initialize form
renderItems();

