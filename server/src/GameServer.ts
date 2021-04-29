/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

import * as sio from 'socket.io';
import { CarrierServer } from '../../common/src/protocol';
import * as io from 'socket.io';
import { Snap } from '../../common/src/Snap';
import { Conference } from '../../common/src/Conference';
import { InterpretedInput } from '../../common/src/InterpretedInput';
import { ServerSimulation } from './ServerSimulation';
import { State } from '../../common/src/State';

export class GameServer<S extends State> {
    private sim: ServerSimulation<S>;
    private carrier: CarrierServer<S>;
    private server: io.Server;
    private conf: Conference;
    private id: string;
    private update_loop_interval: NodeJS.Timeout;

    constructor(init_sim: ServerSimulation<S>, id: string, carrier: CarrierServer<S>, sio: io.Server) {
        this.sim = init_sim;// starts timer & update_physics loop
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
        // To prevent over-reaching interpolation, we have to duplicate the old state before the move.
        const p_state = this.sim.freeze_last_player_state_before(p_id, time);
        const new_state = i_input.apply_to(p_state);
        const after_input = time + i_input.get_duration();
        this.sim.push_update(p_id, new_state, after_input);
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
        //TODO run bots
        //Send the current state of simulation to clients
        const data = {
            sim: this.sim.to_data(),
            time: server_time,
            conf: this.conf.to_data()
        }
        this.carrier.emit_update(this.server, data);
    }

    /**
     * Getter for the ID.
     * @returns the id of this
     */
    get_id() {
        return this.id;
    }

}