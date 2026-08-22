import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// 1. Firebase Config (Corrected API Key)
const firebaseConfig = {
    apiKey: "AIzaSyA76f8G8L-GDKNuMKbtaORnuDfagRA3zY8",
    authDomain: "gst-bill-maker-d7956.firebaseapp.com",
    projectId: "gst-bill-maker-d7956",
    storageBucket: "gst-bill-maker-d7956.firebasestorage.app",
    messagingSenderId: "564339961180",
    appId: "1:564339961180:web:0e9ff371695d0beeade599"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 2. Authentication State Management
const authSection = document.getElementById("auth-section");
let currentUser = null;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        authSection.innerHTML = `
            <span class="text-sm text-slate-300 hidden sm:block">Hi, ${user.displayName?.split(' ')[0] || 'User'}</span>
            <button id="logoutBtn" class="bg-slate-800 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition border border-slate-700">Logout</button>
        `;
        document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));
    } else {
        authSection.innerHTML = `
            <button id="headerLoginBtn" class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-semibold transition text-white">Login</button>
        `;
        document.getElementById("headerLoginBtn").addEventListener("click", () => openAuthModal());
    }
});

// Auth Modal Logic
const authModal = document.getElementById("authModal");
const closeAuthModal = document.getElementById("closeAuthModal");
const modalGoogleLoginBtn = document.getElementById("modalGoogleLoginBtn");
const modalLoginError = document.getElementById("modalLoginError");

function openAuthModal() {
    authModal.classList.remove("hidden");
    modalLoginError.classList.add("hidden");
}

closeAuthModal.addEventListener("click", () => authModal.classList.add("hidden"));

// Login via Popup (Does not reload page, keeps user data safe)
modalGoogleLoginBtn.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
        authModal.classList.add("hidden"); // Hide modal on success
        downloadPDF(); // Auto-download PDF after successful login
    } catch (error) {
        modalLoginError.textContent = "Login Failed. Please try again.";
        modalLoginError.classList.remove("hidden");
        console.error("Login Error: ", error);
    }
});


// =====================================
// 3. INVOICE GENERATOR LOGIC
// =====================================
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let items = [{ name: "", hsn: "", qty: 1, rate: 0, gst: 18 }];

document.getElementById("invoiceDate").valueAsDate = new Date();

function renderItems() {
    const tbody = document.getElementById("itemsBody");
    if(!tbody) return;
    
    tbody.innerHTML = items.map((x, i) => `
        <tr>
            <td class="p-2"><input class="field text-sm" value="${x.name}" placeholder="Item Description" oninput="updateItem(${i}, 'name', this.value)"></td>
            <td class="p-2"><input class="field text-sm" value="${x.hsn}" placeholder="HSN" oninput="updateItem(${i}, 'hsn', this.value)"></td>
            <td class="p-2"><input type="number" class="field text-sm" value="${x.qty}" min="1" oninput="updateItem(${i}, 'qty', this.value)"></td>
            <td class="p-2"><input type="number" class="field text-sm" value="${x.rate}" min="0" oninput="updateItem(${i}, 'rate', this.value)"></td>
            <td class="p-2">
                <select class="field text-sm bg-white" onchange="updateItem(${i}, 'gst', this.value)">
                    ${[0, 5, 12, 18, 28].map(g => `<option value="${g}" ${+x.gst === g ? "selected" : ""}>${g}%</option>`).join("")}
                </select>
            </td>
            <td class="p-2 text-center"><button onclick="removeItem(${i})" class="bg-red-50 hover:bg-red-100 text-red-500 w-8 h-8 rounded-lg font-bold transition">✕</button></td>
        </tr>
    `).join("");
    calculateTotals();
}

window.updateItem = (index, key, value) => {
    items[index][key] = ["name", "hsn"].includes(key) ? value : Number(value);
    calculateTotals();
};

window.removeItem = (index) => {
    if(items.length > 1) items.splice(index, 1);
    renderItems();
};

document.getElementById("addItemBtn").addEventListener("click", () => {
    items.push({ name: "", hsn: "", qty: 1, rate: 0, gst: 18 });
    renderItems();
});

function calculateTotals() {
    let taxable = 0, cgst = 0, sgst = 0, igst = 0;
    let sState = document.getElementById("sellerState").value;
    let bState = document.getElementById("buyerState").value;
    let intra = (sState === bState);

    items.forEach(x => {
        let amt = x.qty * x.rate;
        let tax = amt * (x.gst / 100);
        taxable += amt;
        if(intra) { cgst += tax/2; sgst += tax/2; } else { igst += tax; }
    });

    let grand = taxable + cgst + sgst + igst;

    document.getElementById("summaryTaxable").textContent = money(taxable);
    document.getElementById("summaryCGST").textContent = money(cgst);
    document.getElementById("summarySGST").textContent = money(sgst);
    document.getElementById("summaryIGST").textContent = money(igst);
    document.getElementById("summaryGrand").textContent = money(grand);
    document.getElementById("summaryMode").textContent = intra ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)";
}

document.querySelectorAll("input, select, textarea").forEach(el => el.addEventListener("input", calculateTotals));
renderItems();


