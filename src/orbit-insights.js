// Orbit Screen 21 — Server Insights & Analytics. Sample data only; no backend queries.
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ranges = {
    "7d": {label:"Last 7 days",members:["+18","+22","+15","+31","+24","+29","+36"],messages:[420,510,465,620,580,710,840],online:[42,48,45,54,51,62,68],total:1834},
    "30d": {label:"Last 30 days",members:["+42","+51","+48","+63","+57","+71","+86"],messages:[320,410,390,520,480,610,760],online:[35,39,43,46,49,55,61],total:14920},
    "90d": {label:"Last 90 days",members:["+86","+94","+102","+111","+126","+139","+158"],messages:[210,280,340,390,460,570,690],online:[24,31,35,42,47,53,59],total:42860}
  };
  const channels = [
    {name:"general",messages:4820,share:34,trend:"+12.4%",tone:"indigo"},
    {name:"media-share",messages:3260,share:23,trend:"+8.1%",tone:"blue"},
    {name:"introductions",messages:2180,share:15,trend:"+18.6%",tone:"violet"},
    {name:"observations",messages:1940,share:14,trend:"+5.2%",tone:"green"},
    {name:"updates",messages:1120,share:8,trend:"+2.3%",tone:"amber"}
  ];
  const members = [
    {name:"Mika",role:"Moderator",joined:"Nov 08",activity:"Very active",messages:428,initial:"M",tone:"pink"},
    {name:"Kai",role:"Member",joined:"Nov 06",activity:"Active",messages:316,initial:"K",tone:"blue"},
    {name:"Nova",role:"Creator",joined:"Nov 04",activity:"Active",messages:284,initial:"N",tone:"violet"},
    {name:"Jules",role:"Member",joined:"Nov 02",activity:"Occasional",messages:142,initial:"J",tone:"green"},
    {name:"PixelPilot",role:"Member",joined:"Oct 29",activity:"Occasional",messages:96,initial:"P",tone:"amber"}
  ];
  let range="30d", tab="overview", query="";
  let view, observer;
  function injectMenuAction(){
    const actions=$(".server-menu-actions");
    if(!actions || $("[data-oi-open]",actions)) return;
    const button=document.createElement("button");
    button.type="button";button.className="server-menu-action";button.dataset.oiOpen="true";
    button.innerHTML='<span class="menu-action-icon">▥</span><span><b>Server Insights</b><small>View growth and community activity</small></span><span class="menu-chevron">›</span>';
    actions.appendChild(button);
  }
  function ensure(){
    if(view)return;
    view=document.createElement("section");view.id="orbit-insights-view";view.className="oi-view";view.hidden=true;
    view.innerHTML='<header class="oi-header"><div><small>COMMUNITY ANALYTICS</small><h1>Server Insights</h1><p>Understand how your community is growing and where conversations happen.</p></div><div class="oi-header-actions"><span class="oi-preview">SAMPLE DATA</span><button data-oi="close" aria-label="Close insights">×</button></div></header><div class="oi-toolbar"><nav class="oi-tabs" aria-label="Insights sections"><button data-oi-tab="overview">Overview</button><button data-oi-tab="members">Members</button><button data-oi-tab="channels">Channels</button><button data-oi-tab="activity">Activity</button></nav><label class="oi-range">Period <select id="oi-range"><option value="7d">Last 7 days</option><option value="30d" selected>Last 30 days</option><option value="90d">Last 90 days</option></select></label></div><div id="oi-panel" class="oi-panel"></div><footer class="oi-footer">Preview analytics use illustrative sample values. Live server analytics will require connected event and membership data.</footer>';
    $(".main-panel")?.appendChild(view);
    view.addEventListener("click",onClick);
    view.addEventListener("change",e=>{if(e.target.id==="oi-range"){range=e.target.value;render();}});
    view.addEventListener("input",e=>{if(e.target.id==="oi-member-search"){query=e.target.value.toLowerCase();const pos=e.target.selectionStart;render();const input=$("#oi-member-search");if(input){input.focus();input.setSelectionRange(pos,pos);}}});
    render();
  }
  function bars(values){const max=Math.max(...values);return '<div class="oi-bars">'+values.map((v,i)=>'<div class="oi-bar-col"><span>'+v+'</span><i style="height:'+Math.max(8,Math.round(v/max*100))+'%"></i><small>'+["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]+'</small></div>').join("")+'</div>';}
  function stat(label,value,change,note){return '<article class="oi-stat"><small>'+label+'</small><b>'+value+'</b><span class="oi-positive">'+change+'</span><p>'+note+'</p></article>';}
  function overview(){
    const d=ranges[range];
    return '<div class="oi-stat-grid">'+stat("TOTAL MEMBERS","1,284","+6.8%","Compared with previous period")+stat("NEW MEMBERS",range==="7d"?"36":range==="30d"?"186":"716","+12.2%","Joined during selected period")+stat("MESSAGES SENT",d.total.toLocaleString(),"↑ 9.4%","Across all text channels")+stat("AVG. ONLINE","58","↑ 4.1%","Typical concurrent presence")+'</div><div class="oi-chart-grid"><section class="oi-card oi-chart-card"><div class="oi-card-head"><div><small>COMMUNITY GROWTH</small><h2>New members</h2></div><span>+6.8%</span></div>'+bars(d.members.map(x=>Number(x.replace("+",""))))+'<p class="oi-chart-note">Illustrative member joins · '+d.label.toLowerCase()+'</p></section><section class="oi-card oi-chart-card"><div class="oi-card-head"><div><small>CONVERSATION VOLUME</small><h2>Messages per day</h2></div><span>↑ 9.4%</span></div>'+bars(d.messages)+'<p class="oi-chart-note">Messages across community channels</p></section></div><div class="oi-lower-grid"><section class="oi-card"><div class="oi-card-head"><div><small>TOP CHANNELS</small><h2>Where conversations happen</h2></div><button data-oi-tab="channels">View all →</button></div>'+channelRows(3)+'</section><section class="oi-card oi-health"><small>COMMUNITY HEALTH</small><h2>Engagement snapshot</h2><div class="oi-health-score"><b>Good</b><span>●</span></div><p>Sample summary based on the preview activity shown here.</p><div class="oi-health-row"><span>Active member rate</span><b>68%</b></div><div class="oi-health-row"><span>Returning members</span><b>74%</b></div><div class="oi-health-row"><span>Moderation queue</span><b>3 open</b></div><button data-oi-tab="activity">Review activity →</button></section></div>';
  }
  function channelRows(limit=99){
    return channels.slice(0,limit).map(c=>'<div class="oi-channel-row"><span class="oi-hash">#</span><div class="oi-channel-main"><b>'+esc(c.name)+'</b><div class="oi-track"><i class="oi-'+c.tone+'" style="width:'+c.share+'%"></i></div></div><strong>'+c.messages.toLocaleString()+'</strong><small>'+c.trend+'</small></div>').join("");
  }
  function membersPanel(){
    const rows=members.filter(m=>(m.name+" "+m.role+" "+m.activity).toLowerCase().includes(query));
    return '<div class="oi-page-head"><div><small>MEMBER OVERVIEW</small><h2>Member activity</h2><p>Sample member activity for the selected reporting period.</p></div><span>'+rows.length+' shown</span></div><label class="oi-search">⌕ <input id="oi-member-search" value="'+esc(query)+'" placeholder="Search members or roles"></label><div class="oi-member-table"><div class="oi-table-head"><span>MEMBER</span><span>ROLE</span><span>JOINED</span><span>ACTIVITY</span><span>MESSAGES</span></div>'+rows.map(m=>'<div class="oi-member-row"><span class="oi-member-name"><i class="oi-avatar oi-'+m.tone+'">'+m.initial+'</i><b>'+esc(m.name)+'</b></span><span>'+esc(m.role)+'</span><span>'+m.joined+'</span><span><i class="oi-activity-dot"></i>'+m.activity+'</span><b>'+m.messages+'</b></div>').join("")+'</div>';
  }
  function channelsPanel(){
    return '<div class="oi-page-head"><div><small>CHANNEL PERFORMANCE</small><h2>Channel activity</h2><p>Compare message volume across the community.</p></div><span>'+channels.length+' channels</span></div><section class="oi-card oi-channel-card"><div class="oi-card-head"><div><small>MESSAGE DISTRIBUTION</small><h2>Most active channels</h2></div><span>Sample totals</span></div>'+channelRows()+'</section><section class="oi-card oi-insight-note"><b>What this means</b><p>Channel activity helps identify where members naturally gather. Consider improving channel descriptions or surfacing quieter spaces when useful.</p></section>';
  }
  function activityPanel(){
    const d=ranges[range];
    return '<div class="oi-page-head"><div><small>COMMUNITY ACTIVITY</small><h2>Activity trends</h2><p>Review message volume and typical online presence.</p></div><span>'+d.label+'</span></div><div class="oi-chart-grid"><section class="oi-card oi-chart-card"><div class="oi-card-head"><div><small>MESSAGES</small><h2>Daily messages</h2></div><span>'+d.total.toLocaleString()+'</span></div>'+bars(d.messages)+'</section><section class="oi-card oi-chart-card"><div class="oi-card-head"><div><small>PRESENCE</small><h2>Average online</h2></div><span>58 members</span></div>'+bars(d.online)+'</section></div><section class="oi-card oi-activity-list"><div class="oi-card-head"><div><small>RECENT EVENTS</small><h2>Community timeline</h2></div><span>Sample</span></div><div class="oi-event"><i></i><div><b>36 new members joined</b><small>During the selected period</small></div></div><div class="oi-event"><i></i><div><b>General was the most active channel</b><small>4,820 sample messages</small></div></div><div class="oi-event"><i></i><div><b>Community guidelines updated</b><small>Example administrative event</small></div></div><div class="oi-event"><i></i><div><b>3 reports awaiting review</b><small>See the Moderation Center for details</small></div></div></section>';
  }
  function render(){
    if(!view)return;
    const panel=$("#oi-panel");if(!panel)return;
    panel.innerHTML=tab==="members"?membersPanel():tab==="channels"?channelsPanel():tab==="activity"?activityPanel():overview();
    view.querySelectorAll("[data-oi-tab]").forEach(b=>b.classList.toggle("active",b.dataset.oiTab===tab));
    const rangeInput=$("#oi-range");if(rangeInput)rangeInput.value=range;
  }
  function open(){
    ensure();tab="overview";query="";
    $(".main-header")?.setAttribute("hidden","");
    $(".chat-layout")?.setAttribute("hidden","");
    $("#orbit-onboarding-view")?.setAttribute("hidden","");
    $("#orbit-moderation-view")?.setAttribute("hidden","");
    $("#orbit-insights-view").hidden=false;
    render();
  }
  function close(){
    if(!view)return;view.hidden=true;
    $(".main-header")?.removeAttribute("hidden");
    $(".chat-layout")?.removeAttribute("hidden");
  }
  function onClick(e){
    const tabButton=e.target.closest("[data-oi-tab]");
    if(tabButton){tab=tabButton.dataset.oiTab;query="";render();return;}
    if(e.target.closest('[data-oi="close"]'))close();
  }
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-oi-open]")){e.preventDefault();document.querySelector("#server-menu-layer")?.classList.remove("is-open");const layer=$("#server-menu-layer");if(layer){layer.hidden=true;document.body.classList.remove("server-menu-open");}open();}
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&view&&!view.hidden)close();
  });
  observer=new MutationObserver(injectMenuAction);
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  injectMenuAction();
})();
