/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.

    Usage : node app.js
*/

const dir = '/home/jt/projects/space-meet'; // de-hardcode this!

const gameport        = process.env.PORT || '4004';

import io             = require('socket.io');
import express        = require('express');
import UUID           = require('node-uuid');

const  verbose        = true;
import http           = require('http');
const app             = express();
const server          = http.createServer(app);

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


app.use(express.static('./client/dist'));


//Tell the server to listen for incoming connections
server.listen(gameport)

/* This mirrors it on an accessible server
const ngrok = require('ngrok');
(async function () {
    const url = await ngrok.connect(4004);
})();
*/

/* Socket.IO server set up. */

//Express and socket.io can work together to serve the socket.io client files for you.
//This way, when the client requests '/socket.io/' files, socket.io determines what the client needs.

//Create a socket.io instance using our express server
const sio = io.listen(server);

//Configure the socket.io connection settings.
//See http://socket.io/
sio.configure(function (){

    sio.set('log level', 0);

    sio.set('authorization', function (_handshakeData:any, callback:any) {
        callback(null, true); // error first callback style
    });

});

//Enter the game server code. The game server handles
//client connections looking for a game, creating games,
//leaving games, joining games and ending games when they leave.
import { Server } from './game.server';

//Socket.io will call this function when a client connects,
//So we can send that client looking for a game to play,
//as well as give that client a unique ID to use so we can
//maintain the list of players.
type client_type = {
    userid:string,
    emit: (x:string,y:any) => unknown,
    on: (x:string, y: (m:any) => unknown) => unknown,
    game: any,
    game_id: string
}

const game_server = new Server();
// .sockets selects every client
sio.sockets.on('connection', function (client : client_type) {
    //Generate a new UUID, looks something like
    //5b2ca132-64bd-4513-99da-90e838ca47d1
    //and store this on their socket/connection
    client.userid = UUID();

    //tell the player they connected, giving them their id
    client.emit('onconnected', { id: client.userid } );

    //now we can find them a game to play with someone.
    //if no game exists with someone waiting, they create one and wait.
    game_server.findGame(client);

    //Useful to know when someone connects
    console.log('\t socket.io:: player ' + client.userid + ' connected');


    //Now we want to handle some of the messages that clients will send.
    //They send messages here, and we send them to the game_server to handle.
    client.on('message', function(m) {//FIXME: don't use 'message' & send

        game_server.onMessage(client, m);

    }); //client.on message

    //When this client disconnects, we want to tell the game server
    //about that as well, so it can remove them from the game they are
    //in, and make sure the other player knows that they left and so on.
    client.on('disconnect', function () {

        //Useful to know when soomeone disconnects
        console.log('\t socket.io:: client disconnected ' + client.userid + ' ' + client.game_id);

        //If the client was in a game, set by game_server.findGame,
        //we can tell the game server to update that game state.
        if(client.game && client.game.id) {

            //player leaving a game should destroy that game
            game_server.disconnect(client.game.id, client.userid);

        } //client.game_id

    }); //client.on disconnect

    client.on('on_update_cid', (client.game.gamecore.server_on_update_cid(client.userid)).bind(client.game.gamecore));
    //    client.on('on_update_cid', function (data) { console.log('cid_called' + client.userid)});

}); //sio.sockets.on connection
