//http://localhost:3000

/* 
list of route :
-player-ready (emit)=> send ID to server(for show we are ready to party)
-player-unready (emit)=> send ID to server(for show we are not ready to party)
-private-player-gate=+monID (received) => any server info particulary to you
-clientDisconnecting (emit) => send his ID when se page close
-player-connect (emit) => send ID to server (first connexion)
-info-before-party(received) => took the number of client connected
-
-
-
-
-
-
-
*/



//var global
var socket = io(monID);
var monID = generateId();
console.log("tunelle d'observation => "+"private-player-gate="+monID);
var idParty = 0;
//var idParty = 444;
var player_ready = false;
var pseudo = "guest";



function generateId() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

function enter_website()
{
    document.getElementById("focus_check").style.display = "none";
    document.getElementById("join_game_container").style.display = "block";
    pseudo = document.getElementById("speudo_input").value;
    socket.emit("player-connect", [monID,pseudo]);
}

/* 
=====EXEMPLE=========
var exemple = function(){
    socket.emit("chat message",text)
}

socket.on("stat party",exemple);
======================
private-player-gate=id-lyhhwu69-mqe0l5zeu
private-player-gate=party-lyhhxkdl-o0zfwpmyn
private-player-gate=id-lyhhwvy8-smb131p96
private-player-gate=id-lyhhwxsu-p2n2fpgje
*/


function ready_unready()
{
    
    if(player_ready)//if player already ready
    {
        socket.emit("player-unready",monID);//unready it
        document.getElementById("butt_participer").innerHTML="play";
        player_ready = false;
    }
    else//if player not ready
    {
        socket.emit("player-ready",monID);//ready it
        document.getElementById("butt_participer").innerHTML="quit";
        player_ready = true;
    }
}



var player = function(data)
{
    //["party-choice",dico_party[idNewParty][key],dico_party[idNewParty]["game_info"]  ]

    switch (data[0]) 
    {
        case "join-party":
            idParty = data[1];
            //["join-party",idNewParty,dico_party[idNewParty]]
            console.log("je suis dans une game");
            console.table(data);
            
            document.getElementById("join_game_container").style.display = "none";             
            document.getElementById("show_in_game").style.display = "block";             
            document.getElementById("id_game").innerHTML = data[1];    
            for(let key in data[2])
            {
                switch (key) 
                {
                    case "game_info":
                        break;
                        
                    default:
                        document.getElementById("list_players_in_game").innerHTML += "<li>"+ key+ "</li>";                        
                        break;
                }
            }
                        
            break;
        
        case "party-choice":
            //  io.emit("private-player-gate="+key,["party-choice",dico_party[idNewParty][key],dico_party[idNewParty]["game_info"]  ]);
            //  dico_party[idNewParty][key]["possible-choice"][action_name] =  lst_action[action_name];

            //afficher les choix que je peux faire et l'etat actuel de mon perso
                       
            document.getElementById("choice_action").style.display = "block";   

            for(let action_name in data[1]["possible-choice"])
            {
                document.getElementById("choice").innerHTML += '<option value="'+action_name+'">'+action_name+'</option>';     
                
            }
                
            /*
                il faut trouver un moyen de mettre le premeir en selected
                il faut afficher les information du joueur
            */
           

            break;
    
        default:
            console.log("le message n'est pas connu : "+data[0]);
            break;
    }
    
}

var show_info_before_party = function(lst_dicoUser_required)//[dico_user,nb_player_for_party]
{
    if(!idParty)
    {
        console.log("recu : ");
        console.table(lst_dicoUser_required[0]);
        console.log(lst_dicoUser_required[1]);
        document.getElementById("nb_joueur_requis").innerHTML = lst_dicoUser_required[1];
        //Object.keys(lst_user).length;
        let countplayerReady = 0;
        
        for (let key in lst_dicoUser_required[0]) {
            if (lst_dicoUser_required[0][key]["ready"] === true) {
                countplayerReady++;
            }
        }
        document.getElementById("nb_joueur_ready").innerHTML = countplayerReady;
        document.getElementById("nb_persone_connecter").innerHTML = Object.keys(lst_dicoUser_required[0]).length;
        //nb_joueur_ready
        //nb_persone_connecter
        //nb_joueur_requis
    }

}

socket.on("private-player-gate="+monID,player);
socket.on("info-before-party",show_info_before_party);//[dico_user,nb_player_for_party]



// Écoutez l'événement beforeunload pour envoyer un message avant de fermer la page
window.addEventListener('beforeunload', function (e) {
    // Envoyer l'information de déconnexion au serveur
    socket.emit('clientDisconnecting', monID);
});

/*
bon probleme sa apelle sa des que le lien de la page 
est dans la barre de recherche
et sa renvoie une deuxieme fois quand 
on valide l'URL créant 2 user au lieu d'un seul
*/
