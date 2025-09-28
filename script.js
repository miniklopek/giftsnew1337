// LocalStorage mock
let users = JSON.parse(localStorage.getItem('users')||'[]');
let gifts = [{id:1,name:'Медвежонок',price:15,img:'assets/gifts/teddy.png',rare:false,enabled:true}];
let currentUser = null;

document.getElementById('register-btn').onclick = () => {
  let email = document.getElementById('email').value;
  let pass = document.getElementById('password').value;
  let nick = document.getElementById('nickname').value;
  if(!email||!pass||!nick) return alert('Заполните все поля');
  let id = users.length+1;
  users.push({id,email,pass,nick,stars:20,gifts:[],additional:[],verified:false,avatar:''});
  localStorage.setItem('users',JSON.stringify(users));
  alert('Зарегистрировано! Войдите');
}

document.getElementById('login-btn').onclick = () => {
  let email = document.getElementById('email').value;
  let pass = document.getElementById('password').value;
  let user = users.find(u=>u.email===email && u.pass===pass);
  if(!user) return alert('Пользователь не найден');
  currentUser = user;
  document.getElementById('login-register').style.display='none';
  document.getElementById('shop').style.display='block';
  document.getElementById('profile-menu').style.display='block';
  updateProfile();
  renderShop();
}

function updateProfile(){
  document.getElementById('profile-nick').innerText='@'+currentUser.nick;
  document.getElementById('profile-additional').innerText=currentUser.additional.length>0?'а так-же '+currentUser.additional.join(' '):'';
  document.getElementById('profile-id').innerText='ID: '+currentUser.id;
  document.getElementById('profile-verification').innerText=currentUser.verified?'Верифицирован организацией GiftsNew':'';
  renderGifts();
}

function renderShop(){
  let container = document.getElementById('gift-list');
  container.innerHTML='';
  gifts.forEach(g=>{
    if(!g.enabled) return;
    let card=document.createElement('div');
    card.className='gift-card';
    card.innerHTML='<img src="'+g.img+'"><p>'+g.name+'</p><p>'+g.price+' ⭐</p><button>Купить</button>';
    card.querySelector('button').onclick=()=>buyGift(g.id);
    container.appendChild(card);
  });
}

function buyGift(gid){
  let gift=gifts.find(g=>g.id===gid);
  if(currentUser.stars<gift.price) return alert('Не хватает звезд');
  currentUser.stars-=gift.price;
  let existing=currentUser.gifts.find(g=>g.id===gid);
  if(existing) existing.count++;
  else currentUser.gifts.push({id:gid,name:gift.name,img:gift.img,count:1});
  localStorage.setItem('users',JSON.stringify(users));
  updateProfile();
}

function renderGifts(){
  let container=document.getElementById('gifts-container');
  container.innerHTML='';
  if(currentUser.gifts.length===0){container.innerText='Нет подарков'; return;}
  currentUser.gifts.forEach(g=>{
    let card=document.createElement('div'); card.className='gift-card';
    card.style.position='relative';
    card.innerHTML='<img src="'+g.img+'"><p>'+g.name+'</p>';
    if(g.count>1){
      let c=document.createElement('div'); c.className='gift-count'; c.innerText='×'+g.count;
      card.appendChild(c);
    }
    container.appendChild(card);
  });
}
