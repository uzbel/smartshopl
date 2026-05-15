// SmartShop App Core

let currentPage = 'dashboard';

function navigate(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const pg = document.getElementById('page-'+page);
  if(pg) pg.classList.add('active');
  const lnk = document.querySelector(`[data-page="${page}"]`);
  if(lnk) lnk.classList.add('active');
  currentPage = page;
  // Update topbar title
  const titles = {
    dashboard:'Bosh sahifa',products:'Mahsulotlar',sales:'Sotish',
    today:'Bugungi sotuv',expenses:'Xarajatlar',owner:'Egasi xarajatlari',
    report:'Oylik hisobot',settings:'Sozlamalar',history:'Tarix',stock:'Ombor'
  };
  document.getElementById('page-title').textContent = titles[page]||page;
  
  // render page
  const renders = {
    dashboard: renderDashboard,
    products: renderProducts,
    sales: renderSalesForm,
    today: renderToday,
    expenses: renderExpenses,
    owner: renderOwnerExp,
    report: renderReport,
    history: renderHistory,
    stock: renderStock,
    settings: renderSettings
  };
  if(renders[page]) renders[page]();
}

function fmt(n){ return Number(n||0).toLocaleString('uz-UZ')+" so'm"; }
function fmtN(n){ return Number(n||0).toLocaleString('uz-UZ'); }

function toast(msg, color='var(--accent3)'){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderLeftColor = color;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }

