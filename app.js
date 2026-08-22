import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithRedirect, 
    getRedirectResult, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// 1. Firebase Setup (Bilkul Sahi API Key ke sath)
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

// 2. DOM Elements for Auth
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const userName = document.getElementById("userName");
const loginError = document.getElementById("loginError");

// Redirect Logic (Pop-up error ka pakka ilaaj)
getRedirectResult(auth).catch((error) => {
    console.error("Login Error:", error);
    if(loginError) {
        loginError.textContent = "Login Failed. Try again.";
        loginError.classList.remove("hidden");
    }
});

googleLoginBtn?.addEventListener("click", () => {
    signInWithRedirect(auth, provider);
});

logoutBtn?.addEventListener("click", () => {
    signOut(auth);
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginPage.classList.add("hidden");
        appPage.classList.remove("hidden");
        if(userName) userName.textContent = user.displayName || user.email;
    } else {
        appPage.classList.add("hidden");
        loginPage.classList.remove("hidden");
    }
});

// ==========================================
// 3. INVOICE GENERATOR LOGIC
// ==========================================

const $ = id => document.getElementById(id);
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let items = [{ name: "", hsn: "", qty: 1, rate: 0, gst: 18 }];

// Set Default Date
function today() {
    let d = new Date();
    d = new Date(d - d.getTimezoneOffset() * 60000);
    if($("invoiceDate")) $("invoiceDate").value = d.toISOString().slice(0, 10);
}
today();

const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

function render() {
    if(!$("itemsBody")) return;
    $("itemsBody").innerHTML = items.map((x, i) => `<tr class="border-b border-slate-200">
        <td class="p-3 text-slate-500 font-bold">${i + 1}</td>
        <td class="p-2"><input class="field" data-i="${i}" data-k="name" value="${esc(x.name)}" placeholder="Item Name"></td>
        <td class="p-2"><input class="field" data-i="${i}" data-k="hsn" value="${esc(x.hsn)}" placeholder="HSN"></td>
        <td class="p-2"><input type="number" class="field" data-i="${i}" data-k="qty" value="${x.qty}" min="1"></td>
        <td class="p-2"><input type="number" class="field" data-i="${i}" data-k="rate" value="${x.rate}" min="0"></td>
        <td class="p-2"><select class="field" data-i="${i}" data-k="gst">${[0, 5, 12, 18, 28].map(g => `<option value="${g}" ${+x.gst === g ? "selected" : ""}>${g}%</option>`).join("")}</select></td>
        <td class="p-3 font-bold text-slate-800">${money(x.qty * x.rate)}</td>
        <td class="p-2 text-center"><button data-del="${i}" class="text-red-500 hover:text-red-700 font-bold text-xl px-2">×</button></td>
    </tr>`).join("");
    calc();
}

if($("itemsBody")) {
    $("itemsBody").oninput = e => {
        let t = e.target;
        if (!t.dataset.i) return;
        let i = +t.dataset.i, k = t.dataset.k;
        items[i][k] = ["name", "hsn"].includes(k) ? t.value : +t.value;
        calc();
    };
    $("itemsBody").onclick = e => {
        let b = e.target.closest("[data-del]");
        if (!b) return;
        if (items.length > 1) items.splice(+b.dataset.del, 1);
        else items = [{ name: "", hsn: "", qty: 1, rate: 0, gst: 18 }];
        render();
    };
}

if($("addItemBtn")) {
    $("addItemBtn").onclick = () => {
        items.push({ name: "", hsn: "", qty: 1, rate: 0, gst: 18 });
        render();
    };
}
render();

function calc() {
    let taxable = 0, cgst = 0, sgst = 0, igst = 0;
    let sellerState = $("sellerState")?.value || "";
    let buyerState = $("buyerState")?.value || "";
    let intra = sellerState && buyerState && sellerState === buyerState;
    
    items.forEach(x => {
        let b = (+x.qty || 0) * (+x.rate || 0), t = b * (+x.gst || 0) / 100;
        taxable += b;
        if (intra) { cgst += t / 2; sgst += t / 2; } else { igst += t; }
    });

    let grand = taxable + cgst + sgst + igst;

    if($("summaryTaxable")) $("summaryTaxable").textContent = money(taxable);
    if($("summaryCGST")) $("summaryCGST").textContent = money(cgst);
    if($("summarySGST")) $("summarySGST").textContent = money(sgst);
    if($("summaryIGST")) $("summaryIGST").textContent = money(igst);
    if($("summaryGrand")) $("summaryGrand").textContent = money(grand);
    if($("summaryMode")) $("summaryMode").textContent = intra ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)";
    
    return { taxable, cgst, sgst, igst, grand, intra };
}

document.querySelectorAll("input, textarea, select").forEach(x => x.addEventListener("input", calc));

function data() {
    return {
        seller: { name: $("sellerName").value, address: $("sellerAddress").value, gstin: $("sellerGSTIN").value, state: $("sellerState").value },
        buyer: { name: $("buyerName").value, address: $("buyerAddress").value, gstin: $("buyerGSTIN").value, state: $("buyerState").value },
        no: $("invoiceNumber").value, date: $("invoiceDate").value, place: $("placeSupply").value
    };
}

