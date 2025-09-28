// Single-file demo app using localStorage as DB. All text is in Russian per request.
(() => {
  const LS = {
    USERS: 'vg_users_v1',
    GIFTS: 'vg_gifts_v1',
    CURUSER: 'vg_curuser_v1',
  };

  // Utils
  const el = id => document.getElementById(id);
  const toast = (t) => {
    const box = el('toast'); box.textContent = t; box.classList.remove('hidden');
    setTimeout(()=>box.classList.add('hidden'), 2500);
  };

  // Defaults
  const defaultAvatar = 'assets/default-avatar.png';

  // Storage helpers
  function read(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch(e){return def;} }
  function write(key, v){ localStorage.setItem(key, JSON.stringify(v)); }

  // Initialize sample gift if none
  function initData(){
    let gifts = read(LS.GIFTS, null);
    if(!gifts){
      gifts = [{
        id: 1, name: 'Мишка (как в телеграмме)', desc:'Плюшевый мишка — 15 звёзд', price:15, rare:false, img:'assets/teddy.png', disabled:false
      }];
      write(LS.GIFTS, gifts);
    }
    let users = read(LS.USERS, null);
    if(!users) write(LS.USERS, []);
  }

  initData();

  // DOM refs
  const authModal = el('authModal');
  const storePage = el('store');
  const profilePage = el('profilePage');
  const adminPage = el('adminPage');
  const userMenu = el('userMenu');
  const avatarBtn = el('avatarBtn');
  const nickDisplay = el('nickDisplay');
  const coinsAmount = el('coinsAmount');
  const giftsGrid = el('giftsGrid');
  const ownedGrid = el('ownedGrid');
  const noGifts = el('noGifts');
  const profileAvatar = el('profileAvatar');
  const profileNick = el('profileNick');
  const nickInput = el('nickInput');

  // Auth handlers
  el('registerBtn').addEventListener('click', ()=>{
    const email = el('email').value.trim(); const pw = el('password').value;
    if(!email||!pw){ toast('Введите email и пароль'); return; }
    const users = read(LS.USERS, []);
    if(users.find(u=>u.email===email)){ toast('Пользователь с таким email уже существует'); return; }
    // find next id 0-9000
    let next = 0; while(users.find(u=>u.id===next) && next<9000) next++;
    const user = { id: next, email, pw, coins:0, gifts:[], nick:'Пользователь#'+next, avatar:defaultAvatar };
    users.push(user); write(LS.USERS, users); setCurrentUser(user.id); toast('Регистрация прошла успешно'); renderAll();
  });

  el('loginBtn').addEventListener('click', ()=>{
    const email = el('email').value.trim(); const pw = el('password').value;
    const users = read(LS.USERS, []);
    const u = users.find(x=>x.email===email && x.pw===pw);
    if(!u){ toast('Неверный email или пароль'); return; }
    setCurrentUser(u.id); toast('Вход выполнен'); renderAll();
  });

  function setCurrentUser(id){ write(LS.CURUSER, id); authModal.classList.add('hidden'); userMenu.classList.remove('hidden'); showPage('store'); }

  function getCurrentUser(){
    const uid = read(LS.CURUSER, null); if(uid===null) return null;
    const users = read(LS.USERS, []); return users.find(u=>u.id===uid) ?? null;
  }

  // Render store
  function renderGifts(){
    const gifts = read(LS.GIFTS, []);
    giftsGrid.innerHTML = '';
    gifts.forEach(g=>{
      const div = document.createElement('div'); div.className='gift-card'+(g.disabled?' disabled':'');
      div.innerHTML = `
        <img src="${g.img}" class="gift-img">
        <div class="gift-title">${escapeHtml(g.name)}</div>
        <div class="small">${escapeHtml(g.desc)}</div>
        <div class="gift-meta">
          <div class="small">${g.rare? 'Редкий':''}</div>
          <div class="row">
            <div class="coins">${g.price}⭐</div>
            <button class="btn buy" data-id="${g.id}">Купить</button>
          </div>
        </div>`;
      giftsGrid.appendChild(div);
    });
    // attach buy handlers
    document.querySelectorAll('.buy').forEach(b=>b.addEventListener('click', onBuy));
  }

  function onBuy(e){
    const id = Number(e.target.dataset.id); const user = getCurrentUser(); if(!user) { toast('Войдите в аккаунт'); return; }
    const gifts = read(LS.GIFTS, []); const gift = gifts.find(g=>g.id===id);
    if(!gift) { toast('Подарок не найден'); return; }
    if(user.coins < gift.price){ toast('Не хватает звёзд'); return; }
    // deduct and add gift
    user.coins -= gift.price; user.gifts.push(gift.id);
    // save
    const users = read(LS.USERS, []); const idx = users.findIndex(u=>u.id===user.id); users[idx]=user; write(LS.USERS, users);
    toast('Подарок куплен');
    renderAll();
  }

  // Profile render
  function renderProfile(){
    const user = getCurrentUser(); if(!user) return;
    profileAvatar.src = user.avatar || defaultAvatar;
    profileNick.textContent = user.nick;
    nickInput.value = user.nick;
    coinsAmount.textContent = user.coins;
    // owned gifts
    const gifts = read(LS.GIFTS, []);
    ownedGrid.innerHTML='';
    if(!user.gifts || user.gifts.length===0){ noGifts.style.display='block'; return; }
    noGifts.style.display='none';
    user.gifts.forEach(gid=>{
      const g = gifts.find(x=>x.id===gid); if(!g) return;
      const div = document.createElement('div'); div.className='owned-item';
      div.innerHTML = `<img src="${g.img}" style="width:100%;height:80px;object-fit:contain"><div class="small">${escapeHtml(g.name)}</div>`;
      ownedGrid.appendChild(div);
    });
  }

  // Admin features
  function renderAdmin(){
    // populate gifts select
    const gifts = read(LS.GIFTS, []);
    const sel = el('adminGiftSelect'); sel.innerHTML='';
    gifts.forEach(g=>{ const o = document.createElement('option'); o.value=g.id; o.textContent=`${g.name} (${g.price}⭐)`; sel.appendChild(o); });
    // render list with edit options
    const list = el('giftsListAdmin'); list.innerHTML='';
    gifts.forEach(g=>{
      const item = document.createElement('div'); item.className='gifts-list-item';
      item.innerHTML = `<img src="${g.img}" width=48 height=48 style="object-fit:contain;border-radius:8px"><div style="flex:1"><strong>${escapeHtml(g.name)}</strong><div class="small">${escapeHtml(g.desc)}</div></div>
      <div style="text-align:right"><div>${g.price}⭐</div><div class="small">${g.disabled? 'Отключён':''}</div><button class="btn editGift" data-id="${g.id}">Редактировать</button></div>`;
      list.appendChild(item);
    });
    document.querySelectorAll('.editGift').forEach(btn=>btn.addEventListener('click', onEditGift));
  }

  function onEditGift(e){
    const id = Number(e.target.dataset.id); const gifts = read(LS.GIFTS, []); const g = gifts.find(x=>x.id===id);
    if(!g) return; // open quick edit prompt sequence
    const name = prompt('Название подарка', g.name); if(name===null) return;
    const price = prompt('Цена (число)', String(g.price)); if(price===null) return;
    const desc = prompt('Описание', g.desc); if(desc===null) return;
    const disabled = confirm('Сделать отключённым (OK = да) ?');
    g.name = name; g.price = Number(price)||g.price; g.desc = desc; g.disabled = disabled;
    write(LS.GIFTS, gifts); toast('Подарок обновлён'); renderAdmin(); renderGifts();
  }

  // Admin actions: give coins / gift
  el('giveCoinsBtn').addEventListener('click', ()=>{
    const uid = Number(el('adminUserId').value); const amt = Number(el('adminCoins').value);
    const users = read(LS.USERS, []); const u = users.find(x=>x.id===uid);
    if(!u){ toast('Пользователь не найден'); return; }
    u.coins = (u.coins||0) + (amt||0); write(LS.USERS, users); toast('Звёзды выданы'); renderAll();
  });
  el('giveGiftBtn').addEventListener('click', ()=>{
    const uid = Number(el('adminUserId').value); const gid = Number(el('adminGiftSelect').value);
    const users = read(LS.USERS, []); const u = users.find(x=>x.id===uid); const gifts = read(LS.GIFTS, []); const g = gifts.find(x=>x.id===gid);
    if(!u || !g){ toast('Пользователь или подарок не найден'); return; }
    u.gifts = u.gifts||[]; u.gifts.push(g.id); write(LS.USERS, users); toast('Подарок выдан'); renderAll();
  });

  // Add gift form
  el('addGiftForm').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const file = el('giftImage').files[0];
    let dataUrl = 'assets/teddy.png';
    if(file){ dataUrl = await toDataURL(file); }
    const gifts = read(LS.GIFTS, []);
    const nid = (gifts.reduce((m,x)=>Math.max(m,x.id),0)||0) + 1;
    const g = { id:nid, name: el('giftName').value||'Без названия', desc: el('giftDesc').value||'', price: Number(el('giftPrice').value)||0, rare: el('giftRarity').checked, img: dataUrl, disabled: el('giftDisabled').checked };
    gifts.push(g); write(LS.GIFTS, gifts); toast('Подарок добавлен'); el('addGiftForm').reset(); renderAdmin(); renderGifts();
  });

  // Editing profile: nick and avatar
  el('editNickBtn').addEventListener('click', ()=>{ nickInput.classList.toggle('hidden'); });
  nickInput.addEventListener('change', ()=>{
    const user = getCurrentUser(); if(!user) return;
    user.nick = nickInput.value || user.nick; saveUser(user); renderAll(); toast('Ник изменён');
  });
  el('changePhotoBtn').addEventListener('click', ()=> el('uploadPhoto').click() );
  el('uploadPhoto').addEventListener('change', async (ev)=>{
    const file = ev.target.files[0]; if(!file) return;
    const url = await toDataURL(file);
    const user = getCurrentUser(); if(!user) return;
    user.avatar = url; saveUser(user); renderAll(); toast('Фото профиля обновлено');
  });

  avatarBtn.addEventListener('click', ()=> showPage('profile'));

  // Admin route protection - simple password check on navigation
  function tryEnterAdmin(){
    const pwd = prompt('Введите пароль админа'); if(pwd==='admin123'){ showPage('admin'); renderAdmin(); } else { toast('Неверный пароль'); }
  }

  // helpers
  function saveUser(user){ const users = read(LS.USERS, []); const idx = users.findIndex(u=>u.id===user.id); users[idx]=user; write(LS.USERS, users); }
  function toDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }

  // Routing / pages
  function showPage(name){
    [storePage, profilePage, adminPage].forEach(p=>p.classList.add('hidden'));
    if(name==='store') storePage.classList.remove('hidden');
    if(name==='profile') profilePage.classList.remove('hidden');
    if(name==='admin') adminPage.classList.remove('hidden');
  }

  // Render all common bits
  function renderAll(){
    const user = getCurrentUser();
    if(!user){ authModal.classList.remove('hidden'); userMenu.classList.add('hidden'); showPage('store'); renderGifts(); return; }
    userMenu.classList.remove('hidden'); authModal.classList.add('hidden');
    avatarBtn.src = user.avatar || defaultAvatar; nickDisplay.textContent = user.nick;
    coinsAmount.textContent = user.coins;
    renderGifts(); renderProfile();
  }

  // Edit gift quick handler defined earlier
  function onEditGift(){}

  // Admin navigation link
  // allow URL hash #/admin
  window.addEventListener('hashchange', ()=>{ if(location.hash==='#/admin') tryEnterAdmin(); });

  // preview button opens a new window with the same page (simple preview)
  el('previewBtn').addEventListener('click', ()=>{ window.open(location.href, '_blank'); });

  // init listeners for admin edit plugin
  document.addEventListener('click', (e)=>{
    if(e.target.classList.contains('editGift')) onEditGift(e);
  });

  // on load
  renderAll();
  // if hash indicates admin open prompt
  if(location.hash==='#/admin') tryEnterAdmin();
})();