// =====================================
// 4. PDF GENERATION LOGIC
// =====================================
function escapeHTML(str) {
    return String(str || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
}

function generateHTML() {
    let sName = escapeHTML(document.getElementById("sellerName").value) || "Company Name";
    let sAddress = escapeHTML(document.getElementById("sellerAddress").value);
    let sGST = escapeHTML(document.getElementById("sellerGSTIN").value);
    let bName = escapeHTML(document.getElementById("buyerName").value) || "Client Name";
    let bAddress = escapeHTML(document.getElementById("buyerAddress").value);
    let invNo = escapeHTML(document.getElementById("invoiceNumber").value);
    
    let rows = items.map((x, i) => {
        let amt = x.qty * x.rate;
        let tax = amt * (x.gst / 100);
        return `<tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 10px; color: #64748b;">${i+1}</td>
            <td style="padding: 10px; font-weight:bold; color: #0f172a;">${escapeHTML(x.name)}</td>
            <td style="padding: 10px; color: #475569;">${escapeHTML(x.hsn)}</td>
            <td style="padding: 10px; text-align: center;">${x.qty}</td>
            <td style="padding: 10px; text-align: right;">${money(x.rate)}</td>
            <td style="padding: 10px; text-align: center;">${x.gst}%</td>
            <td style="padding: 10px; text-align:right; font-weight:bold; color: #0f172a;">${money(amt+tax)}</td>
        </tr>`;
    }).join("");

    return `
    <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 20px;">
            <div>
                <h1 style="margin:0; font-size: 26px; color: #1e3a8a; font-weight: 900; text-transform: uppercase;">${sName}</h1>
                <p style="margin:5px 0 0; font-size: 11px; color: #475569; white-space: pre-wrap;">${sAddress}</p>
                <p style="margin:5px 0 0; font-size: 11px; font-weight: bold;">GSTIN: <span style="font-weight:normal;">${sGST}</span></p>
            </div>
            <div style="text-align: right;">
                <div style="background: #1e3a8a; color: white; padding: 5px 12px; border-radius: 4px; font-size: 18px; font-weight: bold; display: inline-block; margin-bottom: 8px;">TAX INVOICE</div>
                <p style="margin:2px 0; font-size: 11px;"><b>Invoice No:</b> ${invNo}</p>
                <p style="margin:2px 0; font-size: 11px;"><b>Date:</b> ${document.getElementById("invoiceDate").value}</p>
            </div>
        </div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0; width: 60%;">
            <p style="margin:0 0 5px; font-size: 10px; font-weight:bold; color: #64748b;">BILLED TO:</p>
            <h3 style="margin:0 0 5px; font-size: 16px; color: #0f172a;">${bName}</h3>
            <p style="margin:0; font-size: 11px; color: #475569; white-space: pre-wrap;">${bAddress}</p>
            <p style="margin:5px 0 0; font-size: 11px; font-weight: bold;">GSTIN: <span style="font-weight:normal;">${escapeHTML(document.getElementById("buyerGSTIN").value) || 'N/A'}</span></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead style="background: #1e3a8a; color: white; text-align: left; font-size: 11px;">
                <tr>
                    <th style="padding: 10px;">#</th><th style="padding: 10px;">Description</th><th style="padding: 10px;">HSN/SAC</th>
                    <th style="padding: 10px; text-align: center;">Qty</th><th style="padding: 10px; text-align: right;">Rate</th>
                    <th style="padding: 10px; text-align: center;">GST</th><th style="padding: 10px; text-align:right;">Total Amount</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
            <div style="width: 280px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #475569;">
                    <span>Taxable Amount:</span><span style="font-weight:bold; color: #0f172a;">${document.getElementById("summaryTaxable").textContent}</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 10px; font-size: 16px; font-weight: 900; color: #1e3a8a;">
                    <span>Grand Total:</span><span>${document.getElementById("summaryGrand").textContent}</span>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: right; font-size: 11px; color: #64748b;">
            <p style="margin: 0; font-weight: bold; color: #0f172a;">Authorized Signatory</p>
        </div>
    </div>`;
}

// 5. Button Actions
const previewModal = document.getElementById("previewModal");
const invoicePreview = document.getElementById("invoicePreview");

document.getElementById("previewBtn").addEventListener("click", () => {
    invoicePreview.innerHTML = generateHTML();
    previewModal.classList.remove("hidden");
});

document.getElementById("closePreviewBtn").addEventListener("click", () => {
    previewModal.classList.add("hidden");
});

function downloadPDF() {
    // Check Auth Status before downloading
    if (!currentUser) {
        openAuthModal();
        return; // Stop function if not logged in
    }

    // Generate PDF if logged in
    const element = document.createElement("div");
    element.innerHTML = generateHTML();
    element.className = "invoice-paper";
    
    html2pdf().set({
        margin: 0,
        filename: "Tax-Invoice-" + document.getElementById("invoiceNumber").value + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(element).save();
}

document.getElementById("downloadBtn").addEventListener("click", downloadPDF);
document.getElementById("previewDownloadBtn").addEventListener("click", downloadPDF);

