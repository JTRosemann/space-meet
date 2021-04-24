/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

import * as sio from 'socket.io';

import {
    CarrierServer, 
    CidData,
    InputData
} from '../../common/src/protocol';

//const game_server = module.exports = Server;
//const UUID        = require('node-uuid');
//Since we are sharing code with the browser, we
//are going to include some values to handle that.
//global.window = global.document = global;

//Import shared game library code.
//require('./game.core.js');

import * as io from 'socket.io';
import { Snap } from '../../common/src/Snap';
import { Conference } from '../../common/src/Conference';
import { InterpretedInput } from '../../common/src/InterpretedInput';
import { ServerSimulation } from './ServerSimulation';

export class SimulatorServer<S> {
    //static update_loop = 500;//ms DEBUGGING
    private sim: ServerSimulation<S>;
    private carrier: CarrierServer<S>;
    private server: io.Server;
    private conf: Conference;
    private id: string;
    private update_loop_interval: NodeJS.Timeout;

    constructor(init_snap: Snap<S>, id: string, carrier: CarrierServer<S>, sio: io.Server) {
        this.sim = new ServerSimulation(init_snap);// starts timer & update_physics loop
        this.id = id;
        this.carrier = carrier;
        this.server = sio;
        this.conf = new Conference(id);
    }

    /**
     * Remove client from simulation.
     * @param client to be removed
     */
    rm_client(client: sio.Socket) {
        //Useful to know when soomeone disconnects
        console.log('\t socket.io:: client disconnected ' + client.id + ' ' + this.id);
        //When this client disconnects, we want to tell the game server
        //about that as well, so it can remove from the game they are
        //in, and make sure the other player knows that they left and so on.
        this.sim.rm_player(client.id);
    }
    
    /**
     * Update the simulation according to the input `i_input` at server_time `time` for client `client`.
     * @param client who made the input
     * @param i_input input to process
     * @param time server_time when the client made the input
     */
    on_input(client: sio.Socket, i_input: InterpretedInput<S>, time: number) {
        const p_id = client.id;
        const p_state = this.sim.get_last_fixed_player_state_before(p_id, time);
        const new_state = i_input.apply_to(p_state);
        this.sim.push_update(p_id, new_state, time);
    }

    /**
     * Add a client player at the corresponding time and set its call_id to ''.
     * @param client to be added
     * @param time server_time when to add
     */
    push_client(client: sio.Socket, time: number) {
        const p_id = client.id;
        this.sim.add_player(p_id, time);
        this.conf.set_cid(p_id, '');
    }

    /**
     * Update the call_id of `client` to `cid`.
     * @param client the client to update its call_id
     * @param cid the new call_id
     */
    on_update_cid(client: sio.Socket, cid: string) {
        console.log('update cid');
        this.conf.set_cid(client.id, cid);
    }

    /**
     * Notify the clients about the server state.
     */
    do_update(server_time: number) {
        //Send the current state of simulation to clients
        //TODO is that too much info?
        const data = {
            sim: this.sim,
            time: server_time,
            conf: this.conf
        }
        this.carrier.emit_update(this.server, data);
    } //game_core.server_update

    get_id() {
        return this.id;
    }

}