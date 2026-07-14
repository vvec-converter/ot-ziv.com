(function(){
var OZ_CATS=[
{slug:"tovary",name:"Товары",href:"/katalog/tovary/"},
{slug:"mesta",name:"Места",href:"/katalog/mesta/"},
{slug:"uslugi",name:"Услуги",href:"/katalog/uslugi/"},
{slug:"sajty",name:"Сайты",href:"/katalog/sajty/"}
];
var filterCat=window.OZ_CAT_FILTER||"";
var searchQ=(new URLSearchParams(location.search).get("q")||"").trim().toLowerCase();
var listEl=document.getElementById("bq");
var titleEl=document.getElementById("ah");
var leadEl=document.getElementById("be");
var darkSwitch=document.getElementById("darkSwitch");
if(darkSwitch){
var saved=localStorage.getItem("t");
var dark=saved!=="light";
document.documentElement.setAttribute("data-theme",dark?"dark":"light");
darkSwitch.checked=dark;
darkSwitch.addEventListener("change",function(){
var on=darkSwitch.checked;
document.documentElement.setAttribute("data-theme",on?"dark":"light");
localStorage.setItem("t",on?"dark":"light");
});
}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function stars(n){n=+n||0;return "★".repeat(Math.min(5,Math.max(0,n)))+"☆".repeat(5-Math.min(5,Math.max(0,n)));}
function fmtDate(d){
if(!d)return "";
try{
var dt=new Date(d);
if(isNaN(dt))return esc(d);
return dt.toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"});
}catch(e){return esc(d);}
}
function markCats(){
document.querySelectorAll(".de a[data-cat]").forEach(function(a){
var on=!!filterCat&&a.getAttribute("data-cat")===filterCat;
a.classList.toggle("dy",on);
});
}
function renderItem(r){
var text=r.text||"";
var long=text.length>320;
var id=esc(r.id||"");
var html="<article class=\"bp\" id=\"r-"+id+"\">";
html+="<div class=\"bo\"><h2 class=\"ay\">"+esc(r.name||"Без названия")+"</h2>";
html+="<span class=\"cj\">"+esc(r.category||"")+"</span></div>";
html+="<div class=\"ax\" aria-label=\""+(+r.rating||0)+" из 5\">"+stars(r.rating)+"</div>";
html+="<p class=\"bu"+(long?" bz":"")+"\">"+esc(text)+"</p>";
if(long)html+="<button type=\"button\" class=\"bs\">Читать полностью</button>";
html+="<div class=\"br\"><span>"+esc(r.user||"Аноним")+"</span>";
if(r.date)html+="<span>"+fmtDate(r.date)+"</span>";
html+="</div>";
if(r.tags)html+="<p class=\"bt\">"+esc(r.tags)+"</p>";
html+="</article>";
return html;
}
function bindMore(){
document.querySelectorAll(".bs").forEach(function(btn){
btn.addEventListener("click",function(){
var p=btn.previousElementSibling;
if(!p)return;
p.classList.remove("bz");
btn.remove();
});
});
}
function renderList(items){
if(!listEl)return;
if(!items.length){
listEl.innerHTML="<p class=\"cx\">Пока нет опубликованных отзывов"+(filterCat?" в этой категории":"")+".</p>";
return;
}
listEl.innerHTML=items.map(renderItem).join("");
bindMore();
}
function load(){
if(titleEl){
titleEl.textContent=filterCat?filterCat:"Каталог отзывов";
document.title=(filterCat?filterCat+" — ":"")+"Каталог — ot-ziv.com";
}
if(leadEl){
if(searchQ){
leadEl.textContent="Поиск: «"+searchQ+"»";
}else{
leadEl.textContent=filterCat
?"Опубликованные отзывы: "+filterCat.toLowerCase()+"."
:"Все опубликованные отзывы о товарах, местах, услугах и сайтах.";
}
}
markCats();
fetch("/data/reviews.json?t="+Date.now())
.then(function(r){if(!r.ok)throw new Error("");return r.json();})
.then(function(data){
var items=Array.isArray(data)?data:[];
if(filterCat)items=items.filter(function(r){return r&&r.category===filterCat;});
if(searchQ){
items=items.filter(function(r){
if(!r)return false;
var hay=[r.name,r.text,r.user,r.tags,r.category].join(" ").toLowerCase();
return hay.indexOf(searchQ)>=0;
});
}
items.sort(function(a,b){
var da=a&&a.date?new Date(a.date).getTime():0;
var db=b&&b.date?new Date(b.date).getTime():0;
return db-da;
});
renderList(items);
})
.catch(function(){
if(listEl)listEl.innerHTML="<p class=\"cx\">Не удалось загрузить каталог. Проверьте файл data/reviews.json на GitHub.</p>";
});
}
var btn=document.getElementById("bm");
var topBar=document.getElementById("cg");
var drawer=document.getElementById("cn");
function setDrawer(open){
if(!drawer||!btn)return;
drawer.classList.toggle("dp",open);
if(topBar)topBar.classList.toggle("au",open);
btn.classList.toggle("ce",open);
btn.textContent=open?"×":"☰";
btn.setAttribute("aria-expanded",open?"true":"false");
}
if(btn&&drawer){
btn.addEventListener("click",function(){setDrawer(!drawer.classList.contains("dp"));});
drawer.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){setDrawer(false);});});
}
var cats=document.getElementById("bn");
var cPrev=document.getElementById("ak");
var cNext=document.getElementById("aj");
function updCats(){
if(!cats||!cPrev||!cNext)return;
cPrev.disabled=cats.scrollLeft<=2;
cNext.disabled=cats.scrollLeft+cats.clientWidth>=cats.scrollWidth-2;
}
if(cats&&cPrev&&cNext){
cPrev.addEventListener("click",function(){cats.scrollBy({left:-180,behavior:"smooth"});});
cNext.addEventListener("click",function(){cats.scrollBy({left:180,behavior:"smooth"});});
cats.addEventListener("scroll",updCats);
window.addEventListener("resize",updCats);
updCats();
}
load();
})();
