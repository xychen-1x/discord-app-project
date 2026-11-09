// Orbit Screen 16 — Pinned Messages & Saved Items (frontend mock only).
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const pins = [
    {id:"p-01",title:"Community guidelines and helpful links",channel:"general",server:"Stargazers",author:"Mika",initial:"M",time:"Pinned Nov 3",text:"Keep discussions respectful, stay on topic, and use the right channels. Helpful links and community resources are collected here.",saved:false},
    {id:"p-02",title:"Weekly astronomy observation plan",channel:"observations",server:"Stargazers",author:"Kai",initial:"K",time:"Pinned Nov 5",text:"This week's plan: check local sky conditions, choose a safe observing spot, and share notes after the session.",saved:false},
    {id:"p-03",title:"Study room schedule",channel:"study-room",server:"Study Room",author:"Nova",initial:"N",time:"Pinned Nov 7",text:"Quiet study sessions run on weekday evenings. Post your focus topic before joining.",saved:false}
  ];
  const saved = [
    {id:"s-01",title:"Python beginner learning path",channel:"study-room",server:"Study Room",author:"Nova",initial:"N",time:"Saved yesterday",text:"Start with variables, data types, conditions, loops, and small practice projects. Build one concept at a time.",kind:"Message"},
    {id:"s-02",title:"Useful data visualization reference",channel:"general",server:"Stargazers",author:"Kai",initial:"K",time:"Saved Nov 6",text:"A useful reference for choosing charts and explaining patterns in a dataset.",kind:"Message"},
    {id:"s-03",title:"Ideas for the Orbit community home",channel:"showcase",server:"Pixel Lab",author:"Jules",initial:"J",time:"Saved Nov 4",text:"Keep the layout readable, make the primary actions easy to find, and use consistent spacing.",kind:"Message"}
  ];
  let tab="pins",query="";
  function style(){
    if($("#osv-style"))return;
    const st=document.createElement("style");st.id="osv-style";
    st.textContent=`
      .osv-view{position:absolute;z-index:48;inset:0;overflow:auto;padding:30px clamp(16px,4vw,48px) 42px;background:#17191f;color:#e9ebf2}
      .osv-view[hidden],.osv-modal[hidden]{display:none!important}
      .osv-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px}
      .osv-head small{font-size:9px;font-weight:800;letter-spacing:1.5px;color:#98a1b4}
      .osv-head h1{margin:7px 0;font-size:clamp(22px,3vw,30px);letter-spacing:-.7px}
      .osv-head p{margin:0;color:#a5acba;font-size:11px;line-height:1.6}
      .osv-close{width:36px;height:36px;border:1px solid #414754;border-radius:9px;background:#242831;color:#e2e5ed;font-size:20px}
      .osv-tabs{display:flex;gap:6px;border-bottom:1px solid #343944;margin-bottom:19px}
      .osv-tab{padding:11px 14px;border:0;border-bottom:2px solid transparent;background:transparent;color:#aeb4c2;font-size:11px;font-weight:700}
      .osv-tab.active{border-bottom-color:#8c9bf0;color:#fff}
      .osv-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:15px}
      .osv-search{width:min(370px,100%);height:39px;padding:0 12px;border:1px solid #3d4350;border-radius:8px;background:#22262e;color:#e9ebf2;font-size:11px}
      .osv-count{color:#929aaa;font-size:10px}
      .osv-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .osv-card{min-width:0;padding:16px;border:1px solid #363c48;border-radius:11px;background:#20242c}
      .osv-card-top{display:flex;align-items:center;gap:9px}
      .osv-avatar{width:32px;height:32px;display:grid;place-items:center;flex:0 0 32px;border-radius:50%;background:#485078;color:#fff;font-size:11px;font-weight:800}
      .osv-author{font-size:10px;font-weight:750}.osv-meta{color:#929aaa;font-size:9px}
      .osv-label{margin-left:auto;padding:4px 7px;border-radius:5px;background:#353d55;color:#c5ceff;font-size:8px;font-weight:750}
      .osv-card h3{margin:13px 0 7px;font-size:13px;line-height:1.4}
      .osv-card p{margin:0;color:#b0b6c3;font-size:10px;line-height:1.7;overflow-wrap:anywhere}
      .osv-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;padding-top:11px;border-top:1px solid #353b46}
      .osv-card-foot small{color:#929aaa;font-size:9px}
      .osv-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}
      .osv-btn{padding:7px 9px;border:1px solid #454c5b;border-radius:6px;background:#292e39;color:#d5dae5;font-size:9px}
      .osv-btn.primary{border-color:#6878c8;background:#6878c8;color:white}
      .osv-empty{grid-column:1/-1;padding:44px 15px;text-align:center;border:1px dashed #414856;border-radius:10px;color:#aeb5c3}
      .osv-empty b{display:block;margin-bottom:6px;color:#e9ebf2;font-size:13px}
      .osv-empty p{font-size:10px}
      .osv-modal{position:fixed;z-index:195;inset:0;display:grid;place-items:center;padding:16px;background:#08090dcc;backdrop-filter:blur(5px)}
      .osv-dialog{width:min(480px,100%);padding:20px;border:1px solid #4a5060;border-radius:13px;background:#252a34;color:#e9ebf2}
      .osv-dialog h2{margin:0 0 5px;font-size:18px}.osv-dialog>p{margin:0 0 16px;color:#aab1bf;font-size:10px}
      .osv-field{display:grid;gap:6px;margin:12px 0;color:#cbd0dc;font-size:10px;font-weight:700}
      .osv-field input,.osv-field textarea,.osv-field select{width:100%;padding:10px;border:1px solid #444b5a;border-radius:7px;background:#1c2028;color:#f1f2f6;font:inherit;font-size:11px}
      .osv-field textarea{min-height:90px;resize:vertical}
      .osv-dialog-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:17px}
      @media(max-width:760px){.osv-list{grid-template-columns:1fr}}
      @media(max-width:560px){.osv-view{padding:22px 14px 34px}.osv-toolbar{align-items:stretch;flex-direction:column}.osv-search{width:100%}.osv-card{padding:13px}.osv-card-foot{align-items:flex-start;flex-direction:column}.osv-actions{width:100%}}
    `;
    document.head.appendChild(st);
  }
  function ensure(){
    if($("#orbit-saved-view"))return;
    style();
    const view=document.createElement("section");view.id="orbit-saved-view";view.className="osv-view";view.hidden=true;
    view.innerHTML='<header class="osv-head"><div><small>YOUR ORBIT LIBRARY</small><h1>Pins & Saved Items</h1><p>Keep important channel messages close and collect useful references in one place.</p></div><button class="osv-close" data-osv="close" aria-label="Close pins and saved items">×</button></header><nav class="osv-tabs" aria-label="Saved content"><button class="osv-tab active" data-osv-tab="pins">Channel Pins</button><button class="osv-tab" data-osv-tab="saved">Saved Items</button></nav><div class="osv-toolbar"><input id="osv-search" class="osv-search" type="search" placeholder="Search titles, messages, people, or channels..." aria-label="Search saved content"><span id="osv-count" class="osv-count"></span><button class="osv-btn primary" data-osv="add">＋ Add saved item</button></div><main id="osv-list" class="osv-list"></main>';
    $(".main-panel").appendChild(view);
    const modal=document.createElement("div");modal.id="osv-modal";modal.className="osv-modal";modal.hidden=true;
    modal.innerHTML='<section class="osv-dialog" role="dialog" aria-modal="true" aria-labelledby="osv-modal-title"><h2 id="osv-modal-title">Save an item</h2><p>Add a personal note or reference to your saved items.</p><form id="osv-form"><label class="osv-field">Title<input name="title" maxlength="90" required placeholder="Give this item a title"></label><label class="osv-field">Source channel<select name="channel"><option>general</option><option>observations</option><option>study-room</option><option>showcase</option></select></label><label class="osv-field">Note or content<textarea name="text" maxlength="1200" required placeholder="Write a note or paste a short reference..."></textarea></label><div class="osv-dialog-foot"><button class="osv-btn" type="button" data-osv="cancel">Cancel</button><button class="osv-btn primary" type="submit">Save item</button></div></form></section>';
    document.body.appendChild(modal);
    view.addEventListener("click",onViewClick);
    $("#osv-search").addEventListener("input",e=>{query=e.target.value.toLowerCase();render();});
    modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest('[data-osv="cancel"]'))closeModal();});
    $("#osv-form").addEventListener("submit",addSaved);
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#osv-modal").hidden)closeModal();else if(!$("#orbit-saved-view").hidden)close();}});
    document.addEventListener("click",e=>{const b=e.target.closest('[aria-label="Pinned messages"]');if(b){e.preventDefault();open();}});
    render();
  }
  function rows(){
    const data=tab==="pins"?pins:saved;
    return data.filter(x=>[x.title,x.channel,x.server,x.author,x.text,x.kind].join(" ").toLowerCase().includes(query));
  }
  function card(x){
    const isPin=tab==="pins";
    return '<article class="osv-card"><div class="osv-card-top"><span class="osv-avatar">'+esc(x.initial)+'</span><div><div class="osv-author">'+esc(x.author)+'</div><div class="osv-meta">#'+esc(x.channel)+' · '+esc(x.server)+'</div></div><span class="osv-label">'+(isPin?"PINNED":esc(x.kind||"SAVED"))+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p><div class="osv-card-foot"><small>'+esc(x.time)+'</small><div class="osv-actions">'+(isPin?'<button class="osv-btn" data-osv-save="'+esc(x.id)+'">Save to my items</button><button class="osv-btn" data-osv-unpin="'+esc(x.id)+'">Unpin</button>':'<button class="osv-btn" data-osv-open="'+esc(x.id)+'">View source</button><button class="osv-btn" data-osv-remove="'+esc(x.id)+'">Remove</button>')+'</div></div></article>';
  }
  function render(){
    const list=$("#osv-list");if(!list)return;
    const data=rows();list.innerHTML=data.length?data.map(card).join(""):'<div class="osv-empty"><b>Nothing here yet</b><p>Try a different search or switch tabs to find your saved content.</p></div>';
    $("#osv-count").textContent=data.length+" "+(tab==="pins"?"pinned messages":"saved items");
    $("#orbit-saved-view").querySelectorAll("[data-osv-tab]").forEach(b=>b.classList.toggle("active",b.dataset.osvTab===tab));
  }
  function open(){ensure();$("#orbit-saved-view").hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;render();}
  function close(){const v=$("#orbit-saved-view");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
  function closeModal(){$("#osv-modal").hidden=true;}
  function addSaved(e){
    e.preventDefault();const d=new FormData(e.currentTarget),title=String(d.get("title")||"").trim(),text=String(d.get("text")||"").trim();if(!title||!text)return;
    const channel=String(d.get("channel"));saved.unshift({id:"s-"+Date.now(),title,channel,server:channel==="study-room"?"Study Room":channel==="showcase"?"Pixel Lab":"Stargazers",author:"You",initial:"A",time:"Saved just now",text,kind:"Note"});
    tab="saved";query="";$("#osv-search").value="";e.currentTarget.reset();closeModal();render();notify("Item saved in this local preview.");
  }
  function onViewClick(e){
    const tabButton=e.target.closest("[data-osv-tab]");if(tabButton){tab=tabButton.dataset.osvTab;render();return;}
    const action=e.target.closest("[data-osv]")?.dataset.osv;if(action==="close"){close();return;}if(action==="add"){$("#osv-modal").hidden=false;$("#osv-form input").focus();return;}
    const save=e.target.closest("[data-osv-save]");if(save){const item=pins.find(x=>x.id===save.dataset.osvSave);if(item&&!saved.some(x=>x.id==="from-"+item.id)){saved.unshift({...item,id:"from-"+item.id,time:"Saved just now",kind:"Pinned message"});notify("Message added to Saved Items.");}render();return;}
    const unpin=e.target.closest("[data-osv-unpin]");if(unpin){const i=pins.findIndex(x=>x.id===unpin.dataset.osvUnpin);if(i>=0)pins.splice(i,1);render();notify("Message unpinned in this preview.");return;}
    const remove=e.target.closest("[data-osv-remove]");if(remove){const i=saved.findIndex(x=>x.id===remove.dataset.osvRemove);if(i>=0)saved.splice(i,1);render();notify("Saved item removed.");return;}
    const openSource=e.target.closest("[data-osv-open]");if(openSource){const item=saved.find(x=>x.id===openSource.dataset.osvOpen);close();notify(item?"Source: #"+item.channel+" · "+item.server:"Source preview unavailable.");}
  }
  function notify(message){let n=$("#orbit-toast");if(!n){n=document.createElement("div");n.id="orbit-toast";n.className="orbit-toast";n.setAttribute("role","status");document.body.appendChild(n);}n.textContent=message;n.classList.add("visible");clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.remove("visible"),2200);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
})();
