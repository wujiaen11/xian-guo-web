// JavaScript Document


//initial
function E(ElementId){
   return document.getElementById(ElementId);
  }


//username check					 

var username = E("username");

username.onfocus = function init(){

  username.value="";

}

username.onblur = function checkUser(){

  var regUser =  /^([a-zA-Z0-9_\u4e00-\u9fa5]{4,16})$/;
  var flag = regUser.test(username.value);
	
  if(!flag){

	username.value="用户名格式错误！";

    return false;
  }
  return true;	
}


//password check
var password = E("password");
password.onfocus = function init(){

  password.value="";

}
//判断
password.onblur = function checkPassword(){
	
  var reg = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[^\da-zA-Z\s]).{6,16}$/;
  var flag = reg.test(password.value);

if(!flag){
	alert("密码格式错误，请重新输入！");
	password.value="";
	return false;
  }

  return true;	  
}


//登陆验证
var login = E("login");
login.onclick = function logCheck(){

	if(checkUser() && checkPassword()){

		alert("用户名或密码未输入！");
		return false;
	}
return true;
}				   
