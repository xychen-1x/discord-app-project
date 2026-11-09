// Orbit Screen 22 — Forum Channels & Discussions. Local preview data only.
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const STORE = "orbit.forum.v1";
  const seed = [
    {id:"p1",title:"What space mission are you most excited about?",body:"There are so many upcoming missions to follow. Which one are you watching most closely, and why?",category:"Astronomy",tags:["Discussion","Space"],author:"Mika",initial:"M",tone:"pink",created:Date.now()-1000*60*42,replies:[{author:"Kai",initial:"K",body:"I'm following the next lunar missions. The science goals are fascinating.",created:Date.now()-1000*60*28},{author:"Nova",initial:"N",body:"I'm interested in the next big observatory discoveries.",created:Date.now()-1000*60*15}],votes:18,solved:false,pinned:true},
    {id:"p2",title:"Share your best beginner astrophotography tips",body:"I'm learning how to capture the night sky. What settings or techniques helped you get started?",category:"Photography",tags:["Help","Beginner"],author:"Kai",initial:"K",tone:"blue",created:Date.now()-1000*60*60*5,replies:[{author:"Mika",initial:"M",body:"Start with a stable tripod and learn the basics of exposure first.",created:Date.now()-1000*60*60*3}],votes:12,solved:false,pinned:false},
    {id:"p3",title:"Weekly science links and discoveries",body:"Post interesting articles, research updates, and discoveries from this week. Add a short summary so others know what caught your attention.",category:"Community",tags:["Resources"],author:"Nova",initial:"N",tone:"violet",created:Date.now()-1000*60*60*20,replies:[],votes:7,solved:false,pinned:false},
    {id:"p4",title:"Solved: Where can I find reliable meteor shower calendars?",body:"Looking for a dependable source to track upcoming meteor showers and peak viewing times.",category:"Astronomy",tags:["Question","Solved"],author:"Jules",initial:"J",tone:"green",created:Date.now()-1000*60*60*32,replies:[{author:"Mika",initial:"M",body:"The International Meteor Organization calendar is a useful reference.",created:Date.now()-1000*60*60*30}],votes:22,solved:true,pinned:false}
  ];
  let posts=load(), category="All", tag="All", sort="recent", query="", activeId=null, returnToHome=false, view=null;
  function load(){try{const x=JSON.parse(localStorage.getItem(STORE));return Array.isArray(x)&&x.length?x:seed;}catch{return seed;}}
  function save(){try{localStorage.setItem(STORE,JSON.stringify(posts));}catch{}}
  function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function ago(t){const m=Math.max(1,Math.floor((Date.now()-t)/60000));return m<60?m+"m ago":m<1440?Math.floor(m/60)+"h ago":Math.floor(m/1440)+"d ago";}
  function ensure(){
    if(view)return;
    view=document.createElement("section");view.id="orbit-forum-view";view.className="of-view";view.hidden=true;
    view.innerHTML='<header class="of-header"><div class="of-heading"><small>COMMUNITY DISCUSSIONS</small><h1>Forum</h1><p>Start a topic, share knowledge, and keep useful discussions organized.</p></div><div class="of-head-actions"><span class="of-local-label">LOCAL PREVIEW</span><button data-of="close" aria-label="Back to server home">×</button></div></header><div class="of-toolbar"><div class="of-search">⌕ <input id="of-search" placeholder="Search discussions"></div><button class="of-create" data-of="create">＋ New post</button></div><div class="of-filters"><nav class="of-categories" aria-label="Forum categories"><button data-of-category="All">All posts</button><button data-of-category="Astronomy">Astronomy</button><button data-of-category="Photography">Photography</button><button data-of-category="Community">Community</button></nav><div class="of-filter-controls"><select id="of-tag"><option>All</option><option>Discussion</option><option>Question</option><option>Help</option><option>Resources</option><option>Beginner</option></select><select id="of-sort"><option value="recent">Newest</option><option value="popular">Most votes</option><option value="unanswered">Unanswered</option></select></div></div><div id="of-content" class="of-content"></div><footer class="of-footer">Posts and replies are saved only in this browser on this device. They are not published to a live server.</footer>';
    $(".main-panel")?.appendChild(view);
    view.addEventListener("click",onClick);
    view.addEventListener("input",e=>{if(e.target.id==="of-search"){query=e.target.value;render();const i=$("#of-search");i?.focus();i?.setSelectionRange(query.length,query.length);}});
    view.addEventListener("change",e=>{if(e.target.id==="of-tag"){tag=e.target.value;render();}if(e.target.id==="of-sort"){sort=e.target.value;render();}});
  }
  function postCard(p){
    return '<article class="of-post-card"><div class="of-vote"><button data-of-vote="'+p.id+'" aria-label="Upvote post">▲</button><b>'+p.votes+'</b></div><button class="of-post-main" data-of-open="'+p.id+'"><div class="of-post-meta"><span class="of-category-pill">'+esc(p.category)+'</span>'+(p.pinned?'<span class="of-pinned">PINNED</span>':'')+(p.solved?'<span class="of-solved">✓ SOLVED</span>':'')+'<span>'+ago(p.created)+'</span></div><h2>'+esc(p.title)+'</h2><p>'+esc(p.body)+'</p><div class="of-post-tags">'+p.tags.map(t=>'<span># '+esc(t)+'</span>').join("")+'</div><div class="of-post-foot"><span class="of-author"><i class="of-avatar of-'+p.tone+'">'+esc(p.initial)+'</i>'+esc(p.author)+'</span><span>▤ '+p.replies.length+' replies</span><span>Open discussion →</span></div></button><button class="of-bookmark" data-of-bookmark="'+p.id+'" aria-label="Bookmark '+esc(p.title)+'">☆</button></article>';
  }
  function list(){
    let rows=posts.filter(p=>(category==="All"||p.category===category)&&(tag==="All"||p.tags.includes(tag))&&(p.title+" "+p.body+" "+p.tags.join(" ")+" "+p.author).toLowerCase().includes(query.toLowerCase()));
    if(sort==="popular")rows.sort((a,b)=>b.votes-a.votes);else if(sort==="unanswered")rows=rows.filter(p=>p.replies.length===0).sort((a,b)=>b.created-a.created);else rows.sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||b.created-a.created);
    return '<div class="of-list-heading"><div><small>TOPICS</small><h2>'+category+' discussions</h2></div><span>'+rows.length+' posts</span></div>'+(rows.length?rows.map(postCard).join(""):'<div class="of-empty"><b>No discussions found</b><p>Try another filter or start a new topic.</p><button class="of-create" data-of="create">＋ Create a post</button></div>');
  }
  function detail(p){
    return '<button class="of-back" data-of="back">← All discussions</button><article class="of-detail"><div class="of-post-meta"><span class="of-category-pill">'+esc(p.category)+'</span>'+(p.solved?'<span class="of-solved">✓ SOLVED</span>':'')+'<span>'+ago(p.created)+'</span></div><h2>'+esc(p.title)+'</h2><div class="of-detail-author"><i class="of-avatar of-'+p.tone+'">'+esc(p.initial)+'</i><b>'+esc(p.author)+'</b><span>· '+ago(p.created)+'</span></div><p class="of-detail-body">'+esc(p.body)+'</p><div class="of-post-tags">'+p.tags.map(t=>'<span># '+esc(t)+'</span>').join("")+'</div><div class="of-detail-actions"><button data-of-vote="'+p.id+'">▲ Helpful · '+p.votes+'</button><button data-of-bookmark="'+p.id+'">☆ Save</button>'+(p.author==="You"?'<button data-of-solved="'+p.id+'">'+(p.solved?"Reopen topic":"Mark as solved")+'</button>':'')+'</div></article><section class="of-replies"><div class="of-replies-head"><h3>Replies</h3><span>'+p.replies.length+'</span></div>'+(p.replies.map(r=>'<article class="of-reply"><i class="of-avatar of-blue">'+esc(r.initial)+'</i><div><b>'+esc(r.author)+'</b><small>'+ago(r.created)+'</small><p>'+esc(r.body)+'</p></div></article>').join("")||'<p class="of-no-replies">No replies yet. Start the conversation.</p>')+'<form id="of-reply-form" class="of-reply-form"><label for="of-reply">Add a reply</label><textarea id="of-reply" maxlength="1200" required placeholder="Share a helpful response..."></textarea><div><small>Keep it respectful and on topic.</small><button class="of-create" type="submit">Send reply</button></div></form></section>';
  }
  function render(){
    if(!view)return;const c=$("#of-content");if(!c)return;
    const p=posts.find(x=>x.id===activeId);c.innerHTML=p?detail(p):list();
    view.querySelectorAll("[data-of-category]").forEach(b=>b.classList.toggle("active",b.dataset.ofCategory===category));
    const s=$("#of-search");if(s&&s.value!==query)s.value=query;
    const t=$("#of-tag");if(t)t.value=tag;const o=$("#of-sort");if(o)o.value=sort;
  }
  function open(){
    ensure();returnToHome=!!($("#orbit-server-home")&&!$("#orbit-server-home").hidden);
    if(returnToHome)$("#orbit-server-home").hidden=true;
    $("#orbit-insights-view")?.setAttribute("hidden","");
    $("#orbit-onboarding-view")?.setAttribute("hidden","");
    $("#orbit-moderation-view")?.setAttribute("hidden","");
    $(".main-header")?.setAttribute("hidden","");
    $(".chat-layout")?.setAttribute("hidden","");
    view.hidden=false;activeId=null;render();
  }
  function close(){
    if(!view)return;view.hidden=true;
    if(returnToHome){$("#orbit-server-home")?.removeAttribute("hidden");}
    else{$(".main-header")?.removeAttribute("hidden");$(".chat-layout")?.removeAttribute("hidden");}
  }
  function onClick(e){
    const b=e.target.closest("[data-of]");if(b){const a=b.dataset.of;if(a==="close")close();if(a==="create")showCreate();if(a==="back"){activeId=null;render();}return;}
    const cat=e.target.closest("[data-of-category]");if(cat){category=cat.dataset.ofCategory;activeId=null;render();return;}
    const op=e.target.closest("[data-of-open]");if(op){activeId=op.dataset.ofOpen;render();return;}
    const vote=e.target.closest("[data-of-vote]");if(vote){const p=posts.find(x=>x.id===vote.dataset.ofVote);if(p){p.votes++;save();render();}return;}
    const mark=e.target.closest("[data-of-bookmark]");if(mark){mark.classList.toggle("saved");mark.textContent=mark.classList.contains("saved")?"★":"☆";return;}
    const solved=e.target.closest("[data-of-solved]");if(solved){const p=posts.find(x=>x.id===solved.dataset.ofSolved);if(p){p.solved=!p.solved;save();render();}return;}
  }
  function showCreate(){
    const layer=document.createElement("div");layer.className="of-modal-layer";layer.innerHTML='<button class="of-modal-backdrop" data-of-modal-close aria-label="Close"></button><form class="of-modal" id="of-create-form"><header><div><small>NEW DISCUSSION</small><h2>Create a post</h2></div><button type="button" data-of-modal-close>×</button></header><label>POST TITLE<input name="title" maxlength="120" required placeholder="What would you like to discuss?"></label><label>DETAILS<textarea name="body" maxlength="3000" required placeholder="Add context, questions, or useful details..."></textarea></label><div class="of-modal-grid"><label>CATEGORY<select name="category"><option>Astronomy</option><option>Photography</option><option>Community</option></select></label><label>TAG<select name="tag"><option>Discussion</option><option>Question</option><option>Help</option><option>Resources</option><option>Beginner</option></select></label></div><footer><button type="button" data-of-modal-close>Cancel</button><button class="of-create" type="submit">Publish post</button></footer></form></div>';
    document.body.appendChild(layer);layer.addEventListener("click",e=>{if(e.target.closest("[data-of-modal-close]"))layer.remove();});
    $("#of-create-form",layer).addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);const title=String(f.get("title")).trim(),body=String(f.get("body")).trim();if(!title||!body)return;posts.unshift({id:"p"+Date.now(),title,body,category:String(f.get("category")),tags:[String(f.get("tag"))],author:"You",initial:"Y",tone:"violet",created:Date.now(),replies:[],votes:0,solved:false,pinned:false});save();category="All";tag="All";sort="recent";query="";activeId=null;layer.remove();render();});
  }
  function onReply(e){
    if(e.target.id!=="of-reply-form")return;e.preventDefault();const p=posts.find(x=>x.id===activeId);const body=$("#of-reply")?.value.trim();if(!p||!body)return;p.replies.push({author:"You",initial:"Y",body,created:Date.now()});save();render();
  }
  document.addEventListener("orbit:open-forum",open);
  document.addEventListener("submit",onReply);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&view&&!view.hidden)close();});
})();
