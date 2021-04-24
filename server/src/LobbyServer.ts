import * as UUID from 'uuid';
import * as io from 'socket.io';
import {
    CarrierServer,
    ResponderServer,
    DisconnectData,
    CidData,
    InputData,
    PingData
} from '../../common/src/protocol';

import { SimulatorServer } from './GameServer';
import { GameFactory } from './GameFactory';
import { EuclideanCircle } from '../../common/src/EuclideanCircle';
import { ServerSimulation } from './ServerSimulation';

/**
 * Perspectively, this class should
 * (a) manage different games that may be run in parallel,
 * (b) forward events to these games.
 * Currently it just starts one game and forwards everything there.
 */
export class LobbyServer implements ResponderServer<EuclideanCircle> {
    static update_loop = 45;//ms
    private simS: SimulatorServer<EuclideanCircle>;
    private carrier: CarrierServer<EuclideanCircle>;
    private running_id: number = 0;

    constructor(sio: io.Server) {
        this.carrier = new CarrierServer();
        const id = UUID.v4();
        //const game = GameFactory.create_tables_game(6);
        const game = GameFactory.create_podium_game();
        this.simS = new SimulatorServer(game, id, this.carrier, sio);
    }

    /**
     * Start the update loop, i.e. start repeatedly notifying the clients about the state.
     */
    create_update_loop() {
        //TODO Remove notify_all & instead call do_update directly with corresponding time arg
        setInterval(this.notify_all.bind(this), LobbyServer.update_loop);
        console.log('start game ' + this.simS.get_id());
    }

    notify_all() {
        const server_time = Date.now();
        this.simS.do_update(server_time);
    }

    on_update_cid(client: io.Socket, data: string): void {
        this.simS.on_update_cid(client, data);
    }

    on_connection(client: io.Socket) {
        //Useful to know when someone connects
        console.log('\t socket.io:: player ' + client.id + ' connected');
        this.running_id++;
        this.simS.push_client(client, this.running_id);
        // add listeners to this socket
        this.carrier.init_socket(client, this);
    }

    on_ping(client: io.Socket, data: PingData) {
        const now = Date.now();
        this.carrier.emit_pong(client, [data, now]);
    }

    on_input(client: io.Socket, data: InputData<EuclideanCircle>) {
        //TODO security threat: If client gives timestamp as data, they may "rewrite history"
        const i_input = data.input;
        const time = data.time;
        this.simS.on_input(client, i_input, time);
    }

    on_disconnect(client: io.Socket, _data: DisconnectData) {
        this.simS.rm_client(client);
    }

}
