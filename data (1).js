// SmartShop Data

var DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem('ss_' + key) || 'null'); }
    catch(e) { return null; }
  },
  set(key, val) {
    localStorage.setItem('ss_' + key, JSON.stringify(val));
  },
  getProducts()        { return this.get('products') || []; },
  saveProducts(p)      { this.set('products', p); },
  getSales()           { return this.get('sales') || []; },
  saveSales(s)         { this.set('sales', s); },
  getExpenses()        { return this.get('expenses') || []; },
  saveExpenses(e)      { this.set('expenses', e); },
  getOwnerExpenses()   { return this.get('owner_exp') || []; },
  saveOwnerExpenses(e) { this.set('owner_exp', e); },
  today() { return new Date().toISOString().split('T')[0]; },
  currentYM() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  },
  todaySales() {
    const t = this.today();
    return this.getSales().filter(s => s.date === t);
  },
  todayRevenue() {
    return this.todaySales().reduce((a,x) => a + x.total, 0);
  },
  monthRevenue(ym) {
    return this.getSales().filter(s => s.date.startsWith(ym)).reduce((a,x) => a + x.total, 0);
  },
  monthExpenses(ym) {
    const shop  = this.getExpenses().filter(e => e.date.startsWith(ym)).reduce((a,x) => a+x.amount, 0);
    const owner = this.getOwnerExpenses().filter(e => e.date.startsWith(ym)).reduce((a,x) => a+x.amount, 0);
    return { shop, owner, total: shop + owner };
  }
};

if (!localStorage.getItem('ss_seeded')) {
  var today = DB.today();
  var ym = DB.currentYM();
  DB.saveProducts([
    {id:1,  name:"Sharbat (Coca-Cola 1L)", category:"Ichimlik",      buyPrice:8000,  sellPrice:12000, stock:45,  unit:"dona"},
    {id:2,  name:"Non (bug'doy)",          category:"Oziq-ovqat",    buyPrice:3000,  sellPrice:4500,  stock:80,  unit:"dona"},
    {id:3,  name:"Yog' (1L)",              category:"Oziq-ovqat",    buyPrice:18000, sellPrice:24000, stock:30,  unit:"litr"},
    {id:4,  name:"Qand (1kg)",             category:"Oziq-ovqat",    buyPrice:9000,  sellPrice:13000, stock:60,  unit:"kg"},
    {id:5,  name:"Choy (100g)",            category:"Ichimlik",      buyPrice:12000, sellPrice:18000, stock:25,  unit:"paket"},
    {id:6,  name:"Tuz (1kg)",              category:"Oziq-ovqat",    buyPrice:2500,  sellPrice:4000,  stock:100, unit:"kg"},
    {id:7,  name:"Guruch (1kg)",           category:"Oziq-ovqat",    buyPrice:8000,  sellPrice:11000, stock:70,  unit:"kg"},
    {id:8,  name:"Makaron (450g)",         category:"Oziq-ovqat",    buyPrice:4500,  sellPrice:7000,  stock:55,  unit:"paket"},
    {id:9,  name:"Sabun (1dona)",          category:"Gigiyena",      buyPrice:5000,  sellPrice:8000,  stock:40,  unit:"dona"},
    {id:10, name:"Shampun (400ml)",        category:"Gigiyena",      buyPrice:22000, sellPrice:32000, stock:20,  unit:"shisha"},
    {id:11, name:"Konserva (baliq)",       category:"Oziq-ovqat",    buyPrice:12000, sellPrice:18000, stock:35,  unit:"banka"},
    {id:12, name:"Sut (1L)",              category:"Sut mahsuloti", buyPrice:9000,  sellPrice:13000, stock:50,  unit:"paket"},
  ]);
  DB.saveSales([
    {id:1,date:today,time:"09:15",productId:1,productName:"Sharbat (Coca-Cola 1L)",qty:3,price:12000,total:36000,costTotal:24000,note:""},
    {id:2,date:today,time:"10:30",productId:2,productName:"Non (bug'doy)",qty:5,price:4500,total:22500,costTotal:15000,note:""},
    {id:3,date:today,time:"11:00",productId:4,productName:"Qand (1kg)",qty:2,price:13000,total:26000,costTotal:18000,note:""},
  ]);
  DB.saveOwnerExpenses([
    {id:1,date:today,desc:"Tushlik uchun",amount:25000,note:"Egasi"},
  ]);
  DB.saveExpenses([
    {id:1,date:ym+"-01",desc:"Ijara",amount:800000,category:"Ijara"},
    {id:2,date:ym+"-02",desc:"Elektr",amount:120000,category:"Kommunal"},
    {id:3,date:ym+"-04",desc:"Ishchi maoshi",amount:500000,category:"Maosh"},
  ]);
  localStorage.setItem('ss_seeded', '1');
}
