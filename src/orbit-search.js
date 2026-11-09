// Orbit Screen 14 — Global Search & Message Discovery. Frontend mock data only.
(() => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const normalize = value => String(value ?? "").toLowerCase();
  const sampleMessages = [
    {id:"m1",author:"Mika",initial:"M",channel:"general",server:"Stargazers",time:"Today · 8:41 PM",text:"Hey everyone! How's the new space looking?",kind:"message"},
    {id:"m2",author:"Kai",initial:"K",channel:"general",server:"Stargazers",time:"Today · 8:43 PM",text:"The layout is coming together. I like the channel organization.",kind:"message"},
    {id:"m3",author:"Aevryn",initial:"A",channel:"general",server:"Stargazers",time:"Today · 8:45 PM",text:"Still polishing the main experience. More screens are coming soon.",kind:"message"},
    {id:"m4",author:"Nova",initial:"N",channel:"updates",server:"Stargazers",time:"Yesterday · 6:20 PM",text:"The next Orbit interface update is ready for review.",kind:"message"},
    {id:"m5",author:"Mika",initial:"M",channel:"media-share",server:"Pixel Lab",time:"Yesterday · 4:12 PM",text:"Sharing a new visual concept for the community.",kind:"message"},
    {id:"m6",author:"Kai",initial:"K",channel:"introductions",server:"Study Room",time:"Monday · 10:05 AM",text:"Welcome to the study group. Share what you're learning this week.",kind:"message"},
    {id:"m7",author:"Nova",initial:"N",channel:"general",server:"Stargazers",time:"Monday · 9:18 AM",text:"Anyone interested in the astronomy discussion tonight?",kind:"message"},
    {id:"m8",author:"Aevryn",initial:"A",channel:"updates",server:"Stargazers",time:"Sunday · 2:30 PM",text:"Event planning notes and community updates are collected here.",kind:"message"}
  ];
  const members = [
    {name:"Aevryn",handle:"@aevryn",status:"Online",detail:"Your account",initial:"A"},
    {name:"Mika",handle:"@mika",status:"Online",detail:"Stargazers · Pixel Lab",initial:"M"},
    {name:"Kai",handle:"@kai",status:"Idle",detail:"Stargazers · Study Room",initial:"K"},
    {name:"Nova",handle:"@nova",status:"Online",detail:"Stargazers",initial:"N"},
    {name:"Jules",handle:"@jules",status:"Offline",detail:"Friend",initial:"J"}
  ];
  const channels = [
    {name:"general",type:"Text channel",server:"Stargazers",detail:"A place for everything and anything."},
    {name:"introductions",type:"Text channel",server:"Study Room",detail:"Say hello and introduce yourself."},
    {name:"media-share",type:"Text channel",server:"Pixel Lab",detail:"Share what you are creating."},
    {name:"updates",type:"Announcement channel",server:"Stargazers",detail:"Project news and announcements."},
    {name:"Lounge",type:"Voice channel",server:"Stargazers",detail:"Voice conversations"}
  ];
  let activeType="all", activeQuery="", activeSort="relevance";
  function styles(){
    if($("#orbit-search-style"))return;
    const style=document.createElement("style");style.id="orbit-search-style";
    style.textContent=`
      .os-search-backdrop{position:fixed;z-index:180;inset:0;display:flex;align-items:flex-start;justify-content:center;padding:9vh 16px 20px;background:#090a0dc9;backdrop-filter:blur(7px)}
      .os-search-backdrop[hidden]{display:none!important}
      .os-search-dialog{width:min(720px,100%);max-height:82vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #464a56;border-radius:15px;background:#252830;color:#e8eaf0;box-shadow:0 28px 90px #0009}
      .os-search-top{padding:18px 19px 13px;border-bottom:1px solid #3c404a}
      .os-search-eyebrow{color:#969eae;font-size:8px;font-weight:800;letter-spacing:1.4px}
      .os-search-title{margin:5px 0 13px;font-size:18px;font-weight:750}
      .os-search-input-wrap{display:flex;align-items:center;gap:10px;padding:0 12px;border:1px solid #626b8a;border-radius:9px;background:#1e2027}
      .os-search-input-wrap>span{color:#aab2c5;font-size:17px}
      .os-search-input{width:100%;height:43px;border:0;outline:0;background:transparent;color:#f4f5f8;font:inherit;font-size:12px}
      .os-search-input::placeholder{color:#858d9b}
      .os-search-hint{display:flex;justify-content:space-between;gap:10px;margin-top:9px;color:#858d9b;font-size:8px}
      .os-search-hint kbd{padding:2px 5px;border:1px solid #4a4e59;border-radius:4px;color:#c3c8d2;font:inherit}
      .os-search-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 18px;border-bottom:1px solid #3c404a}
      .os-search-tabs{display:flex;gap:4px;overflow:auto}
      .os-search-tab{flex:0 0 auto;padding:7px 10px;border:0;border-radius:6px;background:transparent;color:#aeb5c2;font-size:9px;font-weight:700}
      .os-search-tab.active{background:#41465f;color:#fff}
      .os-search-sort{max-width:125px;padding:7px 8px;border:1px solid #484c57;border-radius:6px;background:#20232a;color:#cfd3dc;font:inherit;font-size:8px}
      .os-search-results{min-height:170px;overflow:auto;padding:8px 12px 14px}
      .os-search-count{padding:5px 7px 9px;color:#9299a8;font-size:8px}
      .os-search-result{display:flex;align-items:flex-start;gap:11px;width:100%;padding:11px 9px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left}
      .os-search-result:hover,.os-search-result:focus-visible{outline:0;background:#343844}
      .os-search-avatar{width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;border-radius:50%;background:#4a5074;color:#e2e5ff;font-size:11px;font-weight:800}
      .os-search-avatar.channel{border-radius:9px;background:#3d4355;font-size:15px}
      .os-search-result-copy{min-width:0;flex:1}
      .os-search-result-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
      .os-search-result-head b{font-size:10px}.os-search-result-head small{color:#9299a8;font-size:8px}
      .os-search-result-text{display:block;margin-top:5px;color:#c2c7d1;font-size:9px;line-height:1.55;overflow-wrap:anywhere}
      .os-search-result-text mark{border-radius:2px;background:#75602c;color:#fff0bf}
      .os-search-meta{display:block;margin-top:5px;color:#858d9b;font-size:8px}
      .os-search-empty{padding:36px 14px;text-align:center}.os-search-empty b{display:block;font-size:11px}.os-search-empty p{margin:6px auto 0;max-width:300px;color:#9299a8;font-size:9px;line-height:1.5}
      .os-search-footer{display:flex;justify-content:space-between;gap:12px;padding:10px 17px;border-top:1px solid #3c404a;color:#858d9b;font-size:8px}
      .os-search-close{border:0;background:transparent;color:#b9bfca;font-size:9px}
      @media(max-width:600px){.os-search-backdrop{padding:0;align-items:stretch}.os-search-dialog{width:100%;max-height:100%;border:0;border-radius:0}.os-search-top{padding:17px 14px 12px}.os-search-tools{padding:9px 12px}.os-search-results{padding:7px 8px 18px}.os-search-footer{padding:11px 13px}}
    `;
    document.head.appendChild(style);
  }
  function ensure(){
    if($("#orbit-search-layer"))return;
    styles();
    const layer=document.createElement("div");layer.id="orbit-search-layer";layer.className="os-search-backdrop";layer.hidden=true;
    layer.innerHTML='<section class="os-search-dialog" role="dialog" aria-modal="true" aria-labelledby="os-search-title"><header class="os-search-top"><div class="os-search-eyebrow">ORBIT DISCOVERY</div><h2 class="os-search-title" id="os-search-title">Search Orbit</h2><label class="os-search-input-wrap"><span>⌕</span><input class="os-search-input" id="os-search-input" type="search" autocomplete="off" placeholder="Search messages, people, channels..." aria-label="Search Orbit"></label><div class="os-search-hint"><span>Tip: use <kbd>in:general</kbd> or <kbd>from:mika</kbd></span><span><kbd>Enter</kbd> to search</span></div></header><div class="os-search-tools"><div class="os-search-tabs" role="tablist" aria-label="Search categories"><button class="os-search-tab active" data-search-type="all">Everything</button><button class="os-search-tab" data-search-type="messages">Messages</button><button class="os-search-tab" data-search-type="members">Members</button><button class="os-search-tab" data-search-type="channels">Channels</button></div><select class="os-search-sort" id="os-search-sort" aria-label="Sort results"><option value="relevance">Best match</option><option value="recent">Most recent</option></select></div><div class="os-search-results" id="os-search-results" aria-live="polite"></div><footer class="os-search-footer"><span>Search preview data across Orbit</span><button class="os-search-close" type="button" data-search-close>Close · Esc</button></footer></section>';
    document.body.appendChild(layer);
    layer.addEventListener("click",onClick);
    layer.addEventListener("input",event=>{if(event.target.id==="os-search-input"){activeQuery=event.target.value;render();}});
    layer.addEventListener("change",event=>{if(event.target.id==="os-search-sort"){activeSort=event.target.value;render();}});
    document.addEventListener("keydown",event=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();open();return;}
      if(event.key==="Escape"&&!layer.hidden)close();
      if(event.key==="Enter"&&!layer.hidden&&document.activeElement===$("#os-search-input")){event.preventDefault();render();}
    });
    const searchInput=$(".search-box input");
    if(searchInput){
      searchInput.readOnly=true;searchInput.setAttribute("aria-label","Open Orbit search");searchInput.placeholder="Search Orbit";
      searchInput.addEventListener("click",open);searchInput.addEventListener("focus",open);
      searchInput.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();open();}});
    }
    const explore=$('.rail-bottom [aria-label="Explore"]');
    explore?.addEventListener("click",open);
    render();
  }
  function parseQuery(query){
    const filters={in:"",from:"",terms:[]};
    query.trim().split(/\s+/).filter(Boolean).forEach(token=>{
      if(/^in:/i.test(token))filters.in=token.slice(3).toLowerCase();
      else if(/^from:/i.test(token))filters.from=token.slice(5).replace(/^@/,"").toLowerCase();
      else filters.terms.push(token.toLowerCase());
    });
    return filters;
  }
  function highlight(text,terms){
    let safe=esc(text);
    terms.filter(Boolean).forEach(term=>{
      const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      try{safe=safe.replace(new RegExp("("+escaped+")","ig"),"<mark>$1</mark>");}catch{}
    });
    return safe;
  }
  function getMessages(){
    const live=[...document.querySelectorAll("#messages .message-row")].map((node,index)=>{
      const author=node.querySelector(".message-meta b")?.textContent||"Member";
      const text=node.querySelector(".message-text")?.textContent||"";
      return {id:"live-"+index,author,initial:author.slice(0,1).toUpperCase(),channel:$("#header-title")?.textContent||"general",server:"Current server",time:node.querySelector("time")?.textContent||"Recent",text,kind:"message"};
    });
    return [...live,...sampleMessages];
  }
  function matches(item,filters){
    const haystack=normalize([item.author,item.text,item.name,item.handle,item.channel,item.server,item.detail,item.type].join(" "));
    if(filters.in&&!normalize(item.channel||item.name).includes(filters.in))return false;
    if(filters.from&&!normalize(item.author||item.name||item.handle).includes(filters.from))return false;
    return filters.terms.every(term=>haystack.includes(term));
  }
  function getResults(){
    const filters=parseQuery(activeQuery);
    let results=[];
    if(activeType==="all"||activeType==="messages"){
      results.push(...getMessages().filter(item=>matches(item,filters)));
    }
    if(activeType==="all"||activeType==="members"){
      results.push(...members.filter(item=>matches(item,filters)).map(item=>({...item,kind:"member"})));
    }
    if(activeType==="all"||activeType==="channels"){
      results.push(...channels.filter(item=>matches(item,filters)).map(item=>({...item,kind:"channel"})));
    }
    if(activeSort==="recent")results=results.reverse();
    return results.slice(0,60);
  }
  function render(){
    const container=$("#os-search-results");if(!container)return;
    const results=getResults();
    const filters=parseQuery(activeQuery);
    const queryText=activeQuery.trim();
    if(!queryText){
      container.innerHTML='<div class="os-search-empty"><b>Find anything in Orbit</b><p>Search message text, member names, or channel names. Try <strong>from:mika</strong> or <strong>in:general</strong>.</p></div>';
      return;
    }
    if(!results.length){
      container.innerHTML='<div class="os-search-empty"><b>No results found</b><p>Try a different keyword, remove a filter, or search another category.</p></div>';
      return;
    }
    container.innerHTML='<div class="os-search-count">'+results.length+' result'+(results.length===1?"":"s")+' · '+(activeType==="all"?"Everything":activeType)+'</div>'+results.map((item,index)=>{
      if(item.kind==="member")return '<button class="os-search-result" data-result-kind="member" data-result-index="'+index+'"><span class="os-search-avatar">'+esc(item.initial)+'</span><span class="os-search-result-copy"><span class="os-search-result-head"><b>'+esc(item.name)+'</b><small>'+esc(item.handle)+'</small></span><span class="os-search-result-text">'+esc(item.status)+' · '+esc(item.detail)+'</span><span class="os-search-meta">Member</span></span></button>';
      if(item.kind==="channel")return '<button class="os-search-result" data-result-kind="channel" data-result-index="'+index+'"><span class="os-search-avatar channel">'+(item.type==="Voice channel"?"◖":"#")+'</span><span class="os-search-result-copy"><span class="os-search-result-head"><b>'+esc(item.name)+'</b><small>'+esc(item.type)+'</small></span><span class="os-search-result-text">'+esc(item.detail)+'</span><span class="os-search-meta">'+esc(item.server)+'</span></span></button>';
      return '<button class="os-search-result" data-result-kind="message" data-result-index="'+index+'"><span class="os-search-avatar">'+esc(item.initial)+'</span><span class="os-search-result-copy"><span class="os-search-result-head"><b>'+esc(item.author)+'</b><small>in #'+esc(item.channel)+'</small></span><span class="os-search-result-text">'+highlight(item.text,filters.terms)+'</span><span class="os-search-meta">'+esc(item.server)+' · '+esc(item.time)+'</span></span></button>';
    }).join("");
  }
  function open(){
    ensure();const layer=$("#orbit-search-layer");layer.hidden=false;document.body.style.overflow="hidden";
    const input=$("#os-search-input");input.value=activeQuery;render();requestAnimationFrame(()=>input.focus());
  }
  function close(){
    const layer=$("#orbit-search-layer");if(!layer)return;layer.hidden=true;document.body.style.overflow="";
    $(".search-box input")?.blur();
  }
  function onClick(event){
    if(event.target===event.currentTarget||event.target.closest("[data-search-close]")){close();return;}
    const tab=event.target.closest("[data-search-type]");
    if(tab){activeType=tab.dataset.searchType;document.querySelectorAll("[data-search-type]").forEach(button=>button.classList.toggle("active",button===tab));render();return;}
    const result=event.target.closest("[data-result-kind]");if(!result)return;
    const kind=result.dataset.resultKind,index=Number(result.dataset.resultIndex),item=getResults()[index];if(!item)return;
    close();
    if(kind==="channel"){
      const target=[...document.querySelectorAll("[data-channel]")].find(button=>button.dataset.channel===item.name);
      target?.click();
      const title=$("#header-title");if(!target&&title){title.textContent=item.name;$("#header-topic").textContent=item.detail;}
      showToast("Opened #"+item.name+" in "+item.server+".");
    }else if(kind==="member"){
      const target=[...document.querySelectorAll("[data-dm]")].find(button=>button.dataset.dm===item.name.toLowerCase());
      target?.click();
      showToast("Member: "+item.name+" · "+item.status);
    }else{
      const target=[...document.querySelectorAll("[data-channel]")].find(button=>button.dataset.channel===item.channel);
      target?.click();
      showToast("Search result from #"+item.channel+" · "+item.time);
    }
  }
  function showToast(message){
    let toast=$("#orbit-toast");if(!toast){toast=document.createElement("div");toast.id="orbit-toast";toast.className="orbit-toast";toast.setAttribute("role","status");document.body.appendChild(toast);}
    toast.textContent=message;toast.classList.add("visible");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("visible"),2300);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
})();