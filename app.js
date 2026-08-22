import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA76trG8L-GDKNuMKbtaORnuDfagRA3zY8",
  authDomain: "gst-bill-maker-d7956.firebaseapp.com",
  projectId: "gst-bill-maker-d7956",
  storageBucket: "gst-bill-maker-d7956.firebasestorage.app",
  messagingSenderId: "564339961180",
  appId: "1:564339961180:web:0e9ff371695d0beeade599"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const $ = id => document.getElementById(id);

$("googleLoginBtn").addEventListener("click", async () => {
  $("loginError").classList.add("hidden");
  try { await signInWithPopup(auth, provider); }
  catch(e) {
    $("loginError").textContent = e.code === "auth/unauthorized-domain"
      ? "This domain is not authorized in Firebase. Add it in Firebase Console → Authentication → Settings → Authorized domains."
      : `Login failed: ${e.message || "Unknown error"}`;
    $("loginError").classList.remove("hidden");
  }
});
$("logoutBtn").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, user => {
  $("loginScreen").classList.toggle("hidden", !!user);
  $("appScreen").classList.toggle("hidden", !user);
  if(user){ $("userName").textContent=user.displayName||"Google User"; $("userEmail").textContent=user.email||""; }
});

const states=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
for(const id of ["sellerState","buyerState"]) $(id).innerHTML='<option value="">Select state</option>'+states.map(s=>`<option>${s}</option>`).join("");
$("sellerState").value="Delhi";
$("invoiceDate").value=new Date().toISOString().slice(0,10);

let logoDataUrl="";
$("logoInput").addEventListener("change",()=>{const f=$("logoInput").files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{logoDataUrl=r.result;$("logoPreview").src=logoDataUrl;$("logoPreview").classList.remove("hidden")};r.readAsDataURL(f)});

let counter=0;
function addItem(d={}) {
  counter++;
  const tr=document.createElement("tr"); tr.className="border-b item-row";
  tr.innerHTML=`<td class="p-2 item-sno">${counter}</td>
  <td class="p-2"><input class="item-input item-name" placeholder="Item name" value="${esc(d.name||"")}"></td>
  <td class="p-2"><input class="item-input item-hsn" required placeholder="HSN/SAC" value="${esc(d.hsn||"")}"></td>
  <td class="p-2"><input class="item-input item-qty" type="number" min="0" step="any" value="${d.qty??1}"></td>
  <td class="p-2"><input class="item-input item-price" type="number" min="0" step="0.01" value="${d.price??0}"></td>
  <td class="p-2"><select class="item-input item-gst">${[0,5,12,18,28].map(g=>`<option value="${g}" ${Number(d.gst??18)===g?"selected":""}>${g}%</option>`).join("")}</select></td>
  <td class="p-2 text-right font-semibold item-total">₹0.00</td>
  <td class="p-2 text-center"><button type="button" class="remove-item text-red-600 p-2">🗑</button></td>`;
  $("itemsBody").appendChild(tr);
  tr.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",calculate));
  tr.querySelector(".remove-item").addEventListener("click",()=>{tr.remove();renumber();if(!$("itemsBody").children.length)addItem();calculate()});
  calculate();
}
function renumber(){[...document.querySelectorAll(".item-row")].forEach((r,i)=>r.querySelector(".item-sno").textContent=i+1)}
$("addItemBtn").addEventListener("click",()=>addItem());
addItem({gst:18});

