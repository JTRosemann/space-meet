/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    Copyright 2020 Julian Rosemann

    MIT Licensed.
*/

import * as sio from 'socket.io';
import { CarrierServer, ParsedInput } from '../../common/src/protocol';
import * as io from 'socket.io';
import { Conference } from '../../common/src/Conference';
import { ServerSimulation } from './ServerSimulation';
import { State } from '../../common/src/State';
import { RessourceMap, VideoMap } from '../../common/src/RessourceMap';

export class GameServer<S extends State> {
    private sim: ServerSimulation<S>;
    private carrier: CarrierServer<S>;
    private server: io.Server;
    private res_map: RessourceMap;
    private id: string;

    constructor(init_sim: ServerSimulation<S>, direct_video: VideoMap, id: string, carrier: CarrierServer<S>, sio: io.Server) {
        this.sim = init_sim;// starts timer & update_physics loop
        this.id = id;
        this.carrier = carrier;
        this.server = sio;
        const conf = new Conference(id);
        this.res_map = new RessourceMap(conf, direct_video);
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
        this.res_map.rm_player(client.id);
    }
    
    /**
     * Update the simulation according to the input `i_input` at server_time `time` for client `client`.
     * @param client who made the input
     * @param p_input input to process
     * @param time server_time when the client made the input
     */
    on_input(client: sio.Socket, p_input: ParsedInput) {
        const p_id = client.id;
        this.sim.interpret_input(p_id, p_input);
    }

    /**
     * Add a client player at the corresponding time and set its call_id to ''.
     * @param client to be added
     * @param time server_time when to add
     */
    push_client(client: sio.Socket, time: number) {
        const p_id = client.id;
        this.sim.add_player(p_id, time);
        this.res_map.set_call_id(p_id, '');
    }

    /**
     * Update the call_id of `client` to `cid`.
     * @param client the client to update its call_id
     * @param cid the new call_id
     */
    on_update_cid(client: sio.Socket, cid: string) {
        console.log('update cid');
        this.res_map.set_call_id(client.id, cid);
    }

    /**
     * Notify the clients about the server state.
     */
    do_update(server_time: number) {
        //TODO run bots
        //Send the current state of simulation to clients
        const data = {
            sim: this.sim.to_data(),
            res_map: this.res_map
        }
        this.carrier.emit_update(this.server, data);
        //console.warn("memory leak");
        this.sim.clear_all();
    }

    /**
     * Getter for the ID.
     * @returns the id of this
     */
    get_id() {
        return this.id;
    }

}