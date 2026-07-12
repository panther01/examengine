const users = [

{

username:"SDM",

password:"SDM",

name:"SDM"

},
{

username:"vishwa",

password:"vishwa",

name:"Vishwa"

},
{

username:"saurabh",

password:"saurabh",

name:"Saurabh, IAS"

},
{

username:"Abhishek",

password:"Abhishek",

name:"Abhishek"

},

{

username:"IAS",

password:"IAS",

name:"IAS"

}

];

document

.getElementById("loginForm")

.addEventListener("submit",function(e){

e.preventDefault();

const u=document

.getElementById("username")

.value

.trim();

const p=document

.getElementById("password")

.value

.trim();

const user=users.find(x=>x.username===u && x.password===p);

if(user){

localStorage.setItem(

"currentUser",

JSON.stringify(user)

);

location.href="dashboard.html";

}

else{

document

.getElementById("message")

.innerHTML="❌ Invalid username/password";

}

});
