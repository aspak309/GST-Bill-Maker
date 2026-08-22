import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* Replace with Firebase Console -> Project settings -> Your web app config. */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const $ = id => document.getElementById(id);

$("googleLoginBtn").onclick = async () => {
  const b=$("googleLoginBtn"), e=$("loginError");
  e.classList.add("hidden"); b.disabled=true; b.textContent="Signing in…";
  try { await signInWithPopup(auth, provider); }
  catch(err){ console.error(err); e.textContent="Google login failed. Enable Google Sign-in in Firebase and add your domain to Authorized Domains."; e.classList.remove("hidden"); }
  finally { b.disabled=false; b.innerHTML='<span class="mr-2 text-lg">G</span> Continue with Google'; }
};
$("logoutBtn").onclick=()=>signOut(auth);
onAuthStateChanged(auth,u=>{
  $("loginPage").classList.toggle("hidden",!!u); $("dashboard").classList.toggle("hidden",!u);
  if(u){$("userName").textContent=u.displayName||"User";$("userEmail").textContent=u.email||"";}
});
$("invoiceDate").value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);

let logoDataUrl="";
$("logoInput").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>logoDataUrl=r.result;r.readAsDataURL(f)};

const body=$("itemsBody");
function addRow(){
 const tr=document.createElement("tr");tr.className="item-row border-b";
 tr.innerHTML=`<td class="p-3 serial"></td>
 <td class="p-3"><input class="item-input item-name input" required placeholder="Product name"></td>
 <td class="p-3"><input class="item-input hsn input" required placeholder="HSN/SAC"></td>
 <td class="p-3"><input class="item-input qty input" type="number" min="0.01" step="0.01" value="1" required></td>
 <td class="p-3"><input class="item-input price input" type="number" min="0" step="0.01" required placeholder="0.00"></td>
 <td class="p-3"><select class="item-input gst input"><option>0</option><option>5</option><option>12</option><option selected>18</option><option>28</option></select></td>
 <td class="p-3 text-right taxable">₹0.00</td><td class="p-3 text-right total">₹0.00</td>
 <td class="p-3"><button type="button" class="removeItem text-red-600">✕</button></td>`;
 body.appendChild(tr); renumber(); calculate();
}
function renumber(){[...body.querySelectorAll(".item-row")].forEach((r,i)=>r.querySelector(".serial").textContent=i+1)}
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(n||0);
const taxType=()=>document.querySelector('input[name="taxType"]:checked').value;

function calculate(){
 let sub=0,cgst=0,sgst=0,igst=0;
 body.querySelectorAll(".item-row").forEach(r=>{
  const q=+r.querySelector(".qty").value||0,p=+r.querySelector(".price").value||0,g=+r.querySelector(".gst").value||0;
  const taxable=q*p,tax=taxable*g/100;sub+=taxable;
  r.querySelector(".taxable").textContent=money(taxable);r.querySelector(".total").textContent=money(taxable+tax);
  if(taxType()==="intra"){cgst+=tax/2;sgst+=tax/2}else igst+=tax;
 });
 $("subtotal").textContent=money(sub);$("cgstTotal").textContent=money(cgst);$("sgstTotal").textContent=money(sgst);$("igstTotal").textContent=money(igst);$("grandTotal").textContent=money(sub+cgst+sgst+igst);
 return {sub,cgst,sgst,igst,total:sub+cgst+sgst+igst};
}
$("addItemBtn").onclick=addRow;
body.addEventListener("input",calculate);body.addEventListener("change",calculate);
body.addEventListener("click",e=>{if(e.target.closest(".removeItem")){if(body.querySelectorAll(".item-row").length===1)return alert("At least one item is required.");e.target.closest(".item-row").remove();renumber();calculate()}});
document.querySelectorAll('input[name="taxType"]').forEach(x=>x.onchange=calculate);

function valid(){
 if(!$("invoiceForm").reportValidity())return false;
 const gst=/^[0-9A-Z]{15}$/;
 if(!gst.test($("sellerGSTIN").value.trim().toUpperCase())){alert("Seller GSTIN must be 15 characters.");return false}
 const bg=$("buyerGSTIN").value.trim().toUpperCase();if(bg&&!gst.test(bg)){alert("Buyer GSTIN must be 15 characters.");return false}
 return true;
}
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function buildPreview(){
 const t=calculate();
 $("pdfSellerName").textContent=$("sellerName").value.trim();$("pdfSellerAddress").textContent=$("sellerAddress").value.trim();$("pdfSellerGSTIN").textContent=$("sellerGSTIN").value.trim().toUpperCase();
 $("pdfBuyerName").textContent=$("buyerName").value.trim();$("pdfBuyerAddress").textContent=$("buyerAddress").value.trim();$("pdfBuyerGSTIN").textContent=$("buyerGSTIN").value.trim().toUpperCase()||"N/A";$("pdfBuyerState").textContent=$("buyerState").value.trim();
 $("pdfInvoiceNumber").textContent=$("invoiceNumber").value.trim();$("pdfInvoiceDate").textContent=$("invoiceDate").value;$("pdfTaxType").textContent=taxType()==="intra"?"CGST + SGST":"IGST";
 const logo=$("pdfLogo");if(logoDataUrl){logo.src=logoDataUrl;logo.classList.remove("hidden")}else logo.classList.add("hidden");
 $("pdfItems").innerHTML="";
 body.querySelectorAll(".item-row").forEach((r,i)=>{const q=+r.querySelector(".qty").value||0,p=+r.querySelector(".price").value||0,g=+r.querySelector(".gst").value||0,tx=q*p,tot=tx+tx*g/100;
 const tr=document.createElement("tr");tr.innerHTML=`<td class="border p-2 text-center">${i+1}</td><td class="border p-2">${esc(r.querySelector(".item-name").value)}</td><td class="border p-2 text-center">${esc(r.querySelector(".hsn").value)}</td><td class="border p-2 text-center">${q}</td><td class="border p-2 text-right">${money(p)}</td><td class="border p-2 text-center">${g}%</td><td class="border p-2 text-right">${money(tx)}</td><td class="border p-2 text-right">${money(tot)}</td>`;$("pdfItems").appendChild(tr)});
 $("pdfSubtotal").textContent=money(t.sub);$("pdfCGST").textContent=money(t.cgst);$("pdfSGST").textContent=money(t.sgst);$("pdfIGST").textContent=money(t.igst);$("pdfGrandTotal").textContent=money(t.total);
 $("previewWrap").classList.remove("hidden");
}
$("previewBtn").onclick=()=>{if(valid())buildPreview()};
$("downloadPdfBtn").onclick=async()=>{
 if(!valid())return;buildPreview();const b=$("downloadPdfBtn");b.disabled=true;b.textContent="Generating PDF…";
 try{await html2pdf().set({margin:8,filename:`GST-Invoice-${$("invoiceNumber").value.trim().replace(/[^a-z0-9_-]/gi,"-")||"invoice"}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:true,backgroundColor:"#fff"},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).from($("invoicePrint")).save()}
 catch(e){console.error(e);alert("PDF generate nahi ho saka. Please try again.")}
 finally{b.disabled=false;b.textContent="📥 Download PDF"}
};
addRow();calculate();
