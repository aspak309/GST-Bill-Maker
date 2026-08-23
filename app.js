// 1. All India States Array
const states = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const sellerStateEl = document.getElementById('sellerState');
const buyerStateEl = document.getElementById('buyerState');
states.forEach(s => {
    sellerStateEl.add(new Option(s, s));
    buyerStateEl.add(new Option(s, s));
});
sellerStateEl.value = "Punjab";
buyerStateEl.value = "Delhi";

// 2. Base64 Image Upload Engine (No Server Needed!)
let logoBase64 = "";
let qrBase64 = "";

document.getElementById('logoInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { logoBase64 = event.target.result; document.getElementById('logoText').innerText = "✅ Logo Loaded"; };
    reader.readAsDataURL(file);
});

document.getElementById('qrInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { qrBase64 = event.target.result; document.getElementById('qrText').innerText = "✅ QR Loaded"; };
    reader.readAsDataURL(file);
});

// 3. Amount to Words Converter (Indian System)
function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
    return str.trim();
}

// 4. Form & Calculation Logic
document.getElementById('invDate').valueAsDate = new Date();
let items = [{ desc: "Web & Digital Services", hsn: "9983", qty: 1, rate: 0, gst: 18 }];
let currentGrandTotal = 0;

const formatMoney = (amount) => "₹" + parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escapeHTML = (str) => String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

