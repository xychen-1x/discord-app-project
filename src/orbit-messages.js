// Orbit Screen 6 — Direct & Group Messages (frontend mock only).
// This module uses local sample data and browser state only. No backend or realtime calls.
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const people = {
    mika:{name:"Mika",initial:"M",avatar:"avatar-mika",status:"online"},
    kai:{name:"Kai",initial:"K",avatar:"avatar-kai",status:"online"},
    nova:{name:"Nova",initial:"N",avatar:"avatar-nova",status:"idle"},
    jules:{name:"Jules",initial:"J",avatar:"avatar-jules",status:"offline"},
    ren:{name:"Ren",initial:"R",avatar:"avatar-team",status:"offline"}
  };
  const conversations = [
    {id:"mika",type:"direct",name:"Mika",members:["mika"],unread:2,messages:[
      {id:1,author:"Mika",person:"mika",time:"Today at 8:41 PM",text:"Hey! Did you get a chance to look at the new Orbit layout?",reactions:["✨ 1"]},
      {id:2,author:"You",person:"me",time:"Today at 8:44 PM",text:"Yes, I'm working through the next screens now.",reactions:[]},
      {id:3,author:"Mika",person:"mika",time:"Today at 8:46 PM",text:"The messaging experience is going to be an important part of it.",reactions:["👍 1"]}
    ]},
    {id:"kai",type:"direct",name:"Kai",members:["kai"],unread:0,messages:[
      {id:1,author:"Kai",person:"kai",time:"Yesterday at 6:12 PM",text:"I added a few ideas to the project notes.",reactions:[]}
    ]},
    {id:"nova",type:"direct",name:"Nova",members:["nova"],unread:0,messages:[
      {id:1,author:"Nova",person:"nova",time:"Yesterday at 4:30 PM",text:"Let me know when the next preview is ready.",reactions:[]}
    ]},
    {id:"group-orbit",type:"group",name:"Orbit Team",members:["mika","kai","nova"],unread:1,messages:[
      {id:1,author:"Kai",person:"kai",time:"Today at 7:20 PM",text:"Welcome to the Orbit project group!",reactions:[]},
      {id:2,author:"Nova",person:"nova",time:"Today at 7:25 PM",text:"We can use this space to coordinate the UI screens.",reactions:["💡 2"]}
    ]}
  ];
  let activeId = "mika", replyTo = null, nextId = 10;
  let layer, modal;

  function ensureView(){
    if($("#orbit-messages-view")) return;
    layer=document.createElement("section");
    layer.id="orbit-messages-view";layer.className="orbit-messages-view";layer.hidden=true;
    layer.innerHTML=`
      <header class="om-header">
        <div class="om-heading"><button class="om-back" type="button" aria-label="Back to channel">‹</button><span class="om-heading-icon">✉</span><div><b id="om-title">Mika</b><small id="om-subtitle">Direct Message</small></div></div>
        <div class="om-header-actions"><button type="button" data-om-action="add-friend" title="Add people">＋</button><button type="button" data-om-action="search" title="Search conversation">⌕</button><button type="button" data-om-action="details" title="Conversation details">ⓘ</button></div>
      </header>
      <div class="om-body">
        <aside class="om-conversation-rail"><div class="om-rail-title">DIRECT MESSAGES <button type="button" data-om-action="new-group" aria-label="New group message">＋</button></div><div id="om-conversation-list"></div></aside>
        <section class="om-chat">
          <div id="om-chat-scroll" class="om-chat-scroll"><div id="om-chat-welcome" class="om-chat-welcome"></div><div id="om-messages" class="om-messages"></div><div id="om-typing" class="om-typing" hidden><span></span><span></span><span>Someone is typing…</span></div></div>
          <div id="om-reply-preview" class="om-reply-preview" hidden></div>
          <form id="om-composer" class="om-composer"><button type="button" data-om-action="attach" aria-label="Add attachment">＋</button><input id="om-input" autocomplete="off" maxlength="2000" placeholder="Message Mika" aria-label="Message" /><button type="button" data-om-action="gift" aria-label="Gift">▱</button><button type="button" data-om-action="emoji" aria-label="Emoji">☺</button><button class="om-send" type="submit" aria-label="Send message">➤</button></form>
          <p class="om-preview-note">Frontend preview · Messages are stored only in this page session</p>
        </section>
        <aside class="om-details" id="om-details"><div class="om-details-banner"></div><div class="om-details-avatar" id="om-details-avatar">M</div><h3 id="om-details-name">Mika</h3><p id="om-details-tag">@mika_07</p><div class="om-details-status"><i></i><span id="om-details-presence">Online</span></div><div class="om-details-divider"></div><b class="om-details-label">SHARED SPACE</b><div class="om-shared-space">✦ Orbit</div><b class="om-details-label">MEMBERS</b><div id="om-members"></div></aside>
      </div>
      <div id="om-menu" class="om-menu" hidden></div>
    `;
    $(".main-panel").appendChild(layer);
    modal=document.createElement("div");modal.id="om-modal-layer";modal.className="om-modal-layer";modal.hidden=true;
    modal.innerHTML=`<button class="om-modal-backdrop" data-om-modal-close aria-label="Close"></button><section class="om-modal" role="dialog" aria-modal="true" aria-labelledby="om-modal-title"><header><div><small>ORBIT MESSAGES</small><h2 id="om-modal-title">Create a group message</h2></div><button type="button" data-om-modal-close aria-label="Close">×</button></header><p>Choose people to start a group conversation.</p><div class="om-member-picker" id="om-member-picker"></div><label class="om-group-name-label">GROUP NAME <input id="om-group-name" maxlength="40" placeholder="Optional group name" /></label><footer><button type="button" data-om-modal-close>Cancel</button><button type="button" class="om-create-group" data-om-create-group>Create Group</button></footer></section>`;
    document.body.appendChild(modal);
    layer.addEventListener("click",onViewClick);
    $("#om-composer").addEventListener("submit",sendMessage);
    modal.addEventListener("click",onModalClick);
    $("#om-conversation-list").addEventListener("click",e=>{const b=e.target.closest("[data-om-conversation]");if(b)openConversation(b.dataset.omConversation);});
    $("#om-messages").addEventListener("click",onMessageClick);
    $("#om-chat-scroll").addEventListener("contextmenu",e=>{const row=e.target.closest("[data-message-id]");if(row){e.preventDefault();openMessageMenu(row.dataset.messageId,e.clientX,e.clientY);}});
  }
  function active(){return conversations.find(c=>c.id===activeId)||conversations[0];}
  function renderRail(){
    $("#om-conversation-list").innerHTML=conversations.map(c=>{
      const avatar=c.type==="group"?"✦":(people[c.members[0]]?.initial||"?");
      const sub=c.type==="group"?c.members.map(id=>people[id]?.name).join(", "):"@"+(c.id==="mika"?"mika_07":c.id+"_orbit");
      return `<button type="button" class="om-conversation ${c.id===activeId?"active":""}" data-om-conversation="${esc(c.id)}"><span class="om-mini-avatar ${c.type==="direct"?(people[c.members[0]]?.avatar||""):"group"}">${esc(avatar)}</span><span><b>${esc(c.name)}</b><small>${esc(sub)}</small></span>${c.unread?`<i>${c.unread}</i>`:""}</button>`;
    }).join("");
  }
  function renderConversation(){
    const c=active();if(!c)return;
    c.unread=0;replyTo=null;$("#om-reply-preview").hidden=true;
    $("#om-title").textContent=c.name;$("#om-subtitle").textContent=c.type==="group"?"Group conversation · "+c.members.length+" members":"Direct Message";
    $("#om-input").placeholder="Message "+c.name;
    const p=people[c.members[0]]||people.mika;
    $("#om-chat-welcome").innerHTML=`<div class="om-welcome-avatar ${c.type==="group"?"group":p.avatar}">${c.type==="group"?"✦":esc(p.initial)}</div><h2>${esc(c.name)}</h2><p>${c.type==="group"?"This is the beginning of your group conversation.":"This is the beginning of your direct message history."}</p>`;
    $("#om-messages").innerHTML=c.messages.map(m=>messageMarkup(m)).join("");
    $("#om-details-avatar").textContent=c.type==="group"?"✦":p.initial;$("#om-details-avatar").className="om-details-avatar "+(c.type==="group"?"group":p.avatar);
    $("#om-details-name").textContent=c.name;$("#om-details-tag").textContent=c.type==="group"?c.members.length+" members":"@"+(c.id==="mika"?"mika_07":c.id+"_orbit");
    $("#om-details-presence").textContent=c.type==="group"?"Group conversation":p.status==="online"?"Online":p.status==="idle"?"Idle":"Offline";
    $("#om-details").classList.remove("collapsed");
    $("#om-members").innerHTML=c.members.map(id=>{const x=people[id];return x?`<div class="om-member"><span class="om-member-avatar ${x.avatar}">${esc(x.initial)}</span><span>${esc(x.name)}</span><i class="${x.status}"></i></div>`:"";}).join("")+(c.type==="group"?'<div class="om-member"><span class="om-member-avatar me">A</span><span>You</span><i class="online"></i></div>':"");
    renderRail();$("#om-chat-scroll").scrollTop=$("#om-chat-scroll").scrollHeight;
  }
  function messageMarkup(m){
    const own=m.person==="me";
    const p=people[m.person]||{initial:"A",avatar:"me"};
    return `<article class="om-message ${own?"own":""}" data-message-id="${m.id}"><span class="om-message-avatar ${own?"me":p.avatar}">${own?"A":esc(p.initial)}</span><div class="om-message-content"><div class="om-message-meta"><b>${esc(m.author)}</b><time>${esc(m.time)}</time></div>${m.reply?'<div class="om-quoted-message">↳ '+esc(m.reply)+'</div>':""}<p>${esc(m.text)}</p>${m.reactions?.length?'<div class="om-reactions">'+m.reactions.map(r=>'<button type="button" data-reaction="'+esc(r)+'">'+esc(r)+'</button>').join("")+'</div>':""}</div><button class="om-message-more" type="button" data-message-menu="${m.id}" aria-label="Message options">•••</button></article>`;
  }
  function openConversation(id){if(!conversations.some(c=>c.id===id))return;activeId=id;layer.hidden=false;$(".main-header").hidden=true;$(".chat-layout").hidden=true;renderConversation();}
  function closeView(){layer.hidden=true;$(".main-header").hidden=false;$(".chat-layout").hidden=false;}
  function sendMessage(e){e.preventDefault();const input=$("#om-input"),text=input.value.trim();if(!text)return;const c=active();c.messages.push({id:nextId++,author:"You",person:"me",time:"Just now",text,reactions:[],reply:replyTo?.text||null});input.value="";replyTo=null;$("#om-reply-preview").hidden=true;renderConversation();}
  function onViewClick(e){
    if(e.target.closest(".om-back")){closeView();return;}
    const action=e.target.closest("[data-om-action]")?.dataset.omAction;
    if(action==="new-group"){openGroupModal();return;}
    if(action==="details"){$("#om-details").classList.toggle("collapsed");return;}
    if(action==="search"){showToast("Conversation search will be connected in a later integration pass.");return;}
    if(action==="attach"||action==="gift"||action==="emoji"){showToast("This control is a UI preview; uploads and picker data are not connected.");return;}
    if(action==="add-friend"){showToast("Adding members will be available in the group conversation flow.");return;}
    const menu=e.target.closest("[data-message-menu]");if(menu){const rect=menu.getBoundingClientRect();openMessageMenu(menu.dataset.messageMenu,rect.left,rect.bottom);return;}
  }
  function onMessageClick(e){const reaction=e.target.closest("[data-reaction]");if(reaction){showToast("Reaction preview: "+reaction.dataset.reaction);}}
  function openMessageMenu(id,x,y){
    const menu=$("#om-menu");menu.innerHTML=`<button data-message-action="reply" data-id="${id}">↩ Reply</button><button data-message-action="react" data-id="${id}">☺ Add reaction</button><button data-message-action="edit" data-id="${id}">✎ Edit message</button><button class="danger" data-message-action="delete" data-id="${id}">⌫ Delete message</button>`;
    menu.hidden=false;menu.style.left=Math.max(8,Math.min(x,innerWidth-190))+"px";menu.style.top=Math.max(8,Math.min(y,innerHeight-190))+"px";
    menu.onclick=e=>{const b=e.target.closest("[data-message-action]");if(!b)return;const c=active(),m=c.messages.find(x=>String(x.id)===b.dataset.id);menu.hidden=true;if(!m)return;
      if(b.dataset.messageAction==="reply"){replyTo=m;const box=$("#om-reply-preview");box.hidden=false;box.innerHTML='<span>Replying to <b>'+esc(m.author)+'</b>: '+esc(m.text)+'</span><button type="button" aria-label="Cancel reply" id="om-cancel-reply">×</button>';$("#om-cancel-reply").onclick=()=>{replyTo=null;box.hidden=true;};$("#om-input").focus();}
      if(b.dataset.messageAction==="react"){m.reactions=m.reactions||[];m.reactions.push("✨ 1");renderConversation();}
      if(b.dataset.messageAction==="edit"){if(m.person!=="me"){showToast("You can only edit your own messages.");return;}const next=prompt("Edit your message",m.text);if(next?.trim()){m.text=next.trim();renderConversation();}}
      if(b.dataset.messageAction==="delete"){if(m.person!=="me"){showToast("You can only delete your own messages in this preview.");return;}c.messages=c.messages.filter(x=>x!==m);renderConversation();}
    };
  }
  function openGroupModal(){
    $("#om-member-picker").innerHTML=Object.entries(people).map(([id,p])=>`<label><input type="checkbox" value="${id}"><span class="om-picker-avatar ${p.avatar}">${esc(p.initial)}</span><span><b>${esc(p.name)}</b><small>@${esc(id)}_orbit</small></span></label>`).join("");
    $("#om-group-name").value="";modal.hidden=false;
  }
  function onModalClick(e){
    if(e.target.closest("[data-om-modal-close]")){modal.hidden=true;return;}
    if(e.target.closest("[data-om-create-group]")){
      const ids=[...$("#om-member-picker").querySelectorAll("input:checked")].map(x=>x.value);
      if(ids.length<2){showToast("Select at least two people for a group.");return;}
      const name=$("#om-group-name").value.trim()||ids.map(id=>people[id].name).join(", ");
      const id="group-"+Date.now();conversations.unshift({id,type:"group",name,members:ids,messages:[]});
      modal.hidden=true;openConversation(id);
    }
  }
  function showToast(message){let t=$("#orbit-toast");if(!t){t=document.createElement("div");t.id="orbit-toast";t.className="orbit-toast";document.body.appendChild(t);}t.textContent=message;t.classList.add("visible");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove("visible"),2400);}
  function openFriendDM(id){if(!people[id])return;let c=conversations.find(x=>x.id===id);if(!c){c={id,type:"direct",name:people[id].name,members:[id],unread:0,messages:[]};conversations.unshift(c);}openConversation(c.id);}
  document.addEventListener("click",e=>{
    const dm=e.target.closest("[data-dm]");if(dm){ensureView();openConversation(dm.dataset.dm);return;}
    const friend=e.target.closest('[data-friend-action="message"]');if(friend){ensureView();openFriendDM(friend.dataset.friendId);}
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(modal&&!modal.hidden)modal.hidden=true;if(layer&&!layer.hidden){$("#om-menu").hidden=true;closeView();}}});
  // Lazy initialization keeps the original channel screen unchanged until a DM is opened.
})();
