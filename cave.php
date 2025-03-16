<!-- client -->
<script>
    function generateId() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

//http://localhost:3000
var socket = io(monID);
var monID = generateId();

var send = function(){
    var text = document.getElementById("tes_input").value;
    //je l'ai apeller 
    socket.emit("chat message",text)
}

var receive = function(msg){
    document.getElementById("res_serv_1").innerHTML += "<br>"+msg;
}

//update le nombre de joueur connecter
var receive_info_serv_nb_joueur_co = function(msg){
    document.getElementById("nb_persone_connecter").innerHTML = msg;
}

//update le nombre de joueur pret a joueur
var receive_info_serv_nb_joueur_ready = function(msg){
    document.getElementById("nb_joueur_ready").innerHTML = msg;
}

var start_game = function(msg){
    document.getElementById("tes").innerHTML = msg;
}


socket.on("chat message",receive);
socket.on("chat message privet",receive);

socket.on("serveur_nb_joueur_co",receive_info_serv_nb_joueur_co);
socket.on("serveur_info_player_ready",receive_info_serv_nb_joueur_ready);

socket.on("stat party",start_game);


function ready()
{
    socket.emit("joueur ready",monID);
}

// Écoutez l'événement beforeunload pour envoyer un message avant de fermer la page
window.addEventListener('beforeunload', function (e) {
    // Envoyer l'information de déconnexion au serveur
    socket.emit('clientDisconnecting', monID);
});


// Création d'un objet "Personne" avec des propriétés et une méthode
const Joueur = 
{
    // Propriétés
    pseudo: "guest"+monID,
    munition:0,
    effet:{},
  
    // Méthode pour afficher les détails de la personne
    get_info: function()
    {
        return [this.pseudo,this.munition,this.effet,];
    },
  
    // Méthode pour changer la profession
    update_info: function(update) 
    {
        //verif update pour extraire la misa a jour de ton jeu
    },

    
};

</script>

<!-- serveur -->
<script>
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


/* 
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);



app.get("/",function(req,res){
    //res.sendFile(__dirname+"/script.js");//sa te fait tel index.php c bon pour toi
    res.sendFile(__dirname+"/index.html");//sa te fait tel index.php c bon pour toi
})  */



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



var nb_number_client_connected = 0;
var lst_user = [];



io.on('connection',function(socket){

    function update_player_reday()
    {
        io.emit("serveur_info_player_ready",lst_user.length);
        console.log(lst_user.length+"/"+nb_number_client_connected+" <= ready/connecter");
        if(lst_user.length == nb_number_client_connected /* && lst_user.length >= 2 */)
        {
            io.emit("stat party",lst_user);//par contre sa envoie a tt le monde
        }
    }

    nb_number_client_connected++;
    io.emit("serveur_nb_joueur_co",nb_number_client_connected);//par contre sa envoie a tt le monde
    console.log("user connecting");

    
    socket.on("chat message",function(msg){
        console.log("a message recived : "+msg);
        if(msg=="hitler")
        {
            io.emit("chat message privet","les message du reich ne sont pas a partager :  "+msg);
        }
        else
        {
            io.emit("chat message",msg);
        }
    })
    
    socket.on("disconnect",function(){
        console.log("user disconnected");
        nb_number_client_connected--;
        io.emit("serveur_nb_joueur_co",nb_number_client_connected);
        //faut faire un call a tt le modne voire c qui qui repond pas :/
    })

    socket.on("clientDisconnecting",function(id_user){
        console.log("clientDisconnectingd");
        lst_user = lst_user.filter(user => user !== id_user);
        update_player_reday();
        //faut faire un call a tt le modne voire c qui qui repond pas :/
    })

    socket.on("joueur ready",function(id_user){
        console.log(" user "+id_user+" est ready ");
        if(!lst_user.includes(id_user))
        {
            lst_user.push(id_user);
        }
        update_player_reday();
    })

})


http.listen(3000,function(){
    console.log("serveur running on port 3000 ")
})


let keys = Object.keys(dico_user).slice(0, nb_player_for_party);//faut prendre les X premier mais de ceux ready
        var idNewParty = generateId();
        dico_party[idNewParty] = {};
        // Copier les trois premiers éléments dans une nouvelle variable
        keys.forEach(key => {
            dico_party[idNewParty][key] = dico_user[key];
        delete dico_user[key]; // Supprimer les éléments copiés de l'original
        });


</script>