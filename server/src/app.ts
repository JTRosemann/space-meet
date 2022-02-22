/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.

    Usage : node app.js
*/

const dir = '/home/julian/projects/space-meet'; // de-hardcode this!

const gameport        = 4004;

import * as io from 'socket.io';
import express        = require('express');
const  verbose        = true;
import https          = require('https');
import fs             = require('fs');
const privateKey      = fs.readFileSync('key.pem', 'utf8');
const certificate     = fs.readFileSync('cert.pem', 'utf8');
const app             = express();
const sserver         = https.createServer({key:privateKey, cert: certificate}, app);

//FIXME: CORS request error (in Chrome), maybe this way: https://daveceddia.com/access-control-allow-origin-cors-errors-in-react-express/
/* Express server set up. */

//The express server handles passing our content to the browser,
//As well as routing users where they need to go. This example is bare bones
//and will serve any file the user requests from the root of your web server (where you launch the script from)
//so keep this in mind - this is not a production script but a development teaching tool.

//Log something so we know that it succeeded.
console.log('\t :: Express :: Listening on port ' + gameport );

//By default, we forward the / path to index.html automatically.
/*app.get( '/', function( _req:any, res:any ){
    const path = 'index.html';
    console.log('trying to load %s', path);
    res.sendfile( path , { root:dir });
});*/

//This handler will listen for requests on /*, any file from the root of our server.
//See expressjs documentation for more info on routing.
/*app.get( '/*' , function( req:{params: string}, res:any, _next:any ) {
    //This is the current file they have requested
    const file = req.params[0];
    //For debugging, we can track what files are requested.
    if(verbose) console.log('\t :: Express :: file requested : ' + file);
    //Send the requesting client the file.
    res.sendfile( dir + '/' + file );
    }); //app.get **/


app.use(express.static('client/dist'));


//Tell the server to listen for incoming connections
sserver.listen(gameport);

 // This mirrors it on an accessible server
/*import ngrok = require('ngrok');
(async function () {
    const url = await ngrok.connect(gameport);
})();
*/

/* Socket.IO server set up. */

//Express and socket.io can work together to serve the socket.io client files for you.
//This way, when the client requests '/socket.io/' files, socket.io determines what the client needs.

//Create a socket.io instance using our express server
const sio = new io.Server(sserver);

//Configure the socket.io connection settings.
//See http://socket.io/

sio.use(function(socket, next) {
    const handshakeData = socket.request;
    next();
});

//sio.set('log level', 0); <-- by executing DEBUG=socket.io:* node ...

//Enter the game server code. The game server handles
//client connections looking for a game, creating games,
//leaving games, joining games and ending games when they leave.
import { LobbyServer } from "./LobbyServer";

//Socket.io will call this function when a client connects,
//So we can send that client looking for a game to play,
//as well as give that client a unique ID to use so we can
//maintain the list of players.

const lobby_server = new LobbyServer(sio);
// .sockets selects every client
sio.sockets.on('connection', lobby_server.on_connection.bind(lobby_server));