// ── DASHBOARD ──
function renderDashboard(){
  const ym = DB.currentYM();
  const todayRev = DB.todayRevenue();
  const monthRev = DB.monthRevenue(ym);
  const exp = DB.monthExpenses(ym);
  const cogs = DB.getSales().filter(s=>s.date.startsWith(ym)).reduce((s,x)=>s+(x.costTotal||0),0);
  const profit = monthRev - exp.total - cogs;
  const todaySales = DB.todaySales();
  const lowStock = DB.getProducts().filter(p=>p.stock<=5);

  document.getElementById('db-today-rev').textContent = fmt(todayRev);
  document.getElementById('db-month-rev').textContent = fmt(monthRev);
  document.getElementById('db-month-exp').textContent = fmt(exp.total);
  document.getElementById('db-profit').textContent = fmt(profit);
  document.getElementById('db-profit').className = 'stat-value '+(profit>=0?'green':'red');
  document.getElementById('db-sales-count').textContent = todaySales.length;
  document.getElementById('db-low-stock').textContent = lowStock.length;

  // Recent sales
  const tbody = document.getElementById('db-recent');
  tbody.innerHTML = DB.getSales().slice(-6).reverse().map(s=>`
    <tr>
      <td><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text3)">${s.date} ${s.time||''}</span></td>
      <td>${s.productName}</td>
      <td><span class="badge badge-purple">${fmtN(s.qty)} ${''}</span></td>
      <td style="font-family:'JetBrains Mono',monospace">${fmt(s.total)}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:24px">Sotuv yo\'q</td></tr>';

  // profit bar
  if(monthRev>0){
    const pct = Math.min(100, Math.round(profit/monthRev*100));
    document.getElementById('db-profit-bar').style.width = Math.max(0,pct)+'%';
    document.getElementById('db-profit-pct').textContent = pct+'% foyda';
  }
}

// ── PRODUCTS ──
function renderProducts(search=''){
  let prods = DB.getProducts();
  if(search) prods = prods.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase()));
  const tbody = document.getElementById('prod-tbody');
  tbody.innerHTML = prods.map(p=>{
    const margin = p.sellPrice>0?Math.round((p.sellPrice-p.buyPrice)/p.sellPrice*100):0;
    const stockColor = p.stock<=3?'badge-red':p.stock<=10?'badge-yellow':'badge-green';
    return `<tr>
      <td><b>${p.name}</b><br><span style="font-size:11px;color:var(--text3)">${p.category}</span></td>
      <td style="font-family:'JetBrains Mono',monospace">${fmt(p.buyPrice)}</td>
      <td style="font-family:'JetBrains Mono',monospace">${fmt(p.sellPrice)}</td>
      <td><span class="${stockColor} badge">${fmtN(p.stock)} ${p.unit}</span></td>
      <td><span class="badge badge-purple">${margin}%</span></td>
      <td style="display:flex;gap:6px;padding-top:16px">
        <button class="btn btn-outline btn-sm" onclick="editProduct(${p.id})">&#9998; Tahrir</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">&#10005;</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">&#128230;</div><div class="empty-text">Mahsulot yo\'q</div></div></td></tr>';
}

function addProduct(){
  const name = document.getElementById('p-name').value.trim();
  const cat = document.getElementById('p-cat').value.trim();
  const buy = parseFloat(document.getElementById('p-buy').value);
  const sell = parseFloat(document.getElementById('p-sell').value);
  const stock = parseFloat(document.getElementById('p-stock').value);
  const unit = document.getElementById('p-unit').value.trim()||'dona';
  if(!name||!buy||!sell||!stock){ toast('Barcha maydonlarni to\'ldiring!','var(--danger)'); return; }
  const prods = DB.getProducts();
  const newId = prods.length ? Math.max(...prods.map(p=>p.id))+1 : 1;
  prods.push({id:newId,name,category:cat||'Boshqa',buyPrice:buy,sellPrice:sell,stock,unit});
  DB.saveProducts(prods);
  closeModal('modal-add-product');
  document.getElementById('add-prod-form').reset();
  renderProducts();
  toast('Mahsulot qo\'shildi!');
}

function editProduct(id){
  const p = DB.getProducts().find(x=>x.id===id);
  if(!p) return;
  document.getElementById('ep-id').value = p.id;
  document.getElementById('ep-name').value = p.name;
  document.getElementById('ep-cat').value = p.category;
  document.getElementById('ep-buy').value = p.buyPrice;
  document.getElementById('ep-sell').value = p.sellPrice;
  document.getElementById('ep-stock').value = p.stock;
  document.getElementById('ep-unit').value = p.unit;
  openModal('modal-edit-product');
}

function saveEditProduct(){
  const id = parseInt(document.getElementById('ep-id').value);
  const prods = DB.getProducts();
  const idx = prods.findIndex(p=>p.id===id);
  if(idx<0) return;
  prods[idx] = {
    ...prods[idx],
    name:document.getElementById('ep-name').value.trim(),
    category:document.getElementById('ep-cat').value.trim(),
    buyPrice:parseFloat(document.getElementById('ep-buy').value),
    sellPrice:parseFloat(document.getElementById('ep-sell').value),
    stock:parseFloat(document.getElementById('ep-stock').value),
    unit:document.getElementById('ep-unit').value.trim()||'dona'
  };
  DB.saveProducts(prods);
  closeModal('modal-edit-product');
  renderProducts();
  toast('Mahsulot yangilandi!');
}

function deleteProduct(id){
  if(!confirm('Mahsulotni o\'chirish?')) return;
  DB.saveProducts(DB.getProducts().filter(p=>p.id!==id));
  renderProducts();
  toast('O\'chirildi', 'var(--danger)');
}

// ── SALES ──
function renderSalesForm(){
  const sel = document.getElementById('sale-product');
  if(!sel) return;
  sel.innerHTML = '<option value="">Mahsulot tanlang</option>' +
    DB.getProducts().map(p=>`<option value="${p.id}" data-price="${p.sellPrice}" data-cost="${p.buyPrice}" data-stock="${p.stock}">${p.name} — ${fmt(p.sellPrice)} (${fmtN(p.stock)} ${p.unit})</option>`).join('');
}

function calcSaleTotal(){
  const sel = document.getElementById('sale-product');
  const opt = sel.options[sel.selectedIndex];
  const qty = parseFloat(document.getElementById('sale-qty').value)||0;
  if(opt && opt.dataset.price){
    const total = opt.dataset.price * qty;
    document.getElementById('sale-total-preview').textContent = fmt(total);
  }
}

function addSale(){
  const sel = document.getElementById('sale-product');
  const opt = sel.options[sel.selectedIndex];
  const qty = parseFloat(document.getElementById('sale-qty').value);
  const note = document.getElementById('sale-note').value;
  if(!opt.value||!qty||qty<=0){ toast('Mahsulot va miqdorni kiriting!','var(--danger)'); return; }
  const stock = parseFloat(opt.dataset.stock);
  if(qty>stock){ toast('Omborda yetarli mahsulot yo\'q!','var(--danger)'); return; }
  
  const sales = DB.getSales();
  const newId = sales.length ? Math.max(...sales.map(s=>s.id))+1 : 1;
  const now = new Date();
  const price = parseFloat(opt.dataset.price);
  const cost = parseFloat(opt.dataset.cost);
  sales.push({
    id:newId,
    date:DB.today(),
    time:`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
    productId:parseInt(opt.value),
    productName:opt.text.split(' — ')[0],
    qty,price,total:price*qty,costTotal:cost*qty,note
  });
  DB.saveSales(sales);
  
  // reduce stock
  const prods = DB.getProducts();
  const pi = prods.findIndex(p=>p.id===parseInt(opt.value));
  if(pi>=0){ prods[pi].stock -= qty; DB.saveProducts(prods); }
  
  document.getElementById('sale-form').reset();
  document.getElementById('sale-total-preview').textContent = "0 so'm";
  renderSalesForm();
  toast('Sotuv qo\'shildi!');
  renderToday();
}

// ── TODAY ──
function renderToday(){
  const sales = DB.todaySales();
  const total = sales.reduce((s,x)=>s+x.total,0);
  const cogs = sales.reduce((s,x)=>s+(x.costTotal||0),0);
  document.getElementById('today-count').textContent = sales.length;
  document.getElementById('today-total').textContent = fmt(total);
  document.getElementById('today-profit').textContent = fmt(total-cogs);
  
  const tbody = document.getElementById('today-tbody');
  tbody.innerHTML = sales.slice().reverse().map(s=>`
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--text3)">${s.time||'--:--'}</td>
      <td><b>${s.productName}</b></td>
      <td>${fmtN(s.qty)}</td>
      <td style="font-family:'JetBrains Mono',monospace">${fmt(s.price)}</td>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--accent3)">${fmt(s.total)}</td>
      <td>${s.note||'—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteSale(${s.id})">&#10005;</button></td>
    </tr>
  `).join('') || '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">&#128722;</div><div class="empty-text">Bugun sotuv yo\'q</div></div></td></tr>';
}

function deleteSale(id){
  if(!confirm('Sotuvni o\'chirish?')) return;
  DB.saveSales(DB.getSales().filter(s=>s.id!==id));
  renderToday();
  toast('O\'chirildi','var(--danger)');
}

// ── EXPENSES ──
function renderExpenses(){
  const ym = DB.currentYM();
  const exps = DB.getExpenses();
  const monthExps = exps.filter(e=>e.date.startsWith(ym));
  const total = monthExps.reduce((s,x)=>s+x.amount,0);
  document.getElementById('exp-total').textContent = fmt(total);
  document.getElementById('exp-count').textContent = monthExps.length;
  
  const tbody = document.getElementById('exp-tbody');
  tbody.innerHTML = exps.slice().reverse().map(e=>`
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--text3)">${e.date}</td>
      <td><b>${e.desc}</b></td>
      <td><span class="badge badge-yellow">${e.category||'Boshqa'}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--danger)">${fmt(e.amount)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteExpense(${e.id})">&#10005;</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">&#128178;</div><div class="empty-text">Xarajat yo\'q</div></div></td></tr>';
}

