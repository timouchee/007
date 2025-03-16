var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Servir les fichiers statiques (par exemple, HTML, CSS, JS) dans le dossier courant
app.use(express.static(__dirname));

// Quand le serveur Express reçoit une requête à la racine, il retourne le fichier index.html
app.get("/", function(req, res){
    res.sendFile(__dirname + "/index.html");
});

//ici on va faire les ensemble de teste
app.get("/part1_2player_player1_voire_leschoix_444", function(req, res){
    res.sendFile(__dirname + "/tes_play1.html");
});

app.get("/part1_2player_player2_voire_leschoix_444", function(req, res){
    res.sendFile(__dirname + "/tes_play2.html");
});




let lst_action = 
{
    //type : utilitaire
    "recharge" : {"type" : "utilitaire", "cout" : 0},
    "revive" : {"type" : "utilitaire", "cout" : 5},
    "holy-recharge" : {"type" : "utilitaire", "cout" : 0},
    "report-death" : {"type" : "utilitaire", "cout" : 3},
    "fast-flash(not finish)" : {"type" : "utilitaire", "cout" : 0},
    "invoc" : {"type" : "utilitaire", "cout" : 3},
    "remede" : {"type" : "utilitaire", "cout" : 0},
    "three-points" : {"type" : "utilitaire", "cout" : 0},
    //type : defense
    "bouclier" : {"type" : "defense", "cout" : 0 , "by-pass-by":["bazooka","flechette","arrache","type-fatality"] },
    "miroir" : {"type" : "defense", "cout" : 0 , "by-pass-by":["lame","arrache","type-fatality"],"not-reverb" : ["flechette"] },  
    "absorb" : {"type" : "defense", "cout" : 2 , "by-pass-by":["kaméaméa-max","arrache","type-fatality"] },
    "mur" : {"type" : "defense", "cout" : 1},
    "sphere" : {"type" : "defense", "cout" : 3 , "by-pass-by":["kaméaméa-max","arrache"]},
    "tuyau" : {"type" : "defense", "cout" : 2 , "by-pass-by":["kaméaméa-max","arrache","type-fatality","kaméaméa-simple"]},
    //type : attaque
    "gun" : {"type" : "attaque", "cout" : 1},
    "twin-gun" : {"type" : "attaque", "cout" : 2, "dual": ["gun","gun"], "cadence":"instant"},
    "bazooka" : {"type" : "attaque", "cout" : 3},
    "lame" : {"type" : "attaque", "cout" : 3},
    "flechette" : {"type" : "attaque", "cout" : 3},
    "pisto-lame" : {"type" : "attaque", "cout" : 4, "dual": ["gross-balle","petit-lame"], "cadence":"separete"},
    "gross-balle" : {"type" : "attaque", "cout" : 2},
    "petit-lame" : {"type" : "attaque", "cout" : 2},
    "fast-flash(finish)" : {"type" : "attaque", "cout" : 5},
    "kaméaméa-simple" : {"type" : "attaque", "cout" : 10},
    "kaméaméa-max" : {"type" : "attaque", "cout" : 20},
    "lance" : {"type" : "attaque", "cout" : 3},
    //type : special
    "arrache" : {"type" : "special", "cout" : 5},
    //type : fatality
    "mineure" : {"type" : "fatality", "cout" : 7},
    "lance-flame" : {"type" : "fatality", "cout" : 7},
    "machin-gun" : {"type" : "fatality", "cout" : 7},
    
}

