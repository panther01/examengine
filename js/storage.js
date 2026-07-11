/*
=============================================
UPPSC Quiz V2

Storage Layer

Currently uses localStorage.

Later this file alone will be replaced
with Firebase.

Everything else will remain unchanged.
=============================================
*/

const Storage = {

    USER_KEY: "currentUser",

    progressPrefix: "progress_",


    //----------------------------------
    // USER
    //----------------------------------

    getCurrentUser(){

        return JSON.parse(
            localStorage.getItem(this.USER_KEY)
        );

    },

    logout(){

        localStorage.removeItem(this.USER_KEY);

    },


    //----------------------------------
    // SUBJECT
    //----------------------------------

    getSubjectKey(subject){

        const user=this.getCurrentUser();

        if(!user) return null;

        return this.progressPrefix+
               user.username+
               "_"+
               subject;

    },


    //----------------------------------
    // LOAD
    //----------------------------------

    load(subject){

        const key=this.getSubjectKey(subject);

        if(!key) return null;

        const raw=localStorage.getItem(key);

        if(!raw) return null;

        return JSON.parse(raw);

    },


    //----------------------------------
    // SAVE
    //----------------------------------

    save(subject,data){

        const key=this.getSubjectKey(subject);

        if(!key) return;

        localStorage.setItem(

            key,

            JSON.stringify(data)

        );

    },


    //----------------------------------
    // DELETE
    //----------------------------------

    clear(subject){

        const key=this.getSubjectKey(subject);

        localStorage.removeItem(key);

    },


    //----------------------------------
    // DASHBOARD
    //----------------------------------

    getDashboard(){

        const user=this.getCurrentUser();

        if(!user) return null;

        const subjects=[

            "history",
            "science",
            "polity",
            "geography",
            "Environment",
            "Economy"

        ];

        let totalQuestions=0;

        let attempted=0;

        let correct=0;

        let wrong=0;

        let bookmarks=0;

        const dashboard={};

        subjects.forEach(subject=>{

            const state=this.load(subject);

            if(!state){

                dashboard[subject]={

                    attempted:0,

                    correct:0,

                    wrong:0,

                    bookmarks:0,

                    progress:0,

                    accuracy:0

                };

                return;

            }

            const answers=
            state.answers||{};

            const bms=
            state.bookmarks||{};

            const a=
            Object.values(answers);

            const c=
            a.filter(x=>x.isCorrect).length;

            const w=
            a.filter(x=>!x.isCorrect).length;

            const att=
            a.length;

            const bm=
            Object.keys(bms).length;

            dashboard[subject]={

                attempted:att,

                correct:c,

                wrong:w,

                bookmarks:bm,

                progress:0,

                accuracy:
                att
                ?
                Math.round(c/att*100)
                :
                0

            };

            attempted+=att;

            correct+=c;

            wrong+=w;

            bookmarks+=bm;

        });

        dashboard.summary={

            attempted,

            correct,

            wrong,

            bookmarks,

            accuracy:

            attempted

            ?

            Math.round(

            correct/

            attempted

            *100

            )

            :

            0

        };

        return dashboard;

    }

};