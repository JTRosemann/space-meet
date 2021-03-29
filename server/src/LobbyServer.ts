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
import { GameFactory } from './GameFactory';

export class LobbyServer implements ResponderServer {
    simS: SimulatorServer;
    id = UUID.v4();
    carrier: CarrierServer = new CarrierServer();
    running_id: number = 0;

    constructor(sio: io.Server) {
        this.carrier = new CarrierServer();
        //const game = GameFactory.create_tables_game(6);
        const game = GameFactory.create_podium_game();
        this.simS = new SimulatorServer(game, this.carrier, sio);
        console.log('start game ' + game.id);
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

    on_ping(client: io.Socket, data: number) {
        this.carrier.emit_pong(client, data);
    }

    on_input(client: io.Socket, data: InputData) {
        this.simS.on_input(client, data);
    }

    on_disconnect(client: io.Socket, _data: DisconnectData) {
        this.simS.rm_client(client);
    }

}