function generateId() {
    return 'party-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}


//var
var nb_player_for_party = 2;
var nb_player_ready = 0;
//{"idplayer1":{"ready":true,"pseudo":guest1},"idplayer2":{"ready":true,"pseudo":guest2}} true for ready
var dico_user = {};
var dico_speudo = {};
var dico_party = {};



/* 
list of route(client) : 
-player-ready (emit)=> send ID to server(for show we are ready to party)
-player-unready (emit)=> send ID to server(for show we are not ready to party)
-private-player-gate=+monID (received) => any server info particulary to you
-clientDisconnecting (emit) => send his ID when se page close
-player-connect (emit) => send ID to server (first connexion)
-info-before-party(received) => took the number of client connected
*/

io.on('connection',function(socket){

    function info_before_party()
    {
        //lst user
        console.log("information server : ");
        console.table(dico_user);
        console.table(dico_speudo);
        io.emit("info-before-party",[dico_user,nb_player_for_party]);
    }

    function create_party()
    {
        // Extraire les trois premiers éléments du dictionnaire
        var idNewParty = generateId();
        dico_party[idNewParty] = {};
        let countReadyPlayer = 0;
        for(let id in dico_user)
        {
            if(dico_user[id]["ready"]==true)
            {
                countReadyPlayer++;
                dico_party[idNewParty][id] = dico_user[id];
                delete dico_user[id];
                if(countReadyPlayer >= nb_player_for_party) {break};
            }
        }
        //envoyer au suer leur id de game
        console.table(dico_party[idNewParty]);
        for (let key in dico_party[idNewParty])
        {
            console.log("envoie a => "+"private-player-gate="+key);
            io.emit("private-player-gate="+key,["join-party",idNewParty,dico_party[idNewParty]]);//info de la game
            //====ELEMENT DE JOUEUR==========
            dico_party[idNewParty][key] = 
            {
                "pseudo" : dico_party[idNewParty]["pseudo"],
                "life" : 1,
                "last-move" : "none",
                "last-last-move" : "none",
                "effect" : {},
                "possible-choice" : {},
                "charge" : 0,
            };
        }
        //=====ELEMENT DE PARTY========
        dico_party[idNewParty]["game_info"] = 
        {
            "round": 0,
            "info":[],
            "winner": "none",
            "etat":"",//choose,result
            "choice_player":[]//"id : {"choix":"nom du choix","cible":"idplayer","info en plus": [] }
        };

        info_before_party();
        party_choice_player_ask(idNewParty);

    }

    function party_choice_player_ask (idNewParty)
    {
        for (let key in dico_party[idNewParty])
        {
            if (!["game_info"].includes(key)) 
            {
                console.log("demande de choice => "+"private-player-gate="+key+ " | aka: "+dico_speudo[key]);

                //il faut lister les choix que se joueur pet faire et les lui envoyer
                for(let action_name in lst_action)
                {
                    if(lst_action[action_name]["cout"] <= dico_party[idNewParty][key]["charge"])
                    {
                        //verif si il a pas fait une action qui limite de fou sa prochaine action
                        //comme les action qui te force a jouer un truc prescis au tour d'apres

                        //verif si c'est pas arracher
                        //regarder si action_name est dans etat -> arracher (faire des verif avec des if existe un truc du genre)

                        //verif les diferent cooldown ou truc ou il faut faire un truc avant
                        //pour le moment que le mirroire est pris en compte
                        switch (action_name) {
                            case "miroir":
                                //verif le cooldown est bon
                                if(dico_party[idNewParty][key]["last-move"] !="miroir") 
                                {
                                    dico_party[idNewParty][key]["possible-choice"][action_name] =  lst_action[action_name];
                                }
                                break;
                        
                            default:
                                dico_party[idNewParty][key]["possible-choice"][action_name] =  lst_action[action_name];
                                break;
                        }
                    }
                }

                /* 
                bon la en gros j'ai juste fait le cas de verif le nb de ball et le cooldwon du miroir
                */

                io.emit("private-player-gate="+key,["party-choice",dico_party[idNewParty][key],dico_party[idNewParty]["game_info"]  ]);//info de la game
            }
        }
    }

    function party_choice_player_answer ()
    {

    }
    
    function party_result_player ()
    {

    }
    function party_affect_player ()
    {

    }

    //player ready
    socket.on("player-ready",function(id_user){
        dico_user[id_user]["ready"] = true;
        nb_player_ready++;
        info_before_party();//celui la est envoyer a tt le monde
        //verif que sa fait 3 
        if(nb_player_ready == nb_player_for_party)
        {            
            create_party();
        }
    })

    //player not ready anymore
    socket.on("player-unready",function(id_user){
        dico_user[id_user]["ready"] = false;
        nb_player_ready--;
        info_before_party();
    })

    //quand un joueur se co
    socket.on("player-connect",function(user_data){
        dico_user[user_data[0]] = {"ready":false};
        dico_user[user_data[0]] = {"pseudo":user_data[1]};
        dico_speudo[user_data[1]] = user_data[0];//peut être degager sans bug
        info_before_party();
    })

    socket.on("disconnect",function(){
        //quand un joueur se déco 
    })

    socket.on("clientDisconnecting",function(id_user){
        //quand un joueur se déco (il donne son ID avant de partir)
        console.log("id user qui de deco :" + id_user);
        console.log("tentative de deco :" + delete dico_user[id_user]);
        for(let id in dico_speudo)//peut être degager sans bug
        {
            if(id == id_user)
            {
                delete dico_speudo[id];
            }
        }
        
        info_before_party();
    })

    /* 
    fait gaffe un socket.emit au lieu de io.emit envera l'utilisateur actuel
    */

})


http.listen(3000,function(){
    console.log("serveur running on port 3000 ")
})