function getItems(){return [...document.querySelectorAll(".item-row")].map(r=>{const q=+r.querySelector(".item-qty").value||0,p=+r.querySelector(".item-price").value||0,g=+r.querySelector(".item-gst").value||0;return{name:r.querySelector(".item-name").value.trim(),hsn:r.querySelector(".item-hsn").value.trim(),qty:q,price:p,gst:g,taxable:q*p}})}
function calculate(){
  const items=getItems(), taxable=items.reduce((a,x)=>a+x.taxable,0), intra=$("sellerState").value&&$("sellerState").value===$("buyerState").value;
  let cgst=0,sgst=0,igst=0;
  items.forEach(x=>{const t=x.taxable*x.gst/100;if(intra){cgst+=t/2;sgst+=t/2}else igst+=t});
  $("taxableTotal").textContent=money(taxable);$("cgstTotal").textContent=money(cgst);$("sgstTotal").textContent=money(sgst);$("igstTotal").textContent=money(igst);$("grandTotal").textContent=money(taxable+cgst+sgst+igst);
  $("cgstRow").classList.toggle("hidden",!intra);$("sgstRow").classList.toggle("hidden",!intra);$("igstRow").classList.toggle("hidden",intra);
  $("cgstLabel").textContent=`CGST (${rate(cgst,taxable)}%)`;$("sgstLabel").textContent=`SGST (${rate(sgst,taxable)}%)`;$("igstLabel").textContent=`IGST (${rate(igst,taxable)}%)`;
  [...document.querySelectorAll(".item-row")].forEach((r,i)=>r.querySelector(".item-total").textContent=money(items[i].taxable));
}
["sellerState","buyerState"].forEach(id=>$(id).addEventListener("change",calculate));
function rate(t,x){return x?(t/x*100).toFixed(2).replace(/\.00$/,""):"0"}
function money(v){return "₹"+Number(v||0).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}

