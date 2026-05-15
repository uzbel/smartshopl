// SmartShop - Local Storage Data Manager

const DB = {
  get(key){ try{ return JSON.parse(localStorage.getItem('ss_'+key)||'null'); }catch(e){return null;} },
  set(key,val){ localStorage.setItem('ss_'+key, JSON.stringify(val)); },
  
  // Products
  getProducts(){ return this.get('products') || []; },
  saveProducts(p){ this.set('products',p); },
  
  // Sales
  getSales(){ return this.get('sales') || []; },
  saveSales(s){ this.set('sales',s); },
  
  // Owner expenses
  getOwnerExpenses(){ return this.get('owner_exp') || []; },
  saveOwnerExpenses(e){ this.set('owner_exp',e); },
  
  // Expenses (shop costs)
  getExpenses(){ return this.get('expenses') || []; },
  saveExpenses(e){ this.set('expenses',e); },
  
  // Monthly reports
  getReports(){ return this.get('reports') || []; },
  saveReports(r){ this.set('reports',r); },
  
  today(){ return new Date().toISOString().split('T')[0]; },
  
  todaySales(){
    const t = this.today();
    return this.getSales().filter(s=>s.date===t);
  },
  todayRevenue(){
    return this.todaySales().reduce((s,x)=>s+x.total,0);
  },
  monthRevenue(ym){
    return this.getSales().filter(s=>s.date.startsWith(ym)).reduce((s,x)=>s+x.total,0);
  },
  monthExpenses(ym){
    const shop = this.getExpenses().filter(e=>e.date.startsWith(ym)).reduce((s,x)=>s+x.amount,0);
    const owner = this.getOwnerExpenses().filter(e=>e.date.startsWith(ym)).reduce((s,x)=>s+x.amount,0);
    return { shop, owner, total: shop+owner };
  },
  currentYM(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },
  netProfit(ym){
    const rev = this.monthRevenue(ym);
    const exp = this.monthExpenses(ym);
    const cogs = this.getSales().filter(s=>s.date.startsWith(ym))
      .reduce((s,x)=>s+(x.costTotal||0),0);
    return rev - exp.total - cogs;
  }
};

// Seed demo data if empty
function seedDemo(){
  if(DB.getProducts().length) return;
  const today = DB.today();
  const ym = DB.currentYM();
  
  const products = [
    {id:1,name:'Sharbat (Coca-Cola 1L)',category:'Ichimlik',buyPrice:8000,sellPrice:12000,stock:45,unit:'dona'},
    {id:2,name:'Non (bug\'doy)',category:'Oziq-ovqat',buyPrice:3000,sellPrice:4500,stock:80,unit:'dona'},
    {id:3,name:'Yog\' (1L)',category:'Oziq-ovqat',buyPrice:18000,sellPrice:24000,stock:30,unit:'litr'},
    {id:4,name:'Qand (1kg)',category:'Oziq-ovqat',buyPrice:9000,sellPrice:13000,stock:60,unit:'kg'},
    {id:5,name:'Choy (100g)',category:'Ichimlik',buyPrice:12000,sellPrice:18000,stock:25,unit:'paket'},
    {id:6,name:'Tuz (1kg)',category:'Oziq-ovqat',buyPrice:2500,sellPrice:4000,stock:100,unit:'kg'},
    {id:7,name:'Guruch (1kg)',category:'Oziq-ovqat',buyPrice:8000,sellPrice:11000,stock:70,unit:'kg'},
    {id:8,name:'Makaron (450g)',category:'Oziq-ovqat',buyPrice:4500,sellPrice:7000,stock:55,unit:'paket'},
    {id:9,name:'Sabun (1dona)',category:'Gigiyena',buyPrice:5000,sellPrice:8000,stock:40,unit:'dona'},
    {id:10,name:'Shampun (400ml)',category:'Gigiyena',buyPrice:22000,sellPrice:32000,stock:20,unit:'shisha'},
    {id:11,name:'Konserva (baliq)',category:'Oziq-ovqat',buyPrice:12000,sellPrice:18000,stock:35,unit:'banka'},
    {id:12,name:'Sut (1L)',category:'Sut mahsuloti',buyPrice:9000,sellPrice:13000,stock:50,unit:'paket'},
  ];
  DB.saveProducts(products);
  
  // Demo sales for today
  const sales = [
    {id:1,date:today,time:'09:15',productId:1,productName:'Sharbat (Coca-Cola 1L)',qty:3,price:12000,total:36000,costTotal:24000,note:''},
    {id:2,date:today,time:'10:30',productId:2,productName:'Non (bug\'doy)',qty:5,price:4500,total:22500,costTotal:15000,note:''},
    {id:3,date:today,time:'11:00',productId:4,productName:'Qand (1kg)',qty:2,price:13000,total:26000,costTotal:18000,note:''},
    {id:4,date:today,time:'12:45',productId:7,productName:'Guruch (1kg)',qty:3,price:11000,total:33000,costTotal:24000,note:''},
    {id:5,date:today,time:'14:20',productId:9,productName:'Sabun (1dona)',qty:4,price:8000,total:32000,costTotal:20000,note:''},
  ];
  
  // Previous month sales
  const prevD = `${ym}-05`;
  for(let i=1;i<=8;i++){
    sales.push({id:100+i,date:`${ym}-0${i}`,time:'11:00',productId:i,productName:products[i-1].name,qty:Math.floor(Math.random()*5)+1,price:products[i-1].sellPrice,total:products[i-1].sellPrice*(Math.floor(Math.random()*5)+1),costTotal:products[i-1].buyPrice*(Math.floor(Math.random()*5)+1),note:''});
  }
  DB.saveSales(sales);
  
  // Owner expenses (egasi yegan)
  const ownerExp = [
    {id:1,date:today,desc:'Tushlik uchun',amount:25000,note:'Egasi'},
    {id:2,date:`${ym}-03`,desc:'Shaxsiy xarid',amount:50000,note:'Egasi'},
  ];
  DB.saveOwnerExpenses(ownerExp);
  
  // Shop expenses
  const expenses = [
    {id:1,date:`${ym}-01`,desc:'Ijara',amount:800000,category:'Ijara'},
    {id:2,date:`${ym}-02`,desc:'Elektr',amount:120000,category:'Kommunal'},
    {id:3,date:`${ym}-04`,desc:'Ishchi maoshi',amount:500000,category:'Maosh'},
  ];
  DB.saveExpenses(expenses);
}

seedDemo();
window.DB = DB;
