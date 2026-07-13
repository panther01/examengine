const users = [

{

username:"SDM",

password:"SDM",

name:"SDM"

},
{

username:"Vishwa",

password:"Vishwa",

name:"Vishwa"

},
{

username:"PCS1",

password:"PCS1",

name:"PCS1"

},
{

username:"Saurabh",

password:"Saurabh",

name:"Saurabh, IAS"

},
{

username:"Abhishek",

password:"Abhishek",

name:"Abhishek"

},
{

username:"Ravi",

password:"Ravi",

name:"Ravi"

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
