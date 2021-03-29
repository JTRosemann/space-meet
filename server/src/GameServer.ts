/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

import * as sio from 'socket.io';

import {
    CarrierServer, 
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

import { Simulator } from '../../common/src/Simulator';
import { vec } from '../../common/src/vec';
import { Game } from '../../common/src/Game';
import * as io from 'socket.io';
import { InputPlayer } from '../../common/src/InputPlayer';
import { Conference } from '../../common/src/Conference';
import { State } from '../../common/src/State';

export class SimulatorServer {
    static update_loop = 45;//ms
    //static update_loop = 500;//ms DEBUGGING
    sim: Simulator;
    carrier: CarrierServer;
    server: io.Server;
    conf: Conference;
    update_loop_interval: NodeJS.Timeout;

    constructor(game: Game, carrier: CarrierServer, sio: io.Server) {
        this.sim = new Simulator(game);// starts timer & update_physics loop
        this.carrier = carrier;
        this.server = sio;
        this.conf = new Conference(game.id);
        this.create_update_loop();
    }

    rm_client(client: sio.Socket) {
        //Useful to know when soomeone disconnects
        console.log('\t socket.io:: client disconnected ' + client.id + ' ' + this.sim.game.id);
        //When this client disconnects, we want to tell the game server
        //about that as well, so it can remove from the game they are
        //in, and make sure the other player knows that they left and so on.
        this.sim.rm_player(client.id);
    }
    
    on_input(client: sio.Socket, data: InputData) {
        const input = data.keys;
        const input_time = data.time;
        for (const p of this.sim.get_players()) {
            if (client.id == p.id) {
                //Store the input on the player instance for processing in the physics loop
                // here we know simulator contains players, still ugly
                (p as InputPlayer).push_input({keys:input, time:input_time});
                return;
            }
        }
    }

    push_client(client: sio.Socket, r_id: number = 1) {
        const start_state : State = new State(new vec( r_id * 40, 50 ), 0);
        const p = new InputPlayer(client.id, this.sim.game, this.sim.game.std_mv_speed, this.sim.game.std_trn_speed);//Beware: id != userid
        this.sim.put_player(p, start_state, this.sim.game.std_rad);
        this.conf.call_ids[client.id] = '';
    } // push_client

    on_update_cid(client: sio.Socket, data: SingleUpdateCidData) {
        console.log('update cid');
        this.conf.call_ids[client.id] = data;
    }

    //Makes sure things run smoothly and notifies clients of changes
    //on the server side
    do_update() {
        //Update the state of our local clock to match the timer
        const server_time = this.sim.local_time;
        const items = this.sim.game.get_items();
        //Make a snapshot of the current state, for updating the clients
        const data = {
            game: this.sim.game,
            time: server_time,
            conf: this.conf
        }
        this.carrier.emit_update(this.server, data);
    } //game_core.server_update

    create_update_loop() {
        this.update_loop_interval
         = setInterval(this.do_update.bind(this), SimulatorServer.update_loop);
    } //game_core.client_create_physics_simulation


}