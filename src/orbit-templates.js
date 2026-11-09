// Orbit Screen 23 — Server Templates & Setup Kits. Local preview only.
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const STORE = "orbit.server-templates.v1";
  const seed = [
    {id:"tpl-stargazers",name:"Stargazers Community",category:"Community",description:"A welcoming space for astronomy fans, sky watchers, and curious minds.",channels:["welcome","announcements","general","observations","missions","off-topic"],roles:["Owner","Moderator","Member","Newcomer"],members:"1.2k",tone:"violet",featured:true},
    {id:"tpl-study",name:"Study Circle",category:"Education",description:"Organize study sessions, questions, shared notes, and focused collaboration.",channels:["start-here","announcements","study-room","questions","resources"],roles:["Organizer","Tutor","Learner"],members:"860",tone:"blue",featured:true},
    {id:"tpl-creative",name:"Pixel Workshop",category:"Creative",description:"A collaborative home for artists, designers, feedback, and creative showcases.",channels:["welcome","showcase","work-in-progress","feedback","resources"],roles:["Lead Artist","Artist","Guest"],members:"540",tone:"pink",featured:false},
    {id:"tpl-gaming",name:"Game Night Hub",category:"Gaming",description:"Plan game nights, find teammates, and share clips and community updates.",channels:["lobby","looking-for-group","announcements","clips","voice-lounge"],roles:["Host","Moderator","Player"],members:"2.4k",tone:"green",featured:false}
  ];
  let templates=load(),category="All",query="",selected=null,applied=null,layer=null,modal=null;
  function load(){try{const v=JSON.parse(localStorage.getItem(STORE));return Array.isArray(v)?v:seed;}catch{return seed;}}
  function save(){try{localStorage.setItem(STORE,JSON.stringify(templates));}catch{}}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function ensure(){
    if(layer)return;
    layer=document.createElement("section");layer.id="orbit-templates-view";layer.className="otpl-view";layer.hidden=true;
    layer.innerHTML='<header class="otpl-header"><div><small>ORBIT SERVER TOOLS</small><h1>Server templates</h1><p>Start with a structured community setup, or save a reusable layout of your own.</p></div><button class="otpl-close" data-tpl="close" aria-label="Close templates">×</button></header><div class="otpl-toolbar"><label class="otpl-search">⌕ <input id="otpl-search" type="search" placeholder="Search templates" aria-label="Search templates"></label><button class="otpl-primary" data-tpl="create">＋ Create template</button></div><nav class="otpl-categories" aria-label="Template categories"><button data-tpl-cat="All">All</button><button data-tpl-cat="Community">Community</button><button data-tpl-cat="Education">Education</button><button data-tpl-cat="Creative">Creative</button><button data-tpl-cat="Gaming">Gaming</button><button data-tpl-cat="My templates">My templates</button></nav><div class="otpl-layout"><main><div class="otpl-section-head"><div><small>START WITH A BLUEPRINT</small><h2 id="otpl-section-title">Explore templates</h2></div><span id="otpl-count"></span></div><div id="otpl-grid" class="otpl-grid"></div></main><aside class="otpl-aside"><div class="otpl-aside-icon">▧</div><h3>Build a consistent community</h3><p>Templates organize channels and starter roles so a new server has a clear structure from day one.</p><ul><li>Channel and category plan</li><li>Starter role suggestions</li><li>Community description</li></ul><small>LOCAL PREVIEW · No server is created or published.</small></aside></div><div id="otpl-detail" class="otpl-detail" hidden></div>';
    $(".main-panel")?.appendChild(layer);
    modal=document.createElement("div");modal.id="otpl-modal";modal.className="otpl-modal-layer";modal.hidden=true;
    modal.innerHTML='<button class="otpl-backdrop" data-tpl-modal-close aria-label="Close dialog"></button><form class="otpl-modal" id="otpl-form"><header><div><small>YOUR SERVER BLUEPRINT</small><h2>Create a template</h2></div><button type="button" data-tpl-modal-close aria-label="Close">×</button></header><p>Save a reusable setup outline from the current server.</p><label>Template name<input name="name" maxlength="48" required placeholder="My community template"></label><label>Category<select name="category"><option>Community</option><option>Education</option><option>Creative</option><option>Gaming</option></select></label><label>Description<textarea name="description" maxlength="220" required placeholder="What is this template for?"></textarea></label><label>Channels to include<input name="channels" maxlength="220" value="welcome, announcements, general, resources" required></label><footer><button type="button" class="otpl-secondary" data-tpl-modal-close>Cancel</button><button class="otpl-primary" type="submit">Save template</button></footer></form></div>';
    document.body.appendChild(modal);
    layer.addEventListener("click",onClick);
    layer.addEventListener("input",e=>{if(e.target.id==="otpl-search"){query=e.target.value;render();}});
    modal.addEventListener("click",e=>{if(e.target.closest("[data-tpl-modal-close]"))modal.hidden=true;});
    $("#otpl-form").addEventListener("submit",createTemplate);
  }
  function open(){ensure();selected=null;applied=null;layer.hidden=false;$(".main-header")?.setAttribute("hidden","");$(".chat-layout")?.setAttribute("hidden","");$("#orbit-server-home")?.setAttribute("hidden","");render();}
  function close(){if(!layer)return;layer.hidden=true;$("#orbit-server-home")?.removeAttribute("hidden");if(!$("#orbit-server-home")){$(".main-header")?.removeAttribute("hidden");$(".chat-layout")?.removeAttribute("hidden");}}
  function card(t){return '<article class="otpl-card"><div class="otpl-card-art '+esc(t.tone)+'"><span>✦</span><small>'+esc(t.category.toUpperCase())+'</small></div><div class="otpl-card-copy"><div class="otpl-card-meta">'+(t.featured?'<span class="otpl-featured">FEATURED</span>':'<span>COMMUNITY BLUEPRINT</span>')+'<span>'+esc(t.members||"Personal")+' members</span></div><h3>'+esc(t.name)+'</h3><p>'+esc(t.description)+'</p><div class="otpl-card-foot"><span>▤ '+t.channels.length+' channels</span><span>♙ '+t.roles.length+' roles</span><button data-tpl-open="'+esc(t.id)+'">Preview →</button></div></div></article>';}
  function render(){
    if(!layer)return;
    const own=category==="My templates";
    let rows=templates.filter(t=>(category==="All"||own?t.custom===true||category==="All":t.category===category)&&(t.name+" "+t.description+" "+t.category).toLowerCase().includes(query.toLowerCase()));
    if(own)rows=templates.filter(t=>t.custom&&(t.name+" "+t.description).toLowerCase().includes(query.toLowerCase()));
    $("#otpl-section-title").textContent=own?"My templates":"Explore templates";
    $("#otpl-count").textContent=rows.length+" templates";
    $("#otpl-grid").innerHTML=rows.length?rows.map(card).join(""):'<div class="otpl-empty"><b>No templates found</b><p>Try another category or create your own template.</p></div>';
    layer.querySelectorAll("[data-tpl-cat]").forEach(b=>b.classList.toggle("active",b.dataset.tplCat===category));
    $("#otpl-detail").hidden=!selected;
    if(selected){const t=templates.find(x=>x.id===selected);if(t)$("#otpl-detail").innerHTML='<button class="otpl-back" data-tpl="back">← Back to templates</button><div class="otpl-detail-head"><div><small>TEMPLATE PREVIEW</small><h2>'+esc(t.name)+'</h2><p>'+esc(t.description)+'</p></div><span class="otpl-template-mark '+esc(t.tone)+'">✦</span></div><div class="otpl-detail-grid"><section><h3>Channel structure</h3><div class="otpl-channel-list">'+t.channels.map((c,i)=>'<div><span>'+(c.includes("voice")?"◖":"#")+'</span><b>'+esc(c)+'</b><small>'+(i===0?"START HERE":"CHANNEL")+'</small></div>').join("")+'</div></section><section><h3>Suggested roles</h3><div class="otpl-role-list">'+t.roles.map((r,i)=>'<div><i class="otpl-role-dot dot-'+i+'"></i><b>'+esc(r)+'</b><span>'+(i===0?"Manage setup":i===1?"Help moderate":"Participate")+'</span></div>').join("")+'</div></section></div><div class="otpl-detail-actions">'+(t.custom?'<button class="otpl-danger" data-tpl-delete="'+esc(t.id)+'">Delete template</button>':'')+'<button class="otpl-primary" data-tpl-use="'+esc(t.id)+'">Use this template</button></div>';}
  }
  function createTemplate(e){e.preventDefault();const f=new FormData(e.currentTarget);const name=String(f.get("name")).trim(),description=String(f.get("description")).trim(),channels=String(f.get("channels")).split(",").map(x=>x.trim().toLowerCase().replace(/[^a-z0-9-]/g,"")).filter(Boolean);if(!name||!description||!channels.length)return;const templateCategory=String(f.get("category"));templates.unshift({id:"custom-"+Date.now(),name,category:templateCategory,description,channels,roles:["Owner","Moderator","Member"],members:"Personal",tone:"violet",featured:false,custom:true});save();category="My templates";query="";selected=null;modal.hidden=true;render();}
  function onClick(e){
    const act=e.target.closest("[data-tpl]")?.dataset.tpl;if(act){if(act==="close")close();if(act==="create"){modal.hidden=false;$("#otpl-form").reset();}if(act==="back"){selected=null;render();}return;}
    const cat=e.target.closest("[data-tpl-cat]");if(cat){category=cat.dataset.tplCat;selected=null;render();return;}
    const openBtn=e.target.closest("[data-tpl-open]");if(openBtn){selected=openBtn.dataset.tplOpen;render();$("#otpl-detail").scrollIntoView({behavior:"smooth",block:"start"});return;}
    const use=e.target.closest("[data-tpl-use]");if(use){const t=templates.find(x=>x.id===use.dataset.tplUse);if(t){applied=t.id;const note=$("#otpl-detail");let status=$(".otpl-applied",note);if(!status){status=document.createElement("p");status.className="otpl-applied";note.appendChild(status);}status.textContent="Template selected: "+t.name+". This is a local setup preview; no server has been created.";use.textContent="Selected";use.disabled=true;}return;}
    const del=e.target.closest("[data-tpl-delete]");if(del){templates=templates.filter(t=>t.id!==del.dataset.tplDelete);save();selected=null;render();}
  }
  document.addEventListener("orbit:open-templates",open);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&layer&&!layer.hidden){if(modal&&!modal.hidden)modal.hidden=true;else close();}});
})();
