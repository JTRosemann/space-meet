import * as UUID from 'uuid';
import * as io from 'socket.io';
import {
    CarrierServer,
    ResponderServer,
    DisconnectData,
    SingleUpdateCidData,
    InputData
} from '../../common/src/protocol';

import { SimulatorServer } from './GameServer';
import { Game } from '../../common/src/Game';


export class LobbyServer implements ResponderServer {
    simS: SimulatorServer;
    id = UUID.v4();
    carrier: CarrierServer = new CarrierServer();
    running_id: number = 0;

    constructor(sio: io.Server) {
        this.carrier = new CarrierServer();
        const game = new Game(UUID.v4());
        this.simS = new SimulatorServer(game, this.carrier, sio);
        console.log('start game ' + game.id);
    }

    on_connection(client: io.Socket) {
        //Useful to know when someone connects
        console.log('\t socket.io:: player ' + client.id + ' connected');
        this.simS.push_client(client, this.running_id);
        this.running_id++;

        //tell the player they connected, giving them their id
        this.carrier.init_socket(client, this);
        this.carrier.emit_connected(client, { id: client.id }); //TODO remove this id probably
        console.log('looking for a game.');
        const data = {
            game: this.simS.sim.game,
            conf: this.simS.conf,
            time: this.simS.sim.local_time
        };
        this.carrier.emit_joingame(client, data);
    }

    on_update_cid(client: io.Socket, data: SingleUpdateCidData) {
        this.simS.on_update_cid(client, data);
    }

    on_ping(client: io.Socket, data: number) {
        this.carrier.emit_pong(client, data);
    }

    on_input(client: io.Socket, data: InputData) {
        this.simS.on_input(client, data);
    }

    on_disconnect(client: io.Socket, _data: DisconnectData) {
        this.simS.on_disconnect(client);
    }

}