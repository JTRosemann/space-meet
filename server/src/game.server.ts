/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/
type Client = any;

import * as UUID from 'uuid';

export class Server {
    game = {gamecore: null, id: UUID.v4, clients: [], active: false};
    //A simple wrapper for logging so we can toggle it,
    //and augment it for clarity.
    log () {
        if(verbose) console.log.apply(this,arguments);
    };

    fake_latency = 0;
    local_time = 0;
    _dt = new Date().getTime();
    _dte = new Date().getTime();
    //a local queue of messages we delay if faking latency
    messages = [];
    running_id: number;

    onMessage(client,message: string) {
        console.log('Use of DEPRECATED MESSAGE FORMAT');

        if(this.fake_latency && message.split('.')[0].substr(0,1) == 'i') {

            //store all input message
            this.messages.push({client:client, message:message});

            setTimeout(function(){
                if(this.messages.length) {
                    this._onMessage( this.messages[0].client, this.messages[0].message );
                    this.messages.splice(0,1);
                }
            }.bind(this), this.fake_latency);

        } else {
            this._onMessage(client, message);
        }
    };

    _onMessage(client,message: string) {
    
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
    }; //onMessage

    onInput(client, parts) {
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

    }; //onInput

    //we are requesting to kill a game in progress.
    disconnect(gameid, userid) {
        if(this.game) {
            this.game.gamecore.rm_player(userid);
        } else {
            console.log('that game was not found!');
        }
    }; //disconnect


    findGame(client: Client) {
        console.log('looking for a game.');
        if (!this.game.gamecore) {
            this.game.gamecore = new GameServer();
            this.game.gamecore.update( new Date().getTime() );// starts the update loop
        }
        this.running_id++;
        this.game.gamecore.push_client(client, running_id); //clients are pushed to the client list
        const data = {
        game: this.game.gamecore.get_game_state(),
        time: this.game.gamecore.local_time
        };
        client.emit('onjoingame', data);
        client.game = this.game;
        this.game.active = true;    //set this flag, so that the update loop can run it.
    }; //findGame

}

//const game_server = module.exports = Server;
//const UUID        = require('node-uuid');
const verbose     = true;
let running_id    = 0;

//Since we are sharing code with the browser, we
//are going to include some values to handle that.
//global.window = global.document = global;

//Import shared game library code.
//require('./game.core.js');

import {
    State,
    Game,
    AllInputObj,
    apply_mvmnt,
    InputObj,
    PlayerServer,
    Socket,
    vec
} from '../../common/src/game.core';



class GameServer extends Game {
    static update_loop = 45;//ms
    players: PlayerServer[] = [];
    server_time = 0;
    laststate: AllInputObj;

    constructor() {
        super();
        this.create_update_loop();
    }

    notify(listener, msg) {
        for (const p of this.players) {
            p.instance.emit(listener, msg);
        }
    }

    rm_player(id) {
        this.players = this.players.filter(p => p.id !== id);
        this.notify('on_rm_player', id);
    }

    push_client(client: Socket, r_id: number) {
        r_id = r_id || 1;
        const start_state : State = new State(new vec( r_id * 40, 50 ), 0);
        const p = new PlayerServer(start_state, client.userid, '' /* call_id */, client);//Beware: id != userid
        this.push_player(p);
        this.notify('on_push_player', {id: client.userid, call_id: '', state: start_state});//FIXME I shouldn't send the class state
    } // push_client

    server_on_update_cid(u_id) {
        return function(data) {
            console.log('update cid');
            for (const p of this.players) {
                if (p.id == u_id) {
                    p.call_id = data;
                } else {
                    const msg = {id: u_id, call_id: data};
                    p.instance.emit('on_update_cid', msg);
                }
            }
        }
    }

    create_update_loop() {

        setInterval(function(){
            this.do_update();
        }.bind(this), GameServer.update_loop);

    } //game_core.client_create_physics_simulation

    //Makes sure things run smoothly and notifies clients of changes
    //on the server side
    do_update() {
        //Update the state of our local clock to match the timer
        this.server_time = this.local_time;

        //Make a snapshot of the current state, for updating the clients
        const p_s : Record<string,InputObj> = {};
        for (const p of this.players) {
            p_s[p.id] = p.get_input_obj();
        }
        this.laststate = {
            players: p_s,
            t: this.server_time                      // our current local time on the server
        };

        //Send the snapshot to the 'host' player
        for (const p of this.players) {
            p.instance.emit( 'onserverupdate', this.laststate );
        }
    } //game_core.server_update

    //Updated at 15ms , simulates the world state
    update_physics() {
        for (const p of this.players) {

            const mvmnt = p.process_inputs();
            p.state = apply_mvmnt( p.state, mvmnt );

            //Keep the physics position in the world
            p.state = this.world.confine(p);
            //this.check_collision( p );
            p.inputs = []; //we have cleared the input buffer, so remove this
        }
    }; //game_core.server_update_physics

    handle_server_input(client: Socket, input: string[], input_time: number, input_seq: number) {
        for (const p of this.players) {
            if (client.userid == p.id) {
                //Store the input on the player instance for processing in the physics loop
                p.inputs.push({keys:input, time:input_time, seq:input_seq});
                return;
            }
        }
    }; //game_core.handle_server_input

}

/*

setInterval(function(){
    this._dt = new Date().getTime() - this._dte;
    this._dte = new Date().getTime();
    this.local_time += this._dt/1000.0;
}, 4);
*/