function valid(){
  for(const id of ["sellerName","sellerAddress","sellerState","buyerName","buyerAddress","buyerState","invoiceNumber","invoiceDate"])if(!$(id).value.trim()){alert("Please fill all required fields.");$(id).focus();return false}
  for(const r of document.querySelectorAll(".item-row"))if(!r.querySelector(".item-name").value.trim()||!r.querySelector(".item-hsn").value.trim()||(+r.querySelector(".item-qty").value||0)<=0){alert("Each item needs a name, HSN/SAC and quantity greater than 0.");return false}
  return true;
}
$("previewBtn").addEventListener("click",()=>{if(!valid())return;$("previewContainer").innerHTML=invoiceHTML();$("previewModal").classList.remove("hidden")});
$("closePreviewBtn").addEventListener("click",()=>$("previewModal").classList.add("hidden"));
$("downloadBtn").addEventListener("click",async()=>{
  if(!valid())return;
  if(typeof html2pdf==="undefined"){alert("PDF library did not load. Reload the page.");return}
  const wrap=document.createElement("div");wrap.innerHTML=invoiceHTML();document.body.appendChild(wrap);
  const no=$("invoiceNumber").value.replace(/[^a-zA-Z0-9_-]/g,"_")||"invoice";
  try{await html2pdf().set({margin:0,filename:`GST-Invoice-${no}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:true,backgroundColor:"#fff"},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}}).from(wrap.firstElementChild).save()}catch(e){console.error(e);alert("PDF generation failed.")}finally{wrap.remove()}
});

function invoiceHTML(){
 const it=getItems(), seller=$("sellerName").value.trim(),sg=$("sellerGstin").value.trim().toUpperCase(),sa=$("sellerAddress").value.trim(),ss=$("sellerState").value,b=$("buyerName").value.trim(),bg=$("buyerGstin").value.trim().toUpperCase(),ba=$("buyerAddress").value.trim(),bs=$("buyerState").value,no=$("invoiceNumber").value.trim(),date=$("invoiceDate").value;
 const intra=ss===bs;let taxable=0,cgst=0,sgst=0,igst=0;
 it.forEach(x=>{taxable+=x.taxable;const t=x.taxable*x.gst/100;if(intra){cgst+=t/2;sgst+=t/2}else igst+=t});
 const total=taxable+cgst+sgst+igst;
 return `<div style="width:210mm;min-height:297mm;background:#fff;color:#111827;font-family:Arial;padding:12mm">
 <div style="display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:10px">
 <div style="display:flex;align-items:center;gap:10px">${logoDataUrl?`<img src="${logoDataUrl}" style="width:55px;height:55px;object-fit:contain">`:""}<div><h1 style="margin:0;font-size:22px">${esc(seller)}</h1><p>${esc(sa)}</p><p><b>GSTIN:</b> ${esc(sg||"N/A")}</p></div></div>
 <div style="text-align:right"><h1 style="margin:0;font-size:22px">TAX INVOICE</h1><p><b>Invoice No:</b> ${esc(no)}</p><p><b>Date:</b> ${esc(date)}</p><p><b>Place of Supply:</b> ${esc(bs)}</p></div></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
 <div style="border:1px solid #cbd5e1;padding:9px"><b>Bill From</b><p>${esc(seller)}</p><p>${esc(sa)}</p><p>State: ${esc(ss)}</p><p>GSTIN: ${esc(sg||"N/A")}</p></div>
 <div style="border:1px solid #cbd5e1;padding:9px"><b>Bill To</b><p>${esc(b)}</p><p>${esc(ba)}</p><p>State: ${esc(bs)}</p><p>GSTIN: ${esc(bg||"N/A")}</p></div></div>
 <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:10px"><thead><tr style="background:#eff6ff">${["S.No","Description","HSN/SAC","Qty","Rate (₹)","GST","Taxable (₹)"].map(x=>`<th style="border:1px solid #cbd5e1;padding:6px;text-align:left">${x}</th>`).join("")}</tr></thead><tbody>
 ${it.map((x,i)=>`<tr>${[i+1,esc(x.name),esc(x.hsn),x.qty,x.price.toFixed(2),x.gst+"%",x.taxable.toFixed(2)].map((v,j)=>`<td style="border:1px solid #cbd5e1;padding:6px;${j>=3?"text-align:right":""}">${v}</td>`).join("")}</tr>`).join("")}
 </tbody></table>
 <div style="margin-left:auto;width:70%;margin-top:10px;font-size:11px">
 <p style="display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding:5px"><span>Taxable Amount</span><b>₹${taxable.toFixed(2)}</b></p>
 ${intra?`<p style="display:flex;justify-content:space-between;padding:5px"><span>CGST</span><b>₹${cgst.toFixed(2)}</b></p><p style="display:flex;justify-content:space-between;padding:5px"><span>SGST</span><b>₹${sgst.toFixed(2)}</b></p>`:`<p style="display:flex;justify-content:space-between;padding:5px"><span>IGST</span><b>₹${igst.toFixed(2)}</b></p>`}
 <p style="display:flex;justify-content:space-between;background:#eff6ff;padding:8px;font-size:14px"><b>Grand Total</b><b>₹${total.toFixed(2)}</b></p></div>
 <p style="margin-top:14px"><b>Amount in Words:</b> ${esc(indianWords(total))} Only</p>
 <div style="margin-top:45px;text-align:right"><span style="display:inline-block;border-top:1px solid #64748b;padding-top:8px;width:170px;text-align:center">Authorized Signatory</span></div>
 </div>`;
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function indianWords(n){n=Math.round(n);if(!n)return"Zero Rupees";const o=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],t=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];const two=x=>x<20?o[x]:t[Math.floor(x/10)]+(x%10?" "+o[x%10]:""),three=x=>x<100?two(x):o[Math.floor(x/100)]+" Hundred"+(x%100?" "+two(x%100):"");let x=n,p=[];if(Math.floor(x/1e7)){p.push(three(Math.floor(x/1e7))+" Crore");x%=1e7}if(Math.floor(x/1e5)){p.push(three(Math.floor(x/1e5))+" Lakh");x%=1e5}if(Math.floor(x/1e3)){p.push(three(Math.floor(x/1e3))+" Thousand");x%=1e3}if(x)p.push(three(x));return p.join(" ")+" Rupees"}

