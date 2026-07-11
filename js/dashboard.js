const user = JSON.parse(localStorage.getItem("currentUser"));

if(!user){

location.href="index.html";

}

document.getElementById("welcome").innerHTML=

"Welcome, "+user.name+" 👋";

const d=new Date();

document.getElementById("today").innerHTML=

d.toDateString();

document.getElementById("logoutBtn")

.onclick=function(){

localStorage.removeItem("currentUser");

location.href="index.html";

};


const dashboard = Storage.getDashboard();

const summary = dashboard.summary;


animateNumber("questionsSolved", summary.attempted);

animateNumber("accuracy", summary.accuracy,"%");

animateNumber("bookmarks", summary.bookmarks);

animateNumber("streak",data.streak," 🔥");

setTimeout(()=>{

document.getElementById("overallFill").style.width=data.overall+"%";

document.getElementById("overallPercent").innerHTML=data.overall+"%";

},300);

loadSubject("polity");

loadSubject("history");

loadSubject("science");

loadSubject("geography");

loadSubject("Economy");

loadSubject("Environment");

function loadSubject(name){

    const s = dashboard[name];

    document.getElementById(name+"Bar").style.width =
        s.progress + "%";

    document.getElementById(name+"Text").innerHTML =
        s.progress + "% Completed";

}

function animateNumber(id,target,suffix=""){

let current=0;

const el=document.getElementById(id);

const timer=setInterval(()=>{

current+=Math.ceil(target/60);

if(current>=target){

current=target;

clearInterval(timer);

}

el.innerHTML=current+suffix;

},20);

}

function gotoSubject(subject){

    window.location.href = "quiz.html?subject=" + subject;

}

const subjects = ["history", "polity", "science", "geography", "Environment", "Economy"];

let totalAttempted = 0;
let totalQuestions = 0;

subjects.forEach(subject => {

    totalAttempted += dashboard[subject].attempted;

    // We'll set these actual totals next
    const totals = {
        history: 1886,
        polity: 954,
        science: 1382,
        geography: 1527,
	Environment: 482,
	Economy: 1364
    };

    totalQuestions += totals[subject];

});

const overall = Math.round(
    (totalAttempted / totalQuestions) * 100
);

document.getElementById("overallFill").style.width =
overall + "%";

document.getElementById("overallPercent").innerHTML =
overall + "%";