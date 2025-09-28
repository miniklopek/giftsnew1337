let adminPassword='giftsnew1337999';
document.getElementById('admin-login-btn').onclick=()=>{
  let pass=document.getElementById('admin-password').value;
  if(pass===adminPassword){
    document.getElementById('admin-login').style.display='none';
    document.getElementById('admin-panel').style.display='block';
  }else document.getElementById('admin-error').innerText='Неверный пароль';
}