// PREMIUM PDF GENERATION TEMPLATE
function generateHTML() {
    let d = data(), c = calc();
    let rows = items.map((x, i) => {
        let b = x.qty * x.rate, t = b * x.gst / 100;
        return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 10px; text-align: center; color: #64748b;">${i + 1}</td>
            <td style="padding: 10px; font-weight: bold; color: #0f172a;">${esc(x.name)}</td>
            <td style="padding: 10px; color: #475569;">${esc(x.hsn)}</td>
            <td style="padding: 10px; text-align: center;">${x.qty}</td>
            <td style="padding: 10px; text-align: right;">${money(x.rate)}</td>
            <td style="padding: 10px; text-align: center;">${x.gst}%</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">${money(b + t)}</td>
        </tr>`;
    }).join("");

    let taxBreakup = c.intra 
        ? `<div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#475569;"><span>CGST:</span><span>${money(c.cgst)}</span></div>
           <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#475569;"><span>SGST:</span><span>${money(c.sgst)}</span></div>`
        : `<div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#475569;"><span>IGST:</span><span>${money(c.igst)}</span></div>`;

    return `
    <div style="font-family: 'Arial', sans-serif; padding: 20px; color: #0f172a; max-width: 800px; margin: auto;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <h1 style="margin: 0; font-size: 28px; color: #1e3a8a; font-weight: 900; text-transform: uppercase;">${esc(d.seller.name) || 'COMPANY NAME'}</h1>
                <p style="margin: 5px 0 0; font-size: 12px; color: #475569; white-space: pre-line;">${esc(d.seller.address)}</p>
                <p style="margin: 5px 0 0; font-size: 12px; font-weight: bold;">GSTIN: <span style="font-weight: normal;">${esc(d.seller.gstin)}</span></p>
            </div>
            <div style="text-align: right;">
                <div style="background: #1e3a8a; color: white; padding: 5px 15px; border-radius: 4px; font-size: 20px; font-weight: 900; display: inline-block; margin-bottom: 10px;">TAX INVOICE</div>
                <p style="margin: 2px 0; font-size: 12px;"><strong>Invoice No:</strong> ${esc(d.no)}</p>
                <p style="margin: 2px 0; font-size: 12px;"><strong>Date:</strong> ${esc(d.date)}</p>
                <p style="margin: 2px 0; font-size: 12px;"><strong>Place of Supply:</strong> ${esc(d.place || d.buyer.state)}</p>
            </div>
        </div>

        <!-- Details -->
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <p style="margin: 0 0 5px; font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Billed To:</p>
                <h3 style="margin: 0 0 5px; font-size: 16px; color: #0f172a;">${esc(d.buyer.name) || 'Client Name'}</h3>
                <p style="margin: 0 0 5px; font-size: 12px; color: #475569; white-space: pre-line;">${esc(d.buyer.address)}</p>
                <p style="margin: 0; font-size: 12px; font-weight: bold;">GSTIN: <span style="font-weight: normal;">${esc(d.buyer.gstin) || 'N/A'}</span></p>
            </div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background: #1e3a8a; color: white; text-align: left; font-size: 11px;">
                    <th style="padding: 10px; text-align: center;">#</th>
                    <th style="padding: 10px;">Item Description</th>
                    <th style="padding: 10px;">HSN/SAC</th>
                    <th style="padding: 10px; text-align: center;">Qty</th>
                    <th style="padding: 10px; text-align: right;">Rate</th>
                    <th style="padding: 10px; text-align: center;">GST</th>
                    <th style="padding: 10px; text-align: right;">Total Amount</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>

        <!-- Totals -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <div style="width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #475569; font-size: 12px;">
                    <span>Taxable Amount:</span><span style="font-weight: bold; color: #0f172a;">${money(c.taxable)}</span>
                </div>
                ${taxBreakup}
                <div style="border-top: 1px solid #cbd5e1; margin: 10px 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #1e3a8a;">
                    <span>Grand Total:</span><span>${money(c.grand)}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
            <div>
                <p style="margin: 0 0 5px; font-weight: bold; color: #0f172a;">Terms & Conditions</p>
                <p style="margin: 0;">1. All disputes subject to jurisdiction.</p>
                <p style="margin: 0;">2. Goods once sold will not be taken back.</p>
            </div>
            <div style="text-align: center; width: 200px;">
                <div style="height: 50px;"></div>
                <div style="border-top: 1px solid #94a3b8; padding-top: 5px; font-weight: bold; color: #0f172a;">Authorized Signatory</div>
            </div>
        </div>
    </div>`;
}

if($("previewBtn")) {
    $("previewBtn").onclick = () => {
        $("invoicePreview").innerHTML = generateHTML();
        $("previewModal").classList.remove("hidden");
    };
}

if($("closePreviewBtn")) {
    $("closePreviewBtn").onclick = () => {
        $("previewModal").classList.add("hidden");
    };
}

function downloadPDF() {
    $("invoicePreview").innerHTML = generateHTML();
    $("previewModal").classList.remove("hidden");
    
    let name = ($("invoiceNumber").value || "GST-Invoice").replace(/[^a-z0-9_-]/gi, "_");
    
    html2pdf().set({
        margin: 0, 
        filename: name + ".pdf", 
        image: { type: "jpeg", quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    }).from($("invoicePreview")).save().then(() => {
        $("previewModal").classList.add("hidden");
    });
}

if($("downloadBtn")) $("downloadBtn").onclick = downloadPDF;
if($("previewDownloadBtn")) $("previewDownloadBtn").onclick = downloadPDF;
googleLoginBtn?.addEventListener("click", () => {
    alert("बटन काम कर रहा है!"); // बस ये लाइन जोड़ दो
    signInWithRedirect(auth, provider);
});


