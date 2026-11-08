// Orbit Screen 7 — Communities & Discovery Hub (frontend mock only).
(() => {
 const $=s=>document.querySelector(s);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const communities=[
  {id:"astronomy",name:"Cosmic Observatory",category:"Science",icon:"✦",tone:"violet",members:"18.4K",online:"1.2K",description:"A community for astronomy, space missions, and everything beyond Earth.",tags:["Space","Astronomy","Science"],featured:true},
  {id:"indie-games",name:"Indie Game Lounge",category:"Gaming",icon:"⌁",tone:"blue",members:"9.8K",online:"840",description:"Discover indie games, share projects, and find people to play with.",tags:["Gaming","Indie","Community"],featured:true},
  {id:"creative-lab",name:"Creative Lab",category:"Art & Design",icon:"✿",tone:"pink",members:"6.2K",online:"390",description:"A friendly space for artists, designers, and creative experiments.",tags:["Art","Design","Portfolio"]},
  {id:"dev-space",name:"Dev Space",category:"Technology",icon:"⌘",tone:"green",members:"12.1K",online:"970",description:"Learn, build, debug, and discuss software with other developers.",tags:["Coding","Technology","Learning"]},
  {id:"weather-watch",name:"Weather Watchers",category:"Science",icon:"☁",tone:"cyan",members:"3.5K",online:"220",description:"Talk about weather patterns, forecasting, and climate science.",tags:["Weather","Forecast","Climate"]},
  {id:"anime-club",name:"Anime Clubhouse",category:"Entertainment",icon:"◇",tone:"orange",members:"15.7K",online:"1.1K",description:"Seasonal discussions, recommendations, fan art, and watch parties.",tags:["Anime","Discussion","Media"]}
 ];
 const categories=["All","Gaming","Science","Technology","Art & Design","Entertainment"];
 let tab="discover",category="All",query="",joined=new Set(["dev-space"]),modal;
 function ensure(){
  if($("#orbit-discover-view"))return;
  const view=document.createElement("section");view.id="orbit-discover-view";view.className="orbit-discover-view";view.hidden=true;
  view.innerHTML=`
   <header class="od-header"><div class="od-brand"><span>✦</span><div><b>Community Hub</b><small>Find your corner of Orbit</small></div></div><div class="od-header-actions"><button type="button" data-od-action="create">＋ Create a Community</button></div></header>
   <div class="od-tabs"><button data-od-tab="discover" class="active">Discover</button><button data-od-tab="joined">Your Communities</button></div>
   <div class="od-main"><section class="od-content"><div class="od-hero"><div><span class="od-eyebrow">EXPLORE ORBIT</span><h1>Find your people.</h1><p>Explore communities built around the things you enjoy.</p><label class="od-search"><span>⌕</span><input id="od-search-input" placeholder="Search communities..." autocomplete="off"></label></div><div class="od-hero-art"><span>✦</span><i>◌</i><b>◈</b></div></div>
   <div class="od-categories" id="od-categories"></div><div class="od-section-heading"><div><h2 id="od-list-title">Featured communities</h2><p id="od-list-subtitle">Popular places to start exploring.</p></div><span id="od-result-count"></span></div><div class="od-grid" id="od-grid"></div>
   </section><aside class="od-side"><h3>COMMUNITY SPOTLIGHT</h3><div class="od-spotlight"><div class="od-spot-art">✦<span>ORBIT / 07</span></div><b>Cosmic Observatory</b><p>Explore the universe with curious minds.</p><div><span>● 1.2K online</span><span>18.4K members</span></div><button type="button" data-od-join="astronomy">View Community</button></div><div class="od-side-note"><b>Make something together.</b><p>Create a community for your friends, projects, or favorite topics.</p><button type="button" data-od-action="create">Create Community</button></div></aside></div>
  `;
  $(".main-panel").appendChild(view);
  modal=document.createElement("div");modal.id="od-modal-layer";modal.className="od-modal-layer";modal.hidden=true;
  modal.innerHTML=`<button class="od-modal-backdrop" data-od-close aria-label="Close"></button><section class="od-modal" role="dialog" aria-modal="true" aria-labelledby="od-modal-title"><header><div><small>START A SPACE OF YOUR OWN</small><h2 id="od-modal-title">Create a community</h2></div><button type="button" data-od-close>×</button></header><p>Set up a place where people can meet, talk, and share.</p><label>COMMUNITY NAME<input id="od-create-name" maxlength="40" placeholder="e.g. The Stargazers"></label><label>TOPIC<select id="od-create-topic"><option>Friends</option><option>Gaming</option><option>Science</option><option>Technology</option><option>Art & Design</option><option>Other</option></select></label><div class="od-modal-preview"><span>✦</span><div><b>Your new community</b><small>You can customize channels and roles later.</small></div></div><footer><button type="button" data-od-close>Cancel</button><button type="button" data-od-create-confirm>Create Community</button></footer></section>`;
  document.body.appendChild(modal);
  view.addEventListener("click",onClick);modal.addEventListener("click",onModalClick);
  $("#od-search-input").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();render();});
  $("#od-search-input").addEventListener("keydown",e=>{if(e.key==="Escape"){e.target.value="";query="";render();}});
 }
 function render(){
  const view=$("#orbit-discover-view");view.hidden=false;
  view.querySelectorAll("[data-od-tab]").forEach(b=>b.classList.toggle("active",b.dataset.odTab===tab));
  $("#od-categories").innerHTML=categories.map(c=>'<button type="button" data-od-category="'+esc(c)+'" class="'+(category===c?"active":"")+'">'+esc(c)+'</button>').join("");
  $("#od-categories").hidden=tab==="joined";
  $("#od-list-title").textContent=tab==="joined"?"Your communities":category==="All"?"Featured communities":category+" communities";
  $("#od-list-subtitle").textContent=tab==="joined"?"The spaces you've joined on Orbit.":"Popular places to start exploring.";
  let rows=communities.filter(c=>(tab!=="joined"||joined.has(c.id))&&(category==="All"||tab==="joined"||c.category===category)&&(!query||[c.name,c.category,c.description,...c.tags].join(" ").toLowerCase().includes(query)));
  $("#od-result-count").textContent=rows.length+" COMMUNITIES";
  $("#od-grid").innerHTML=rows.length?rows.map(c=>`<article class="od-card"><div class="od-card-banner ${c.tone}"><span class="od-card-icon">${c.icon}</span><span class="od-card-category">${esc(c.category)}</span></div><div class="od-card-body"><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><div class="od-tags">${c.tags.map(t=>'<span>'+esc(t)+'</span>').join("")}</div><div class="od-card-footer"><div><b>${c.members}</b><small>members · ${c.online} online</small></div><button type="button" data-od-join="${c.id}" class="${joined.has(c.id)?"joined":""}">${joined.has(c.id)?"Joined":"Join"}</button></div></div></article>`).join(""):'<div class="od-empty"><span>⌕</span><b>No communities found</b><p>Try another search or category.</p></div>';
 }
 function open(){ensure();tab="discover";category="All";query="";$("#od-search-input").value="";render();$(".main-header").hidden=true;$(".chat-layout").hidden=true;$("#orbit-discover-view").hidden=false;}
 function close(){const v=$("#orbit-discover-view");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
 function onClick(e){
  const t=e.target.closest("[data-od-tab]");if(t){tab=t.dataset.odTab;category="All";render();return;}
  const cat=e.target.closest("[data-od-category]");if(cat){category=cat.dataset.odCategory;render();return;}
  const act=e.target.closest("[data-od-action]")?.dataset.odAction;if(act==="create"){modal.hidden=false;$("#od-create-name").focus();return;}
  const id=e.target.closest("[data-od-join]")?.dataset.odJoin;if(id){const c=communities.find(x=>x.id===id);if(!c)return;if(joined.has(id)){toast("You're already part of "+c.name+".");}else{joined.add(id);render();toast("Joined "+c.name+" in this local preview.");}}
 }
 function onModalClick(e){
  if(e.target.closest("[data-od-close]")){modal.hidden=true;return;}
  if(e.target.closest("[data-od-create-confirm]")){const name=$("#od-create-name").value.trim();if(!name){toast("Enter a community name first.");$("#od-create-name").focus();return;}modal.hidden=true;toast('"'+name+'" created in the local preview.');}
 }
 function toast(msg){let t=$("#orbit-toast");if(!t){t=document.createElement("div");t.id="orbit-toast";t.className="orbit-toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("visible"),2400);}
 document.addEventListener("click",e=>{if(e.target.closest('[data-view="Nitro"]')){e.preventDefault();open();}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(modal&&!modal.hidden)modal.hidden=true;const v=$("#orbit-discover-view");if(v&&!v.hidden)close();}});
})();