function addExpense(){
  const desc = document.getElementById('exp-desc').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const cat = document.getElementById('exp-cat').value;
  const date = document.getElementById('exp-date').value || DB.today();
  if(!desc||!amount){ toast('Maydonlarni to\'ldiring!','var(--danger)'); return; }
  const exps = DB.getExpenses();
  const newId = exps.length ? Math.max(...exps.map(e=>e.id))+1 : 1;
  exps.push({id:newId,date,desc,amount,category:cat});
  DB.saveExpenses(exps);
  closeModal('modal-add-exp');
  document.getElementById('exp-form').reset();
  renderExpenses();
  toast('Xarajat qo\'shildi!');
}

function deleteExpense(id){
  if(!confirm('O\'chirish?')) return;
  DB.saveExpenses(DB.getExpenses().filter(e=>e.id!==id));
  renderExpenses();
  toast('O\'chirildi','var(--danger)');
}

// ── OWNER EXPENSES ──
function renderOwnerExp(){
  const ym = DB.currentYM();
  const exps = DB.getOwnerExpenses();
  const monthExps = exps.filter(e=>e.date.startsWith(ym));
  const total = monthExps.reduce((s,x)=>s+x.amount,0);
  document.getElementById('oe-total').textContent = fmt(total);
  
  const tbody = document.getElementById('oe-tbody');
  tbody.innerHTML = exps.slice().reverse().map(e=>`
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--text3)">${e.date}</td>
      <td><b>${e.desc}</b></td>
      <td>${e.note||'—'}</td>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--warning)">${fmt(e.amount)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteOwnerExp(${e.id})">&#10005;</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">&#129380;</div><div class="empty-text">Xarajat yo\'q</div></div></td></tr>';
}

function addOwnerExp(){
  const desc = document.getElementById('oe-desc').value.trim();
  const amount = parseFloat(document.getElementById('oe-amount').value);
  const note = document.getElementById('oe-note').value;
  const date = document.getElementById('oe-date').value || DB.today();
  if(!desc||!amount){ toast('Maydonlarni to\'ldiring!','var(--danger)'); return; }
  const exps = DB.getOwnerExpenses();
  const newId = exps.length ? Math.max(...exps.map(e=>e.id))+1 : 1;
  exps.push({id:newId,date,desc,amount,note});
  DB.saveOwnerExpenses(exps);
  closeModal('modal-add-oe');
  document.getElementById('oe-form').reset();
  renderOwnerExp();
  toast('Qo\'shildi!');
}

function deleteOwnerExp(id){
  if(!confirm('O\'chirish?')) return;
  DB.saveOwnerExpenses(DB.getOwnerExpenses().filter(e=>e.id!==id));
  renderOwnerExp();
  toast('O\'chirildi','var(--danger)');
}

// ── REPORT ──
function renderReport(){
  const ym = document.getElementById('report-ym')?.value || DB.currentYM();
  const rev = DB.monthRevenue(ym);
  const exp = DB.monthExpenses(ym);
  const cogs = DB.getSales().filter(s=>s.date.startsWith(ym)).reduce((s,x)=>s+(x.costTotal||0),0);
  const grossProfit = rev - cogs;
  const netProfit = grossProfit - exp.total;
  
  document.getElementById('rp-revenue').textContent = fmt(rev);
  document.getElementById('rp-cogs').textContent = fmt(cogs);
  document.getElementById('rp-gross').textContent = fmt(grossProfit);
  document.getElementById('rp-shopexp').textContent = fmt(exp.shop);
  document.getElementById('rp-ownerexp').textContent = fmt(exp.owner);
  document.getElementById('rp-totalexp').textContent = fmt(exp.total);
  document.getElementById('rp-net').textContent = fmt(netProfit);
  document.getElementById('rp-net').className = 'stat-value '+(netProfit>=0?'green':'red');
  
  // Top products this month
  const salesMonth = DB.getSales().filter(s=>s.date.startsWith(ym));
  const topMap = {};
  salesMonth.forEach(s=>{ topMap[s.productName]=(topMap[s.productName]||0)+s.total; });
  const top = Object.entries(topMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
  document.getElementById('rp-top').innerHTML = top.map(([name,amt],i)=>`
    <tr><td>${i+1}</td><td>${name}</td><td style="font-family:'JetBrains Mono',monospace;color:var(--accent3)">${fmt(amt)}</td></tr>
  `).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text3);padding:16px">Ma\'lumot yo\'q</td></tr>';
}

// ── HISTORY ──
function renderHistory(search=''){
  let sales = DB.getSales().slice().reverse();
  if(search) sales = sales.filter(s=>s.productName.toLowerCase().includes(search.toLowerCase())||s.date.includes(search));
  const tbody = document.getElementById('hist-tbody');
  tbody.innerHTML = sales.map(s=>`
    <tr>
      <td style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text3)">${s.date} ${s.time||''}</td>
      <td>${s.productName}</td>
      <td>${fmtN(s.qty)}</td>
      <td style="font-family:'JetBrains Mono',monospace">${fmt(s.price)}</td>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--accent3)">${fmt(s.total)}</td>
      <td>${s.note||'—'}</td>
    </tr>
  `).join('') || '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">&#128203;</div><div class="empty-text">Sotuv tarixi yo\'q</div></div></td></tr>';
}

// ── STOCK ──
function renderStock(){
  const prods = DB.getProducts();
  const low = prods.filter(p=>p.stock<=5);
  document.getElementById('stk-total').textContent = prods.length;
  document.getElementById('stk-low').textContent = low.length;
  const totalVal = prods.reduce((s,p)=>s+p.stock*p.buyPrice,0);
  document.getElementById('stk-value').textContent = fmt(totalVal);
  
  const tbody = document.getElementById('stk-tbody');
  tbody.innerHTML = prods.map(p=>{
    const sc = p.stock<=3?'badge-red':p.stock<=10?'badge-yellow':'badge-green';
    const pct = Math.min(100, p.stock/50*100);
    return `<tr>
      <td><b>${p.name}</b></td>
      <td><span class="${sc} badge">${fmtN(p.stock)} ${p.unit}</span>
        <div class="profit-bar" style="max-width:120px"><div class="profit-fill" style="width:${pct}%;background:${p.stock<=3?'var(--danger)':p.stock<=10?'var(--warning)':'var(--accent3)'}"></div></div>
      </td>
      <td style="font-family:'JetBrains Mono',monospace">${fmt(p.buyPrice)}</td>
      <td style="font-family:'JetBrains Mono',monospace;color:var(--accent2)">${fmt(p.stock*p.buyPrice)}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="restockProduct(${p.id})">+ Zaxira qo'sh</button>
      </td>
    </tr>`;
  }).join('');
}

function restockProduct(id){
  const qty = parseFloat(prompt('Qancha qo\'shish?'));
  if(!qty||qty<=0) return;
  const prods = DB.getProducts();
  const idx = prods.findIndex(p=>p.id===id);
  if(idx>=0){ prods[idx].stock += qty; DB.saveProducts(prods); }
  renderStock();
  toast('Zaxira yangilandi!');
}

// ── SETTINGS ──
function renderSettings(){
  document.getElementById('set-shop-name').value = DB.get('shop_name')||'SmartShop';
  document.getElementById('set-owner').value = DB.get('owner_name')||'';
  document.getElementById('set-phone').value = DB.get('shop_phone')||'';
}
function saveSettings(){
  DB.set('shop_name', document.getElementById('set-shop-name').value);
  DB.set('owner_name', document.getElementById('set-owner').value);
  DB.set('shop_phone', document.getElementById('set-phone').value);
  toast('Sozlamalar saqlandi!');
}
function clearAllData(){
  if(!confirm('BARCHA ma\'lumotlarni o\'chirish? Bu amalni qaytarib bo\'lmaydi!')) return;
  ['products','sales','owner_exp','expenses','reports','shop_name','owner_name','shop_phone'].forEach(k=>localStorage.removeItem('ss_'+k));
  location.reload();
}

// Update date in topbar
function updateClock(){
  const d = new Date();
  const days = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  const months = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
  document.getElementById('topbar-date').textContent = 
    `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} | ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
setInterval(updateClock, 30000);
updateClock();

// init
document.addEventListener('DOMContentLoaded', ()=>{
  navigate('dashboard');
  document.getElementById('report-ym').value = DB.currentYM();
});
