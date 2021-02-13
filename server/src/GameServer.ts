/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

import * as UUID from 'uuid';
import * as sio from 'socket.io';

import {
    CarrierServer, 
    PushPlayerData,
    RmPlayerData,
    ServerUpdateData,
    DisconnectData,
    SingleUpdateCidData,
    InputData
} from '../../common/src/protocol';

//const game_server = module.exports = Server;
//const UUID        = require('node-uuid');
//Since we are sharing code with the browser, we
//are going to include some values to handle that.
//global.window = global.document = global;

//Import shared game library code.
//require('./game.core.js');

import {
    State,
    apply_mvmnt,
    InputObj
} from '../../common/src/game.core';
import { PlayerServer } from './PlayerServer';
import { Simulator } from '../../common/src/Simulator';
import { vec } from '../../common/src/vec';
import { Game } from '../../common/src/Game';


export class SimulatorServer extends Simulator  {
    static update_loop = 45;//ms
    players: PlayerServer[] = [];
    server_time = 0;
    laststate: ServerUpdateData;
    carrier: CarrierServer;
    active = false;

    constructor(game: Game, carrier: CarrierServer) {
        super(game);
        this.carrier = carrier;
        this.create_update_loop();
    }

    on_disconnect(client: sio.Socket, data: DisconnectData) {
        //Useful to know when soomeone disconnects
        console.log('\t socket.io:: client disconnected ' + client.id + ' ' + this.id);
        //When this client disconnects, we want to tell the game server
        //about that as well, so it can remove them from the game they are
        //in, and make sure the other player knows that they left and so on.
        this.rm_player(client.id);
    }

    on_input(client: sio.Socket, data: InputData) {
        this.handle_server_input(client, data.keys, data.time, data.seq);
    }    

    notify_push(msg: PushPlayerData) {
        for (const p of this.players) {
            this.carrier.emit_pushplayer(p.instance, msg);
        }
    }

    notify_rm(msg: RmPlayerData) {
        for (const p of this.players) {
            this.carrier.emit_rmplayer(p.instance, msg);
        }
    }

    rm_player(id: string) {
        this.players = this.players.filter(p => p.id !== id);
        this.notify_rm(id);
    }

    push_client(client: sio.Socket, r_id: number = 1) {
        const start_state : State = new State(new vec( r_id * 40, 50 ), 0);
        const p = new PlayerServer(start_state, client.id, '' /* call_id */, client);//Beware: id != userid
        this.push_player(p);
        this.notify_push({id: client.id, call_id: '', state: start_state.downsize()});//FIXME I shouldn't send the class state
    } // push_client

    on_update_cid(client: sio.Socket, data: SingleUpdateCidData) {
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
        }.bind(this), SimulatorServer.update_loop);

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
            t: this.server_time// our current local time on the server
        };

        //Send the snapshot to the 'host' player
        for (const p of this.players) {
            this.carrier.emit_update(p.instance, this.laststate);
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