function renderItems() {
    document.getElementById('itemRows').innerHTML = items.map((item, index) => `
        <tr>
            <td class="p-1"><input type="text" class="input-box" value="${item.desc}" oninput="updateItem(${index}, 'desc', this.value)"></td>
            <td class="p-1"><input type="text" class="input-box" value="${item.hsn}" oninput="updateItem(${index}, 'hsn', this.value)"></td>
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

window.updateItem = (idx, key, val) => { items[idx][key] = (key === 'desc' || key === 'hsn') ? val : parseFloat(val) || 0; calculateEngine(); };
window.removeItem = (idx) => { if(items.length > 1) { items.splice(idx, 1); renderItems(); } };
document.getElementById('addItemBtn').addEventListener('click', () => { items.push({ desc: "", hsn: "", qty: 1, rate: 0, gst: 18 }); renderItems(); });

function calculateEngine() {
    let totals = { taxable: 0, cgst: 0, sgst: 0, igst: 0, grand: 0 };
    const isIntraState = (sellerStateEl.value === buyerStateEl.value);
    document.getElementById('placeSupply').value = buyerStateEl.value; // Auto update POS

    items.forEach(item => {
        let base = item.qty * item.rate;
        let tax = base * (item.gst / 100);
        totals.taxable += base;
        if (isIntraState) { totals.cgst += tax / 2; totals.sgst += tax / 2; } 
        else { totals.igst += tax; }
    });

    totals.grand = totals.taxable + totals.cgst + totals.sgst + totals.igst;
    currentGrandTotal = Math.round(totals.grand); // For words

    document.getElementById('ui-taxable').textContent = formatMoney(totals.taxable);
    document.getElementById('ui-cgst').textContent = formatMoney(totals.cgst);
    document.getElementById('ui-sgst').textContent = formatMoney(totals.sgst);
    document.getElementById('ui-igst').textContent = formatMoney(totals.igst);
    document.getElementById('ui-grand').textContent = formatMoney(totals.grand);
    document.getElementById('ui-mode').textContent = isIntraState ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)";
}

sellerStateEl.addEventListener('change', calculateEngine);
buyerStateEl.addEventListener('change', calculateEngine);

// 5. MASTER PDF GENERATION (Pixel Perfect)
document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const isIntraState = (sellerStateEl.value === buyerStateEl.value);
    
    // Build PDF HTML
    const pdfHtml = `
    <div style="font-family: Arial, sans-serif; width: 210mm; min-height: 297mm; padding: 40px; box-sizing: border-box; background: white; color: #000;">
        
        <!-- Header -->
        <table style="width: 100%; border-bottom: 3px solid #1e1e1e; padding-bottom: 15px; margin-bottom: 20px;">
            <tr>
                <td style="width: 15%; vertical-align: top;">
                    ${logoBase64 ? `<img src="${logoBase64}" style="max-width: 100px; max-height: 80px;">` : ''}
                </td>
                <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #1e1e1e; text-transform: uppercase;">${escapeHTML(document.getElementById('sellerName').value) || 'COMPANY NAME'}</h1>
                    <p style="margin: 5px 0 0; font-size: 13px; white-space: pre-wrap;">${escapeHTML(document.getElementById('sellerAddress').value)}</p>
                    <p style="margin: 3px 0 0; font-size: 13px;"><b>State:</b> ${sellerStateEl.value}</p>
                    ${document.getElementById('sellerGSTIN').value ? `<p style="margin: 3px 0 0; font-size: 13px;"><b>GSTIN:</b> ${escapeHTML(document.getElementById('sellerGSTIN').value)}</p>` : ''}
                </td>
                <td style="width: 35%; text-align: right; vertical-align: top;">
                    <h2 style="margin: 0; font-size: 30px; font-weight: 900; color: #1e1e1e; letter-spacing: 1px;">TAX INVOICE</h2>
                    <p style="margin: 10px 0 2px; font-size: 13px;"><b>Invoice No:</b> ${escapeHTML(document.getElementById('invNum').value)}</p>
                    <p style="margin: 0 0 2px; font-size: 13px;"><b>Date:</b> ${document.getElementById('invDate').value}</p>
                    <p style="margin: 0; font-size: 13px;"><b>Place of Supply:</b> ${document.getElementById('placeSupply').value}</p>
                </td>
            </tr>
        </table>

        <!-- Billed To -->
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0 0 5px; font-size: 11px; font-weight: bold; color: #6c757d; text-transform: uppercase;">Billed To (Buyer)</p>
            <h3 style="margin: 0 0 5px; font-size: 18px; color: #000;">${escapeHTML(document.getElementById('buyerName').value) || 'Client Name'}</h3>
            <p style="margin: 0 0 4px; font-size: 13px; white-space: pre-wrap;">${escapeHTML(document.getElementById('buyerAddress').value)}</p>
            <p style="margin: 0 0 4px; font-size: 13px;"><b>State:</b> ${buyerStateEl.value}</p>
            ${document.getElementById('buyerGSTIN').value ? `<p style="margin: 0; font-size: 13px;"><b>GSTIN:</b> ${escapeHTML(document.getElementById('buyerGSTIN').value)}</p>` : ''}
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
                <tr style="background: #1e1e1e; color: #fff;">
                    <th style="padding: 10px; border: 1px solid #1e1e1e; text-align: center; width: 5%;">#</th>
                    <th style="padding: 10px; border: 1px solid #1e1e1e; text-align: left;">Description of Goods / Services</th>
                    <th style="padding: 10px; border: 1px solid #1e1e1e; text-align: center; width: 12%;">HSN/SAC</th>
                    <th style="padding: 10px; border: 1px solid #1e1e1e; text-align: center; width: 8%;">Qty</th>
                    <th style="padding: 10px; border: 1px solid #1e1e1e; text-align: right; width: 15%;">Rate</th>
                    <th style="padding: 10px; border: 1px solid #1e1e1e; text-align: center; width: 8%;">GST</th>
                    <th style="padding: 10px; border: 1px solid #1e1e1e; text-align: right; width: 18%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, idx) => {
                    let amt = item.qty * item.rate;
                    let tax = amt * (item.gst / 100);
                    return `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${idx + 1}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">${escapeHTML(item.desc)}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${escapeHTML(item.hsn)}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${item.qty}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right;">${formatMoney(item.rate)}</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">${item.gst}%</td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right; font-weight: bold;">${formatMoney(amt + tax)}</td>
                    </tr>`;
                }).join("")}
            </tbody>
        </table>

        <!-- Totals & Payment Details -->
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: top; width: 60%; padding-right: 20px;">
                    <!-- Amount in words -->
                    <div style="margin-bottom: 20px; font-size: 13px;">
                        <p style="margin: 0 0 5px; font-weight: bold; color: #6c757d;">Total Amount (in words):</p>
                        <p style="margin: 0; font-weight: bold; color: #000; background: #f8f9fa; padding: 10px; border: 1px dashed #ccc;">${numberToWords(currentGrandTotal)} Rupees</p>
                    </div>

                    <!-- Bank Details -->
                    <table style="width: 100%; font-size: 13px; margin-bottom: 20px;">
                        <tr>
                            <td style="width: 70%; vertical-align: top;">
                                <p style="margin: 0 0 5px; font-weight: bold; color: #6c757d;">Bank Details:</p>
                                <p style="margin: 2px 0;"><b>Bank Name:</b> ${escapeHTML(document.getElementById('bankName').value) || 'N/A'}</p>
                                <p style="margin: 2px 0;"><b>Account No:</b> ${escapeHTML(document.getElementById('accNum').value) || 'N/A'}</p>
                                <p style="margin: 2px 0;"><b>IFSC Code:</b> ${escapeHTML(document.getElementById('ifscCode').value) || 'N/A'}</p>
                            </td>
                            <td style="width: 30%; text-align: center; vertical-align: top;">
                                ${qrBase64 ? `<img src="${qrBase64}" style="max-width: 80px; max-height: 80px; border: 1px solid #000; padding: 2px;"><br><span style="font-size:10px;">Scan to Pay</span>` : ''}
                            </td>
                        </tr>
                    </table>

                    <!-- T&C -->
                    <div style="font-size: 11px;">
                        <p style="margin: 0 0 3px; font-weight: bold; color: #6c757d;">Terms & Conditions:</p>
                        <p style="margin: 0; white-space: pre-wrap;">${escapeHTML(document.getElementById('termsCond').value)}</p>
                    </div>
                </td>
                
                <td style="vertical-align: top; width: 40%;">
                    <!-- Tax Summary Box -->
                    <table style="width: 100%; font-size: 14px; border: 1px solid #1e1e1e; border-collapse: collapse;">
                        <tr><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">Taxable Amount:</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">${document.getElementById('ui-taxable').textContent}</td></tr>
                        ${isIntraState ? `
                            <tr><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">CGST:</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">${document.getElementById('ui-cgst').textContent}</td></tr>
                            <tr><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">SGST:</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">${document.getElementById('ui-sgst').textContent}</td></tr>
                        ` : `
                            <tr><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">IGST:</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">${document.getElementById('ui-igst').textContent}</td></tr>
                        `}
                        <tr style="font-size: 18px; font-weight: 900; background: #f8f9fa; color: #000;">
                            <td style="padding: 12px; border-top: 2px solid #1e1e1e;">Grand Total:</td><td style="padding: 12px; text-align: right; border-top: 2px solid #1e1e1e;">${document.getElementById('ui-grand').textContent}</td>
                        </tr>
                    </table>
                    
                    <!-- Signature -->
                    <div style="margin-top: 50px; text-align: center; font-size: 13px;">
                        <div style="margin: 0 auto; border-top: 1px solid #000; width: 200px; padding-top: 8px; font-weight: bold;">Authorized Signatory</div>
                        <p style="margin: 5px 0 0; color: #6c757d;">For ${escapeHTML(document.getElementById('sellerName').value) || 'Company'}</p>
                    </div>
                </td>
            </tr>
        </table>
    </div>`;

    const container = document.getElementById('pdf-container');
    container.innerHTML = pdfHtml;
    container.style.display = 'block';

    html2pdf().set({
        margin: [5, 0, 5, 0], // Top, Right, Bottom, Left margins for A4
        filename: `Invoice_${document.getElementById('invNum').value}.pdf`,
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

