/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

import * as UUID from 'uuid';
import * as sio from 'socket.io';

import {
    CarrierServer, 
    PushPlayerData,
    ResponderServer,
    RmPlayerData,
    ServerUpdateData,
    UpdateCidData,
    DisconnectData
} from '../../common/src/protocol';

export class LobbyServer implements ResponderServer {
    gamecore : GameServer;
    id = UUID.v4();
    carrier: CarrierServer = new CarrierServer();
    running_id: number = 0;

    constructor() {
        this.carrier = new CarrierServer();
        this.gamecore = new GameServer(this.carrier);
        console.log('start game ' + this.gamecore.id);
        this.gamecore.update( new Date().getTime() );// starts the update loop
    }

    //TODO fix debugging stuff
    fake_latency = 0;
    local_time = 0;
    _dt = new Date().getTime();
    _dte = new Date().getTime();
    //a local queue of messages we delay if faking latency
    messages : {client: sio.Socket, message:string}[] = [];

    on_connection(client: sio.Socket) {
        //Useful to know when someone connects
        console.log('\t socket.io:: player ' + client.id + ' connected');
        this.gamecore.push_client(client, this.running_id);
        this.running_id++;

        //tell the player they connected, giving them their id
        this.carrier.init_socket(client, this);
        this.carrier.emit_connected(client, { id: client.id } );//TODO remove this id probably
        console.log('looking for a game.');
        const data = {
            game: this.gamecore.get_game_state(),
            time: this.gamecore.local_time
        };
        this.carrier.emit_joingame(client, data);
        this.gamecore.active = true;    //set this flag, so that the update loop can run it.
    }

    on_update_cid(client: sio.Socket, data: UpdateCidData) {
        this.gamecore.on_update_cid(client, data);
    }

    on_input(client: sio.Socket, data: ServerUpdateData) {
        this.gamecore.on_input(client, data);
    }

    on_disconnect(client: sio.Socket, data: DisconnectData) {
        this.gamecore.on_disconnect(client, data); 
    }
    
    onMessage(client: sio.Socket, message: string) {
        console.log('Use of DEPRECATED MESSAGE FORMAT');
        //TODO fix debugging code
        if(this.fake_latency && message.split('.')[0].substr(0,1) == 'i') {

            //store all input message
            this.messages.push({client:client, message:message});

            setTimeout(function(){
                if(this.messages.length) {
                    this.gamecore.onMessage( this.messages[0].client, this.messages[0].message );
                    this.messages.splice(0,1);
                }
            }.bind(this), this.fake_latency);

        } else {
            this.gamecore.onMessage(client, message);
        }
    }

}

//const game_server = module.exports = Server;
//const UUID        = require('node-uuid');
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
    Player,
    vec,
    get_input_obj,
    Input,
    InputProcessor,
    process_inputs,
    Mvmnt
} from '../../common/src/game.core';


export class PlayerServer extends Player implements InputProcessor {
    last_input_seq: number;
    last_input_time: number;
    inputs: Input[] = [];
    instance: sio.Socket;

    constructor(state: State, id: string, call_id: string, socket: sio.Socket) {
        super(state, id, call_id);
        this.instance = socket;
    }

    get_input_obj() {
        return get_input_obj(this.state, this.last_input_seq);
    }

    process_inputs() : Mvmnt {
        return process_inputs(this, this.state.dir);
    }
}

class GameServer extends Game  {
    static update_loop = 45;//ms
    players: PlayerServer[] = [];
    server_time = 0;
    laststate: AllInputObj;
    carrier: CarrierServer;
    active = false;

    constructor(carrier: CarrierServer) {
        super(UUID.v4());
        this.carrier = carrier;
        this.create_update_loop();
    }

    onMessage(client: sio.Socket, message: string) {
        //Cut the message up into sub components
        const message_parts = message.split('.');
        //The first is always the type of message
        const message_type = message_parts[0];

        if(message_type == 'i') {
            //Input handler will forward this
            this.onInput(client, message_parts);
        } else if(message_type == 'p') {
            this.carrier.emit_message(client, 's.p.' + message_parts[1]);
        } else if(message_type == 'c') {    //Client changed their color!
            for (let other_c of this.players) {
                // JS bs
                //if (!client.game.players.hasOwnProperty(other_c)) continue;
                if (other_c.id != client.id) {
                    this.carrier.emit_message(other_c.instance, 's.c.' + client.id + '.' + message_parts[1]);
                }
            }
        } 
    }

    onInput(client: sio.Socket, parts: string[]) {
        //TODO: remove
        //The input commands come in like u-l,
        //so we split them up into separate commands,
        //and then update the players
        var input_commands = parts[1].split('-');
        var input_time = Number(parts[2].replace('-','.'));
        var input_seq = Number(parts[3]);

        //the client should be in a game, so
        //we can tell that game to handle the input
        if(client && this) {
            this.handle_server_input(client, input_commands, input_time, input_seq);
        }

    }; //onInput

    on_disconnect(client: sio.Socket, data: DisconnectData) {
        //Useful to know when soomeone disconnects
        console.log('\t socket.io:: client disconnected ' + client.id + ' ' + this.id);
        //When this client disconnects, we want to tell the game server
        //about that as well, so it can remove them from the game they are
        //in, and make sure the other player knows that they left and so on.
        this.rm_player(client.id);
    }

    on_input(client: sio.Socket, data: ServerUpdateData) {
        throw new Error('Method not implemented.');
    }    

    notify(listener: 'on_rm_player' | 'on_push_player',
            msg: RmPlayerData | PushPlayerData) {
        for (const p of this.players) {
            switch (listener) {
                case 'on_rm_player':
                    this.carrier.emit_rmplayer(p.instance, msg);
                    break;
                case 'on_push_player':
                    this.carrier.emit_pushplayer(p.instance, msg);
                    break;
            }
        }
    }

    rm_player(id: string) {
        this.players = this.players.filter(p => p.id !== id);
        this.notify('on_rm_player', id);
    }

    push_client(client: sio.Socket, r_id: number = 1) {
        const start_state : State = new State(new vec( r_id * 40, 50 ), 0);
        const p = new PlayerServer(start_state, client.id, '' /* call_id */, client);//Beware: id != userid
        this.push_player(p);
        this.notify('on_push_player', {id: client.id, call_id: '', state: start_state});//FIXME I shouldn't send the class state
    } // push_client

    on_update_cid(client: sio.Socket, data: UpdateCidData) {
        console.log('update cid');
        for (const p of this.players) {
            if (p.id == client.id) {
                p.call_id = data;
            } else {
                const msg = {id: client.id, call_id: data};
                this.carrier.emit_updatecid(p.instance, msg);
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
            this.carrier.emit_update(p.instance, this.laststate );
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

    handle_server_input(client: sio.Socket, input: string[], input_time: number, input_seq: number) {
        for (const p of this.players) {
            if (client.id == p.id) {
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
