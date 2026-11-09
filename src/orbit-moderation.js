// Orbit Screen 10 — Moderation & Safety Center (frontend mock only).
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const reports = [
    {id:"R-1048",user:"PixelPilot",initial:"P",avatar:"violet",reason:"Repeated spam",channel:"# general",reporter:"Mika",time:"8 min ago",severity:"high",status:"open",detail:"Repeated promotional messages were posted in the general channel after a reminder.",evidence:"Several similar promotional posts in a short period."},
    {id:"R-1047",user:"NightSignal",initial:"N",avatar:"blue",reason:"Harassment",channel:"# off-topic",reporter:"Kai",time:"24 min ago",severity:"high",status:"open",detail:"A member reported repeated targeted insults during a discussion.",evidence:"Reported message excerpts are available in this mock review."},
    {id:"R-1046",user:"ArtNova",initial:"A",avatar:"pink",reason:"Inappropriate language",channel:"# showcase",reporter:"Nova",time:"1 hr ago",severity:"medium",status:"reviewing",detail:"A report was submitted about language used in a public feedback thread.",evidence:"One message was flagged for moderator review."},
    {id:"R-1045",user:"OrbitGuest",initial:"O",avatar:"green",reason:"Suspicious invite links",channel:"# general",reporter:"Jules",time:"Yesterday",severity:"medium",status:"resolved",detail:"A suspicious external invite was shared in chat.",evidence:"The link was removed in this local preview."},
    {id:"R-1044",user:"StarWatcher",initial:"S",avatar:"amber",reason:"Off-topic disruption",channel:"# observations",reporter:"Mika",time:"Yesterday",severity:"low",status:"resolved",detail:"A discussion was repeatedly interrupted with unrelated messages.",evidence:"The report was reviewed and closed."}
  ];
  const members = [
    {name:"PixelPilot",initial:"P",avatar:"violet",role:"Member",status:"Online",joined:"Oct 18, 2026",notes:1},
    {name:"NightSignal",initial:"N",avatar:"blue",role:"Member",status:"Online",joined:"Sep 04, 2026",notes:2},
    {name:"ArtNova",initial:"A",avatar:"pink",role:"Creator",status:"Idle",joined:"Aug 22, 2026",notes:0},
    {name:"OrbitGuest",initial:"O",avatar:"green",role:"Guest",status:"Offline",joined:"Nov 02, 2026",notes:0},
    {name:"StarWatcher",initial:"S",avatar:"amber",role:"Moderator",status:"Online",joined:"Jul 11, 2026",notes:0}
  ];
  const logs = [
    {action:"Resolved report",target:"OrbitGuest",by:"Mika",time:"Yesterday · 4:18 PM",kind:"resolved"},
    {action:"Issued warning",target:"PixelPilot",by:"Kai",time:"Yesterday · 2:05 PM",kind:"warning"},
    {action:"Reviewed report",target:"ArtNova",by:"Mika",time:"Nov 07 · 8:42 PM",kind:"review"}
  ];
  const automod = [
    {id:"spam",title:"Spam detection",desc:"Flag repeated messages and rapid posting.",enabled:true},
    {id:"mentions",title:"Mention spam",desc:"Flag unusually large bursts of member mentions.",enabled:true},
    {id:"invites",title:"Suspicious invite links",desc:"Hold unfamiliar invite links for moderator review.",enabled:true},
    {id:"keywords",title:"Keyword filter",desc:"Review messages that match your community word list.",enabled:false},
    {id:"newaccounts",title:"New account activity",desc:"Flag unusual activity from recently joined accounts.",enabled:false}
  ];
  let activeTab="overview", reportFilter="all", search="", selectedReport=null, modalAction=null;
  function ensure(){
    if($("#orbit-moderation-view")) return;
    const view=document.createElement("section");
    view.id="orbit-moderation-view";view.className="om-view";view.hidden=true;
    view.innerHTML='<header class="om-header"><div><small>COMMUNITY MANAGEMENT</small><h1>Moderation & Safety</h1><p>Review reports, manage member actions, and monitor community health.</p></div><div class="om-header-actions"><span class="om-preview-pill">LOCAL PREVIEW</span><button type="button" data-om="close" aria-label="Close moderation center">×</button></div></header><div class="om-body"><nav class="om-nav" aria-label="Moderation sections"><button data-om-tab="overview">Overview</button><button data-om-tab="reports">Reports <i id="om-report-badge">3</i></button><button data-om-tab="members">Members</button><button data-om-tab="logs">Audit log</button><button data-om-tab="automod">AutoMod</button></nav><div class="om-content"><div id="om-panel"></div></div></div>';
    $(".main-panel").appendChild(view);
    const modal=document.createElement("div");modal.id="om-modal-layer";modal.className="om-modal-layer";modal.hidden=true;
    modal.innerHTML='<button class="om-modal-backdrop" data-om-close aria-label="Close dialog"></button><section class="om-modal" role="dialog" aria-modal="true" aria-labelledby="om-modal-title"><header><div><small>MODERATION ACTION</small><h2 id="om-modal-title">Review member</h2></div><button type="button" data-om-close aria-label="Close">×</button></header><div id="om-modal-content"></div><footer><button type="button" data-om-close>Cancel</button><button type="button" class="om-primary" data-om-confirm>Confirm action</button></footer></section>';
    document.body.appendChild(modal);
    view.addEventListener("click",onViewClick);
    modal.addEventListener("click",onModalClick);
    document.addEventListener("input",e=>{if(e.target.matches("#om-search")){search=e.target.value.toLowerCase();renderPanel();}});
    document.addEventListener("change",e=>{const input=e.target.closest("[data-om-toggle]");if(input){const item=automod.find(x=>x.id===input.dataset.omToggle);if(item)item.enabled=input.checked;}});
  }
  function stats(){return {open:reports.filter(x=>x.status==="open").length,reviewing:reports.filter(x=>x.status==="reviewing").length,resolved:reports.filter(x=>x.status==="resolved").length,high:reports.filter(x=>x.severity==="high"&&x.status!=="resolved").length};}
  function reportCard(r){return '<article class="om-report-card"><div class="om-report-avatar om-'+r.avatar+'">'+esc(r.initial)+'</div><div class="om-report-copy"><div class="om-report-top"><b>'+esc(r.user)+'</b><span class="om-severity om-'+r.severity+'">'+esc(r.severity)+'</span><span class="om-status om-'+r.status+'">'+esc(r.status)+'</span></div><p>'+esc(r.reason)+' <span>· '+esc(r.channel)+'</span></p><small>Reported by '+esc(r.reporter)+' · '+esc(r.time)+' · '+esc(r.id)+'</small></div><button type="button" class="om-view-report" data-om-report="'+r.id+'">Review →</button></article>';}
  function overview(){
    const s=stats(),queue=reports.filter(x=>x.status!=="resolved").slice(0,3);
    return '<div class="om-welcome"><div><small>SERVER HEALTH</small><h2>Moderation overview</h2><p>A clear view of reports and recent safety activity.</p></div><span>◆</span></div><div class="om-stat-grid"><article><small>OPEN REPORTS</small><b>'+s.open+'</b><span>Awaiting review</span></article><article><small>IN REVIEW</small><b>'+s.reviewing+'</b><span>Being handled</span></article><article><small>RESOLVED</small><b>'+s.resolved+'</b><span>Closed reports</span></article><article><small>HIGH PRIORITY</small><b>'+s.high+'</b><span>Needs attention</span></article></div><div class="om-overview-grid"><section class="om-section"><div class="om-section-head"><div><small>MODERATION QUEUE</small><h3>Needs attention</h3></div><button data-om-tab="reports">View all →</button></div><div class="om-report-list">'+(queue.map(reportCard).join("")||'<div class="om-empty">No pending reports.</div>')+'</div></section><aside class="om-health-card"><small>COMMUNITY SAFETY</small><div class="om-health-score"><b>Good</b><span>●</span></div><p>Sample status based on the local moderation queue.</p><div class="om-health-row"><span>Spam detection</span><b>On</b></div><div class="om-health-row"><span>Invite review</span><b>On</b></div><button data-om-tab="automod">Review AutoMod settings →</button></aside></div><section class="om-section om-recent"><div class="om-section-head"><div><small>RECENT ACTIVITY</small><h3>Latest moderator actions</h3></div><button data-om-tab="logs">Open audit log →</button></div>'+logRows(2)+'</section>';
  }
  function reportsPanel(){
    let rows=reports.filter(r=>(reportFilter==="all"||r.status===reportFilter)&&(search===""||(r.user+" "+r.reason+" "+r.reporter+" "+r.id).toLowerCase().includes(search)));
    return '<div class="om-page-head"><div><small>SAFETY INBOX</small><h2>Member reports</h2><p>Review reports and record a moderation decision.</p></div><span>'+rows.length+' reports</span></div><div class="om-filter-row"><div class="om-filter-tabs">'+["all","open","reviewing","resolved"].map(x=>'<button class="'+(reportFilter===x?'active':'')+'" data-om-filter="'+x+'">'+x.charAt(0).toUpperCase()+x.slice(1)+'</button>').join("")+'</div><label class="om-search">⌕ <input id="om-search" value="'+esc(search)+'" placeholder="Search reports or members"></label></div><div class="om-report-list">'+(rows.map(reportCard).join("")||'<div class="om-empty">No reports match this filter.</div>')+'</div>';
  }
  function membersPanel(){
    const rows=members.filter(m=>(m.name+" "+m.role+" "+m.status).toLowerCase().includes(search));
    return '<div class="om-page-head"><div><small>COMMUNITY DIRECTORY</small><h2>Member management</h2><p>Review member status and available moderation actions.</p></div><span>'+members.length+' sample members</span></div><label class="om-search om-member-search">⌕ <input id="om-search" value="'+esc(search)+'" placeholder="Search members"></label><div class="om-member-list">'+rows.map(m=>'<article class="om-member-row"><span class="om-member-avatar om-'+m.avatar+'">'+esc(m.initial)+'</span><div class="om-member-main"><b>'+esc(m.name)+'</b><small>'+esc(m.role)+' · Joined '+esc(m.joined)+'</small></div><span class="om-member-status">'+esc(m.status)+'</span><span class="om-note-count">'+m.notes+' notes</span><button data-om-member="'+esc(m.name)+'">Manage</button></article>').join("")+'</div>';
  }
  function logRows(limit=99){return logs.slice(0,limit).map(l=>'<div class="om-log-row"><span class="om-log-dot om-'+l.kind+'"></span><b>'+esc(l.action)+'</b><span>'+esc(l.target)+'</span><small>by '+esc(l.by)+'</small><time>'+esc(l.time)+'</time></div>').join("")||'<div class="om-empty">No moderation actions recorded yet.</div>';}
  function logsPanel(){return '<div class="om-page-head"><div><small>ACCOUNTABILITY</small><h2>Moderation audit log</h2><p>A local record of actions taken in this preview.</p></div><span>'+logs.length+' entries</span></div><div class="om-log-list">'+logRows()+'</div>';}
  function automodPanel(){return '<div class="om-page-head"><div><small>PROACTIVE PROTECTION</small><h2>AutoMod settings</h2><p>Choose which activity should be flagged for moderator review.</p></div><span class="om-preview-pill">PREVIEW ONLY</span></div><div class="om-auto-note">These controls only change local preview state. No messages are scanned and no server rules are saved.</div><div class="om-auto-list">'+automod.map(a=>'<label class="om-auto-row"><span><b>'+esc(a.title)+'</b><small>'+esc(a.desc)+'</small></span><input type="checkbox" data-om-toggle="'+a.id+'" '+(a.enabled?'checked':'')+'><i></i></label>').join("")+'</div><div class="om-auto-footer"><span>Changes are kept only while this page is open.</span><button data-om="save-automod">Save preview</button></div>';}
  function renderPanel(){
    const panel=$("#om-panel");if(!panel)return;
    panel.innerHTML=activeTab==="overview"?overview():activeTab==="reports"?reportsPanel():activeTab==="members"?membersPanel():activeTab==="logs"?logsPanel():automodPanel();
    $("#orbit-moderation-view").querySelectorAll("[data-om-tab]").forEach(b=>b.classList.toggle("active",b.dataset.omTab===activeTab));
    $("#om-report-badge").textContent=stats().open+stats().reviewing;
  }
  function render(){renderPanel();}
  function open(){ensure();activeTab="overview";search="";reportFilter="all";render();$("#orbit-moderation-view").hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;}
  function close(){const v=$("#orbit-moderation-view");if(v)v.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
  function toast(msg){let t=$("#orbit-toast");if(!t){t=document.createElement("div");t.id="orbit-toast";t.className="orbit-toast";document.body.appendChild(t);}t.textContent=msg;t.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("visible"),2300);}
  function showModal(title,body,action){modalAction=action;$("#om-modal-title").textContent=title;$("#om-modal-content").innerHTML=body;$("#om-modal-layer").hidden=false;}
  function onViewClick(e){
    const tab=e.target.closest("[data-om-tab]");if(tab){activeTab=tab.dataset.omTab;search="";render();return;}
    const filter=e.target.closest("[data-om-filter]");if(filter){reportFilter=filter.dataset.omFilter;render();return;}
    const report=e.target.closest("[data-om-report]");if(report){selectedReport=reports.find(x=>x.id===report.dataset.omReport);if(!selectedReport)return;showModal("Report "+selectedReport.id,'<div class="om-detail-user"><b>'+esc(selectedReport.user)+'</b><span class="om-severity om-'+selectedReport.severity+'">'+esc(selectedReport.severity)+' priority</span></div><p class="om-detail-reason">'+esc(selectedReport.reason)+' · '+esc(selectedReport.channel)+'</p><p>'+esc(selectedReport.detail)+'</p><div class="om-evidence"><small>REPORTED CONTEXT</small><p>'+esc(selectedReport.evidence)+'</p></div><small class="om-detail-meta">Submitted by '+esc(selectedReport.reporter)+' · '+esc(selectedReport.time)+'</small><div class="om-action-grid"><button data-om-action="warn">Issue warning</button><button data-om-action="timeout">Timeout member</button><button data-om-action="remove">Remove member</button><button data-om-action="ban">Ban member</button></div><button class="om-resolve" data-om-action="resolve">Mark report resolved</button>',null);return;}
    const member=e.target.closest("[data-om-member]");if(member){const m=members.find(x=>x.name===member.dataset.omMember);if(!m)return;showModal("Manage "+m.name,'<p>Choose a local preview action for <b>'+esc(m.name)+'</b>.</p><div class="om-member-meta"><span>Role: '+esc(m.role)+'</span><span>Status: '+esc(m.status)+'</span><span>Previous notes: '+m.notes+'</span></div><div class="om-action-grid"><button data-om-action="warn">Issue warning</button><button data-om-action="timeout">Timeout member</button><button data-om-action="remove">Remove member</button><button data-om-action="ban">Ban member</button></div>',{member:m});}
    const action=e.target.closest("[data-om-action]");if(action){const kind=action.dataset.omAction;if(!selectedReport&&activeTab==="reports")return;const target=selectedReport?selectedReport.user:(modalAction&&modalAction.member?modalAction.member.name:"Member");showModal("Confirm moderation action",'<p>You are about to <b>'+esc(kind.replace("-"," "))+'</b> <b>'+esc(target)+'</b>.</p><div class="om-confirm-note">This is a simulated action. It will only update the local preview and audit log.</div>',{kind,target,report:selectedReport});}
    const general=e.target.closest("[data-om]")?.dataset.om;if(general==="close")close();if(general==="save-automod")toast("AutoMod preferences updated in this local preview.");
  }
  function onModalClick(e){
    if(e.target.closest("[data-om-close]")){$("#om-modal-layer").hidden=true;modalAction=null;return;}
    const action=e.target.closest("[data-om-action]");if(action){const kind=action.dataset.omAction;if(kind==="resolve"){if(selectedReport)selectedReport.status="resolved";logs.unshift({action:"Resolved report",target:selectedReport?selectedReport.user:"Member",by:"Aevryn",time:"Just now",kind:"resolved"});$("#om-modal-layer").hidden=true;selectedReport=null;render();toast("Report marked as resolved in preview.");return;}const target=selectedReport?selectedReport.user:(modalAction&&modalAction.member?modalAction.member.name:"Member");showModal("Confirm moderation action",'<p>You are about to <b>'+esc(kind.replace("-"," "))+'</b> <b>'+esc(target)+'</b>.</p><div class="om-confirm-note">This is a simulated action. It will only update the local preview and audit log.</div>',{kind,target,report:selectedReport});return;}
    if(e.target.closest("[data-om-confirm]")&&modalAction){const a=modalAction;logs.unshift({action:a.kind==="warn"?"Issued warning":a.kind==="timeout"?"Timed out member":a.kind==="remove"?"Removed member":"Banned member",target:a.target,by:"Aevryn",time:"Just now",kind:a.kind});if(a.report)a.report.status="resolved";if(a.member){a.member.notes+=a.kind==="warn"?1:0;if(a.kind==="timeout")a.member.status="Timed out";if(a.kind==="remove"||a.kind==="ban")a.member.status=a.kind==="ban"?"Banned":"Removed";}$("#om-modal-layer").hidden=true;selectedReport=null;modalAction=null;render();toast("Action recorded in local preview.");}
  }
  document.addEventListener("orbit:open-moderation",open);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){const m=$("#om-modal-layer");if(m&&!m.hidden){m.hidden=true;modalAction=null;}else if($("#orbit-moderation-view")&&!$("#orbit-moderation-view").hidden)close();}});
})();
