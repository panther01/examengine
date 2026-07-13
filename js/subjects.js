// ============================
// SUBJECTS PAGE
// ============================

// ---------- Authentication ----------
const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user) {
    window.location.href = "index.html";
}

// ---------- Welcome ----------
document.getElementById("welcome").innerHTML =
`Welcome, ${user.name} 👋`;

document.getElementById("subtitle").innerHTML =
"Continue where you left off";

// ---------- Logout ----------
document
.getElementById("logoutBtn")
.addEventListener("click", () => {

    localStorage.removeItem("currentUser");

    window.location.href = "index.html";

});

// ---------- Dashboard ----------
document
.getElementById("dashboardBtn")
.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});

// ======================================
// TEMP DATA
// (Later this comes from Firebase)
// ======================================

const progress = {

    polity:{
        progress:72,
        accuracy:83,
        bookmarks:42
    },

    history:{
        progress:55,
        accuracy:79,
        bookmarks:30
    },

    science:{
        progress:18,
        accuracy:70,
        bookmarks:12
    },

    geography:{
        progress:63,
        accuracy:81,
        bookmarks:25
    },

    economics:{
        progress:0,
        accuracy:0,
        bookmarks:0
    },

    environment:{
        progress:0,
        accuracy:0,
        bookmarks:0
    }

};

// ---------- Animate ----------

window.onload = () =>{

    loadSubject("polity");

    loadSubject("history");

    loadSubject("science");

    loadSubject("geography");

    loadSubject("environment");

    loadSubject("economics");

}

// ---------- Load One Subject ----------

function loadSubject(subject){

    const data = progress[subject];

    document.getElementById(subject+"Percent").innerHTML =
    data.progress+"%";

    document.getElementById(subject+"Accuracy").innerHTML =
    data.accuracy+"%";

    document.getElementById(subject+"Bookmarks").innerHTML =
    data.bookmarks;

    setTimeout(()=>{

        document.getElementById(subject+"Bar").style.width =
        data.progress+"%";

    },300);

}

// ---------- Continue ----------

function openSubject(subject){

    // nice animation before leaving

    document.body.style.opacity = "0";

    setTimeout(()=>{

        window.location.href =
        "quiz.html?subject="+subject;

    },350);

}
