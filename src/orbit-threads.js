// Orbit Screen 15 — Threads & Forum Discussions (frontend mock only).
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const threads = [
    {id:"t-201",title:"What are you observing in the night sky this week?",channel:"observations",server:"Stargazers",author:"Mika",initial:"M",tag:"Astronomy",time:"12 min ago",replies:8,views:42,followed:true,archived:false,last:"Kai: The Moon should be a good target tonight.",body:"Share your observations, sky conditions, and anything interesting you spot this week.",posts:[["Mika","I’m planning a short observing session after sunset. What should I look for?"],["Kai","The Moon should be a good target tonight."],["Nova","I’ll bring my binoculars if the sky stays clear."]]},
    {id:"t-202",title:"Share your current project or experiment",channel:"general",server:"Stargazers",author:"Kai",initial:"K",tag:"Community",time:"38 min ago",replies:14,views:86,followed:false,archived:false,last:"Nova: I have a small data visualization to share.",body:"A place to share what you are building, learning, or experimenting with.",posts:[["Kai","What are you working on right now?"],["Nova","I have a small data visualization to share."],["Aevryn","I’m exploring an AI-assisted weather forecasting project."]]},
    {id:"t-203",title:"Beginner resources for learning Python",channel:"study-room",server:"Study Room",author:"Nova",initial:"N",tag:"Learning",time:"Yesterday",replies:21,views:113,followed:true,archived:false,last:"Mika: Start with variables and simple data types.",body:"Collect beginner-friendly resources and questions about learning Python.",posts:[["Nova","Which resources helped you get started with Python?"],["Mika","Start with variables and simple data types."]]},
    {id:"t-204",title:"Community banner design ideas",channel:"showcase",server:"Pixel Lab",author:"Jules",initial:"J",tag:"Design",time:"2 days ago",replies:5,views:31,followed:false,archived:false,last:"Jules: I’ll post a revised concept soon.",body:"Discuss visual directions and ideas for a refreshed community banner.",posts:[["Jules","I’m collecting ideas for the next banner."],["Aevryn","A minimal space-inspired direction could work well."]]},
    {id:"t-205",title:"Last month's reading recommendations",channel:"study-room",server:"Study Room",author:"Mika",initial:"M",tag:"Learning",time:"Oct 28",replies:11,views:64,followed:false,archived:true,last:"Kai: Added the final book to the list.",body:"A completed collection of books and articles recommended by the group.",posts:[["Mika","Add your final recommendations here."],["Kai","Added the final book to the list."]]}
  ];
  let tab="threads", filter="all", query="", selected=null, modalMode="";
  function styles(){
    if($("#ot-style"))return;
    const style=document.createElement("style");style.id="ot-style";
    style.textContent=`
      .ot-launch{position:fixed;z-index:60;right:22px;bottom:24px;padding:10px 14px;border:1px solid #68719b;border-radius:999px;background:#343b60;color:#f4f5ff;font-size:11px;font-weight:750;box-shadow:0 8px 28px #0005}
      .ot-launch:hover{background:#414a77}
      .ot-view{position:absolute;z-index:45;inset:0;overflow:auto;padding:30px clamp(16px,4vw,48px) 42px;background:#17191f;color:#e9ebf2}
      .ot-view[hidden]{display:none!important}
      .ot-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:25px}
      .ot-top small,.ot-eyebrow{color:#969fb3;font-size:9px;font-weight:800;letter-spacing:1.5px}
      .ot-top h1{margin:7px 0;font-size:clamp(22px,3vw,30px);letter-spacing:-.7px}
      .ot-top p{margin:0;color:#a4a9b6;font-size:12px;line-height:1.6}
      .ot-close{width:36px;height:36px;border:1px solid #414652;border-radius:9px;background:#242831;color:#dce0e9;font-size:20px}
      .ot-tabs{display:flex;gap:6px;overflow:auto;border-bottom:1px solid #343944;margin-bottom:20px}
      .ot-tab{padding:11px 14px;border:0;border-bottom:2px solid transparent;background:transparent;color:#aeb4c2;font-size:11px;font-weight:700;white-space:nowrap}
      .ot-tab.active{border-bottom-color:#8c9bf0;color:#fff}
      .ot-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
      .ot-search{width:min(340px,100%);height:39px;padding:0 12px;border:1px solid #3d4350;border-radius:8px;background:#22262e;color:#e9ebf2;font:inherit;font-size:11px}
      .ot-create{padding:10px 14px;border:0;border-radius:8px;background:#6878c8;color:#fff;font-size:11px;font-weight:750;white-space:nowrap}
      .ot-layout{display:grid;grid-template-columns:minmax(0,1fr) 270px;gap:18px;align-items:start}
      .ot-list{display:grid;gap:10px}
      .ot-card{padding:16px;border:1px solid #363c48;border-radius:11px;background:#20242c}
      .ot-card:hover{border-color:#59658c}
      .ot-card-head{display:flex;align-items:center;gap:9px}
      .ot-avatar{width:31px;height:31px;display:grid;place-items:center;flex:0 0 31px;border-radius:50%;background:#485078;color:#fff;font-size:11px;font-weight:800}
      .ot-author{font-size:10px;font-weight:750}.ot-muted{color:#929aaa;font-size:9px}
      .ot-card h3{margin:12px 0 6px;font-size:14px;line-height:1.4}
      .ot-card p{margin:0;color:#b0b6c3;font-size:10px;line-height:1.6}
      .ot-card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding-top:11px;border-top:1px solid #353b46}
      .ot-card-stats{display:flex;gap:13px;color:#9da5b5;font-size:9px}
      .ot-card-actions{display:flex;align-items:center;gap:8px}
      .ot-small-btn{padding:6px 9px;border:1px solid #454c5b;border-radius:6px;background:#292e39;color:#cbd1de;font-size:9px}
      .ot-small-btn.following{border-color:#6574bd;color:#cbd3ff}
      .ot-tag{padding:4px 7px;border-radius:5px;background:#353d55;color:#c5ceff;font-size:8px;font-weight:750}
      .ot-aside{padding:17px;border:1px solid #363c48;border-radius:11px;background:#20242c}
      .ot-aside h3{margin:0 0 12px;font-size:12px}
      .ot-aside p{color:#a9b0bd;font-size:10px;line-height:1.65}
      .ot-stat{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #353b46;color:#aeb5c3;font-size:10px}
      .ot-stat b{color:#f1f2f6}
      .ot-empty{padding:44px 15px;text-align:center;border:1px dashed #414856;border-radius:10px;color:#aeb5c3}
      .ot-empty b{display:block;margin-bottom:6px;color:#e9ebf2;font-size:13px}
      .ot-empty p{font-size:10px}
      .ot-modal{position:fixed;z-index:190;inset:0;display:grid;place-items:center;padding:16px;background:#08090dcc;backdrop-filter:blur(5px)}
      .ot-modal[hidden]{display:none!important}
      .ot-dialog{width:min(520px,100%);max-height:90vh;overflow:auto;padding:20px;border:1px solid #4a5060;border-radius:13px;background:#252a34;color:#e9ebf2;box-shadow:0 25px 80px #0009}
      .ot-dialog h2{margin:0 0 5px;font-size:18px}
      .ot-dialog>p{margin:0 0 17px;color:#aab1bf;font-size:10px;line-height:1.5}
      .ot-field{display:grid;gap:6px;margin:13px 0;color:#cbd0dc;font-size:10px;font-weight:700}
      .ot-field input,.ot-field textarea,.ot-field select{width:100%;padding:10px;border:1px solid #444b5a;border-radius:7px;background:#1c2028;color:#f1f2f6;font:inherit;font-size:11px}
      .ot-field textarea{min-height:90px;resize:vertical}
      .ot-dialog-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
      .ot-primary{padding:9px 13px;border:0;border-radius:7px;background:#6878c8;color:white;font-size:10px;font-weight:750}
      .ot-secondary{padding:9px 13px;border:1px solid #4b5260;border-radius:7px;background:#2c313c;color:#d8dce5;font-size:10px}
      .ot-detail-post{padding:12px 0;border-bottom:1px solid #3b414d}
      .ot-detail-post b{font-size:10px}.ot-detail-post p{margin:5px 0 0;color:#bdc3ce;font-size:10px;line-height:1.6}
      .ot-reply-form{display:flex;gap:8px;margin-top:14px}.ot-reply-form input{min-width:0;flex:1;padding:10px;border:1px solid #454c5b;border-radius:7px;background:#1d2129;color:white;font-size:10px}
      @media(max-width:800px){.ot-layout{grid-template-columns:1fr}.ot-aside{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ot-aside h3{grid-column:1/-1}.ot-aside p{margin:0}.ot-view{padding-top:22px}}
      @media(max-width:560px){.ot-launch{right:12px;bottom:82px}.ot-toolbar{align-items:stretch;flex-direction:column}.ot-search{width:100%}.ot-create{align-self:flex-end}.ot-card{padding:13px}.ot-card-foot{align-items:flex-start;flex-direction:column}.ot-card-actions{width:100%;justify-content:flex-end}.ot-aside{display:block}.ot-aside p{margin:8px 0}.ot-top h1{font-size:23px}}
    `;
    document.head.appendChild(style);
  }
  function ensure(){
    if($("#orbit-threads-view"))return;
    styles();
    const launch=document.createElement("button");launch.className="ot-launch";launch.type="button";launch.textContent="☷ Threads & Forums";launch.addEventListener("click",open);document.body.appendChild(launch);
    const view=document.createElement("section");view.id="orbit-threads-view";view.className="ot-view";view.hidden=true;
    view.innerHTML='<header class="ot-top"><div><small>COMMUNITY CONVERSATIONS</small><h1>Threads & Forums</h1><p>Follow focused discussions, share ideas, and keep channel conversations organized.</p></div><button class="ot-close" data-ot="close" aria-label="Close threads">×</button></header><nav class="ot-tabs" aria-label="Discussion views"><button class="ot-tab active" data-ot-tab="threads">Active threads</button><button class="ot-tab" data-ot-tab="forum">Forum posts</button><button class="ot-tab" data-ot-tab="following">Following</button><button class="ot-tab" data-ot-tab="archived">Archived</button></nav><div class="ot-toolbar"><input id="ot-search" class="ot-search" type="search" placeholder="Search discussions..." aria-label="Search discussions"><button class="ot-create" data-ot="create">＋ Create discussion</button></div><div class="ot-layout"><main><div class="ot-list" id="ot-list"></div></main><aside class="ot-aside"><h3>Discussion overview</h3><div class="ot-stat"><span>Active discussions</span><b id="ot-active-count">4</b></div><div class="ot-stat"><span>Following</span><b id="ot-follow-count">2</b></div><div class="ot-stat"><span>Archived</span><b id="ot-archived-count">1</b></div><p>Threads keep replies grouped around one topic. Forum posts are useful for longer-running questions, guides, and community ideas.</p></aside></div>';
    $(".main-panel").appendChild(view);
    const modal=document.createElement("div");modal.id="ot-modal";modal.className="ot-modal";modal.hidden=true;
    modal.innerHTML='<section class="ot-dialog" role="dialog" aria-modal="true" aria-labelledby="ot-modal-title"><h2 id="ot-modal-title">Create discussion</h2><p>Start a focused conversation in a channel.</p><form id="ot-create-form"><label class="ot-field">Discussion title<input name="title" maxlength="100" required placeholder="What would you like to discuss?"></label><label class="ot-field">Channel<select name="channel"><option value="general"># general</option><option value="observations"># observations</option><option value="study-room"># study-room</option><option value="showcase"># showcase</option></select></label><label class="ot-field">Category<select name="tag"><option>Community</option><option>Astronomy</option><option>Learning</option><option>Design</option><option>Question</option></select></label><label class="ot-field">First message<textarea name="body" maxlength="1200" required placeholder="Add context to help people join the discussion..."></textarea></label><div class="ot-dialog-foot"><button class="ot-secondary" type="button" data-ot="cancel">Cancel</button><button class="ot-primary" type="submit">Create discussion</button></div></form></section>';
    document.body.appendChild(modal);
    view.addEventListener("click",onViewClick);modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest('[data-ot="cancel"]'))closeModal();});
    $("#ot-create-form").addEventListener("submit",createDiscussion);
    $("#ot-search").addEventListener("input",e=>{query=e.target.value.toLowerCase();render();});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(!$("#ot-modal").hidden)closeModal();else if(!$("#orbit-threads-view").hidden)close();}});
    render();
  }
  function visibleThreads(){
    return threads.filter(t=>{
      if(tab==="archived"&&!t.archived)return false;
      if(tab!=="archived"&&t.archived)return false;
      if(tab==="following"&&!t.followed)return false;
      if(tab==="forum"&&t.tag==="Community")return false;
      if(query&&!([t.title,t.channel,t.server,t.author,t.tag,t.body].join(" ").toLowerCase().includes(query)))return false;
      return true;
    });
  }
  function card(t){
    return '<article class="ot-card"><div class="ot-card-head"><span class="ot-avatar">'+esc(t.initial)+'</span><div><div class="ot-author">'+esc(t.author)+' <span class="ot-muted">· '+esc(t.time)+'</span></div><div class="ot-muted">in #'+esc(t.channel)+' · '+esc(t.server)+'</div></div><span class="ot-tag">'+esc(t.tag)+'</span></div><h3>'+esc(t.title)+'</h3><p>'+esc(t.body)+'</p><div class="ot-card-foot"><div class="ot-card-stats"><span>↩ '+t.replies+' replies</span><span>◉ '+t.views+' views</span><span>'+esc(t.last)+'</span></div><div class="ot-card-actions"><button class="ot-small-btn '+(t.followed?'following':'')+'" data-ot-follow="'+esc(t.id)+'">'+(t.followed?'Following':'Follow')+'</button><button class="ot-small-btn" data-ot-open="'+esc(t.id)+'">Open discussion →</button></div></div></article>';
  }
  function render(){
    const list=$("#ot-list");if(!list)return;
    const rows=visibleThreads();list.innerHTML=rows.length?rows.map(card).join(""):'<div class="ot-empty"><b>No discussions found</b><p>Try another search or create a new discussion.</p></div>';
    $("#ot-active-count").textContent=threads.filter(t=>!t.archived).length;$("#ot-follow-count").textContent=threads.filter(t=>t.followed&&!t.archived).length;$("#ot-archived-count").textContent=threads.filter(t=>t.archived).length;
    $("#orbit-threads-view").querySelectorAll("[data-ot-tab]").forEach(b=>b.classList.toggle("active",b.dataset.otTab===tab));
  }
  function open(){ensure();$("#orbit-threads-view").hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;render();}
  function close(){const v=$("#orbit-threads-view");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
  function closeModal(){$("#ot-modal").hidden=true;}
  function createDiscussion(e){
    e.preventDefault();const data=new FormData(e.currentTarget);const title=String(data.get("title")||"").trim(),body=String(data.get("body")||"").trim();if(!title||!body)return;
    const channel=String(data.get("channel")),tag=String(data.get("tag"));
    threads.unshift({id:"t-"+Date.now(),title,channel,server:channel==="study-room"?"Study Room":channel==="showcase"?"Pixel Lab":"Stargazers",author:"Aevryn",initial:"A",tag,time:"Just now",replies:0,views:1,followed:true,archived:false,last:"Be the first to reply.",body,posts:[["Aevryn",body]]});
    tab="threads";query="";$("#ot-search").value="";e.currentTarget.reset();closeModal();render();toast("Discussion created in this local preview.");
  }
  function onViewClick(e){
    const tabButton=e.target.closest("[data-ot-tab]");if(tabButton){tab=tabButton.dataset.otTab;render();return;}
    const action=e.target.closest("[data-ot]")?.dataset.ot;if(action==="close"){close();return;}if(action==="create"){$("#ot-modal").hidden=false;$("#ot-create-form input").focus();return;}
    const follow=e.target.closest("[data-ot-follow]");if(follow){const item=threads.find(t=>t.id===follow.dataset.otFollow);if(item)item.followed=!item.followed;render();return;}
    const openButton=e.target.closest("[data-ot-open]");if(openButton){selected=threads.find(t=>t.id===openButton.dataset.otOpen);if(selected)showDetail(selected);}
  }
  function showDetail(item){
    const modal=$("#ot-modal");modal.innerHTML='<section class="ot-dialog" role="dialog" aria-modal="true" aria-labelledby="ot-modal-title"><span class="ot-eyebrow">#'+esc(item.channel)+' · '+esc(item.server)+'</span><h2 id="ot-modal-title">'+esc(item.title)+'</h2><p>'+esc(item.body)+'</p><div id="ot-posts">'+item.posts.map(p=>'<article class="ot-detail-post"><b>'+esc(p[0])+'</b><p>'+esc(p[1])+'</p></article>').join("")+'</div><form class="ot-reply-form" id="ot-reply-form"><input name="reply" maxlength="800" required placeholder="Write a reply..."><button class="ot-primary" type="submit">Reply</button></form><div class="ot-dialog-foot"><button class="ot-secondary" data-ot="archive" type="button">'+(item.archived?"Restore thread":"Archive thread")+'</button><button class="ot-secondary" data-ot="cancel" type="button">Close</button></div></section>';
    modal.hidden=false;$("#ot-reply-form").addEventListener("submit",e=>{e.preventDefault();const input=e.currentTarget.elements.reply;const value=input.value.trim();if(!value)return;item.posts.push(["Aevryn",value]);item.replies++;item.last="Aevryn: "+value;showDetail(item);render();});
    modal.querySelector('[data-ot="archive"]').addEventListener("click",()=>{item.archived=!item.archived;closeModal();render();toast(item.archived?"Thread archived in preview.":"Thread restored in preview.");});
  }
  function toast(message){let t=$("#orbit-toast");if(!t){t=document.createElement("div");t.id="orbit-toast";t.className="orbit-toast";t.setAttribute("role","status");document.body.appendChild(t);}t.textContent=message;t.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("visible"),2300);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensure,{once:true});else ensure();
})();
