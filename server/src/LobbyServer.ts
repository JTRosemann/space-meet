import * as UUID from 'uuid';
import * as sio from 'socket.io';
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
    gamecore: SimulatorServer;
    id = UUID.v4();
    carrier: CarrierServer = new CarrierServer();
    running_id: number = 0;

    constructor() {
        this.carrier = new CarrierServer();
        const game = new Game(UUID.v4());
        this.gamecore = new SimulatorServer(game, this.carrier);
        console.log('start game ' + game.id);
    }

    //TODO fix debugging stuff
    fake_latency = 0;
    local_time = 0;
    _dt = new Date().getTime();
    _dte = new Date().getTime();
    //a local queue of messages we delay if faking latency
    messages: { client: sio.Socket; message: string; }[] = [];

    on_connection(client: sio.Socket) {
        //Useful to know when someone connects
        console.log('\t socket.io:: player ' + client.id + ' connected');
        this.gamecore.push_client(client, this.running_id);
        this.running_id++;

        //tell the player they connected, giving them their id
        this.carrier.init_socket(client, this);
        this.carrier.emit_connected(client, { id: client.id }); //TODO remove this id probably
        console.log('looking for a game.');
        const data = {
            game: this.gamecore.get_game_state(),
            time: this.gamecore.local_time
        };
        this.carrier.emit_joingame(client, data);
        this.gamecore.active = true; //set this flag, so that the update loop can run it.
    }

    on_update_cid(client: sio.Socket, data: SingleUpdateCidData) {
        this.gamecore.on_update_cid(client, data);
    }

    on_ping(client: sio.Socket, data: number) {
        this.carrier.emit_pong(client, data);
    }

    on_input(client: sio.Socket, data: InputData) {
        this.gamecore.on_input(client, data);
    }

    on_disconnect(client: sio.Socket, data: DisconnectData) {
        this.gamecore.on_disconnect(client, data);
    }

    onMessage(client: sio.Socket, message: string) {
        console.log('Use of DEPRECATED MESSAGE FORMAT');
        //TODO fix debugging code & REMOVE method
        if (this.fake_latency && message.split('.')[0].substr(0, 1) == 'i') {

            //store all input message
            this.messages.push({ client: client, message: message });

            setTimeout(function () {
                if (this.messages.length) {
                    this.gamecore.onMessage(this.messages[0].client, this.messages[0].message);
                    this.messages.splice(0, 1);
                }
            }.bind(this), this.fake_latency);

        }
    }

}
