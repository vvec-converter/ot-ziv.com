(function(){
var OZ_CATS=[
{slug:"tovary",name:"Товары",href:"/katalog/tovary/"},
{slug:"mesta",name:"Места",href:"/katalog/mesta/"},
{slug:"uslugi",name:"Услуги",href:"/katalog/uslugi/"},
{slug:"sajty",name:"Сайты",href:"/katalog/sajty/"}
];
var filterCat=window.OZ_CAT_FILTER||"";
var searchQ=(new URLSearchParams(location.search).get("q")||"").trim().toLowerCase();
var listEl=document.getElementById("oz_rev_list");
var titleEl=document.getElementById("oz_cat_title");
var leadEl=document.getElementById("oz_cat_lead");
var darkSwitch=document.getElementById("darkSwitch");
if(darkSwitch){
var saved=localStorage.getItem("oz-theme");
var dark=saved!=="light";
document.documentElement.setAttribute("data-theme",dark?"dark":"light");
darkSwitch.checked=dark;
darkSwitch.addEventListener("change",function(){
var on=darkSwitch.checked;
document.documentElement.setAttribute("data-theme",on?"dark":"light");
localStorage.setItem("oz-theme",on?"dark":"light");
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
document.querySelectorAll(".oz_cats a[data-cat]").forEach(function(a){
var on=!!filterCat&&a.getAttribute("data-cat")===filterCat;
a.classList.toggle("oz_on",on);
});
}
function renderItem(r){
var text=r.text||"";
var long=text.length>320;
var id=esc(r.id||"");
var html="<article class=\"oz_rev_item\" id=\"r-"+id+"\">";
html+="<div class=\"oz_rev_head\"><h2 class=\"oz_rev_title\">"+esc(r.name||"Без названия")+"</h2>";
html+="<span class=\"oz_rev_cat\">"+esc(r.category||"")+"</span></div>";
html+="<div class=\"oz_rev_stars\" aria-label=\""+(+r.rating||0)+" из 5\">"+stars(r.rating)+"</div>";
html+="<p class=\"oz_rev_text"+(long?" oz_clamped":"")+"\">"+esc(text)+"</p>";
if(long)html+="<button type=\"button\" class=\"oz_rev_more\">Читать полностью</button>";
html+="<div class=\"oz_rev_meta\"><span>"+esc(r.user||"Аноним")+"</span>";
if(r.date)html+="<span>"+fmtDate(r.date)+"</span>";
html+="</div>";
if(r.tags)html+="<p class=\"oz_rev_tags\">"+esc(r.tags)+"</p>";
html+="</article>";
return html;
}
function bindMore(){
document.querySelectorAll(".oz_rev_more").forEach(function(btn){
btn.addEventListener("click",function(){
var p=btn.previousElementSibling;
if(!p)return;
p.classList.remove("oz_clamped");
btn.remove();
});
});
}
function renderList(items){
if(!listEl)return;
if(!items.length){
listEl.innerHTML="<p class=\"oz_empty\">Пока нет опубликованных отзывов"+(filterCat?" в этой категории":"")+".</p>";
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
if(listEl)listEl.innerHTML="<p class=\"oz_empty\">Не удалось загрузить каталог. Проверьте файл data/reviews.json на GitHub.</p>";
});
}
var btn=document.getElementById("oz_mob_menu");
var topBar=document.getElementById("oz_mob_top");
var drawer=document.getElementById("oz_drawer");
function setDrawer(open){
if(!drawer||!btn)return;
drawer.classList.toggle("oz_open",open);
if(topBar)topBar.classList.toggle("oz_menu_open",open);
btn.classList.toggle("oz_is_open",open);
btn.textContent=open?"×":"☰";
btn.setAttribute("aria-expanded",open?"true":"false");
}
if(btn&&drawer){
btn.addEventListener("click",function(){setDrawer(!drawer.classList.contains("oz_open"));});
drawer.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){setDrawer(false);});});
}
var cats=document.getElementById("oz_nav_cats");
var cPrev=document.getElementById("oz_cats_prev");
var cNext=document.getElementById("oz_cats_next");
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
