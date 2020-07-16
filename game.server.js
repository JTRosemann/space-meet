/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    written by : http://underscorediscovery.ca
    written for : http://buildnewgames.com/real-time-multiplayer/

    MIT Licensed.
*/

const game_server = module.exports = { games : {} };
const UUID        = require('node-uuid');
const verbose     = true;
let running_id    = 0;

//Since we are sharing code with the browser, we
//are going to include some values to handle that.
global.window = global.document = global;

//Import shared game library code.
require('./game.core.js');

//A simple wrapper for logging so we can toggle it,
//and augment it for clarity.
game_server.log = function() {
    if(verbose) console.log.apply(this,arguments);
};

game_server.fake_latency = 0;
game_server.local_time = 0;
game_server._dt = new Date().getTime();
game_server._dte = new Date().getTime();
//a local queue of messages we delay if faking latency
game_server.messages = [];

setInterval(function(){
    game_server._dt = new Date().getTime() - game_server._dte;
    game_server._dte = new Date().getTime();
    game_server.local_time += game_server._dt/1000.0;
}, 4);

game_server.onMessage = function(client,message) {

    if(this.fake_latency && message.split('.')[0].substr(0,1) == 'i') {

        //store all input message
        game_server.messages.push({client:client, message:message});

        setTimeout(function(){
            if(game_server.messages.length) {
                game_server._onMessage( game_server.messages[0].client, game_server.messages[0].message );
                game_server.messages.splice(0,1);
            }
        }.bind(this), this.fake_latency);

    } else {
        game_server._onMessage(client, message);
    }
};

game_server._onMessage = function(client,message) {

    //Cut the message up into sub components
    const message_parts = message.split('.');
    //The first is always the type of message
    const message_type = message_parts[0];

    if(message_type == 'i') {
        //Input handler will forward this
        this.onInput(client, message_parts);
    } else if(message_type == 'p') {
        client.send('s.p.' + message_parts[1]);
    } else if(message_type == 'c') {    //Client changed their color!
	for (let other_c in client.game.players) {
	    // JS bs
	    if (!client.game.players.hasOwnProperty(other_c)) continue;
	    if (other_c.id != client.userid) {
		other_c.send('s.c.' + client.userid + '.' + message_parts[1]);
	    }
	}
    } else if(message_type == 'l') {    //A client is asking for lag simulation
        this.fake_latency = parseFloat(message_parts[1]);
    }
}; //game_server.onMessage

game_server.onInput = function(client, parts) {
    //The input commands come in like u-l,
    //so we split them up into separate commands,
    //and then update the players
    var input_commands = parts[1].split('-');
    var input_time = parts[2].replace('-','.');
    var input_seq = parts[3];

    //the client should be in a game, so
    //we can tell that game to handle the input
    if(client && client.game && client.game.gamecore) {
        client.game.gamecore.handle_server_input(client, input_commands, input_time, input_seq);
    }

}; //game_server.onInput

//we are requesting to kill a game in progress.
game_server.disconnect = function(gameid, userid) {
    if(this.game) {
	this.game.gamecore.rm_player(userid);
    } else {
        this.log('that game was not found!');
    }
}; //game_server.disconnect

game_server.findGame = function(client) {
    this.log('looking for a game.');
    if(!this.game) {
	this.game = {
	    id : UUID(),
	    clients: []
	};
	this.game.gamecore = new game_core( this.game );
	this.game.gamecore.update( new Date().getTime() );// starts the update loop
    }
    running_id++;
    this.game.gamecore.push_client(client, running_id); //clients are pushed to the client list
    const data = {
	game: this.game.gamecore.get_game_state(),
	time: this.game.gamecore.local_time
    };
    client.emit('onjoingame', data);
    client.game = this.game;
    this.game.active = true;    //set this flag, so that the update loop can run it.
}; //game_server.findGame
