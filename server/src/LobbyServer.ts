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
import { vec } from '../../common/src/vec';
import { RectangleWorld } from '../../common/src/World';
import { State } from '../../common/src/State';
import { Item } from '../../common/src/Item';

function create_podium_game() : Game {
    const p = {state: new State(new vec(500,240), 0), rad: 64, id: 'podium'};
    const g = new Game(UUID.v4(), new RectangleWorld(720, 480), [], [p]);
    return g;
}

function create_tables_game(n: number) : Game {
    const table_rad = 64;
    const rad = 200;
    const center_x = 2*rad;
    const center_y = 2*rad;
    const width = 2*center_x;
    const height = 2*center_y;
    const p = {state: new State(new vec(center_x,center_y), 0), rad: 64, id: 'podium'};
    let tables : Item[] = [];
    let podiums : Item[] = [p];
    const seg = 2*Math.PI / n; //angle between tables
    for (let i=0; i < n; i++) {
        const x = Math.cos(i*seg)*rad + center_x;
        const y = Math.sin(i*seg)*rad + center_y;
        const state = new State(new vec(x,y), 0);
        const id_tab = 'table' + i;
        const id_pod = 'podium' + i;
        tables.push({state: state, rad: table_rad, id: id_tab});
        podiums.push({state: state, rad: table_rad/3, id: id_pod});
    }
    const g = new Game(UUID.v4(), new RectangleWorld(width, height), [], podiums, tables);
    return g;
}

export class LobbyServer implements ResponderServer {
    simS: SimulatorServer;
    id = UUID.v4();
    carrier: CarrierServer = new CarrierServer();
    running_id: number = 0;

    constructor(sio: io.Server) {
        this.carrier = new CarrierServer();
        const game = create_tables_game(6);
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
