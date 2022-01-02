import * as UUID from 'uuid';
import * as io from 'socket.io';
import {
    CarrierServer,
    ResponderServer,
    DisconnectData,
    PingData,
    ParsedInput,
    ServerCfg,
    InputMsg
} from '../../common/src/protocol';

import { GameServer } from './GameServer';
import { GameFactory } from './GameFactory';
import { EuclideanCircle } from '../../common/src/EuclideanCircle';
import { YtVideoMap } from './YtVideoMap';
import { MediaFactory } from './MediaFactory';

/**
 * Perspectively, this class should
 * (a) manage different games that may be run in parallel,
 * (b) forward events to these games.
 * Currently it just starts one game and forwards everything there.
 */
export class LobbyServer implements ResponderServer {
    //static update_loop = 500;//ms DEBUGGING
    static update_loop = 45;//ms
    static allow_remote = false;
    private simS: GameServer<EuclideanCircle>;
    private carrier: CarrierServer<EuclideanCircle>;

    constructor(sio: io.Server) {
        this.carrier = new CarrierServer();
        const id = UUID.v4();
        const vid_map = MediaFactory.create_std_media(id);
        //const vid_map = MediaFactory.create_many_media(id);
        //const game = GameFactory.create_tables_game(6);
        //const game = GameFactory.create_podium_game();
        const game = GameFactory.create_lynxen_dogs_goats();
        //const game = GameFactory.create_frontend_test();
        this.simS = new GameServer(game, vid_map, id, this.carrier, sio);
    }

    /** 
     * Update the server configuration according to client message.
     */
    on_server_cfg(_client: io.Socket, data: ServerCfg): void {
        LobbyServer.update_loop = data.update_loop;
        CarrierServer.fake_lag = data.fake_lag;
        LobbyServer.allow_remote = data.allow_remote;
    }

    /**
     * Start the update loop, i.e. start repeatedly notifying the clients about the state.
     */
    create_update_loop() {
        console.log('start game ' + this.simS.get_id());
        this.update();
    }

    /**
     * Notify all clients about the state of the game.
     */
    private update() {
        //TODO instead call do_update directly with corresponding time arg
        const server_time = Date.now();
        this.simS.do_update(server_time);
        setTimeout(this.update.bind(this), LobbyServer.update_loop);
    }

    /**
     * Handle the updated call_id of `client`.
     * @param client who updates their call_id
     * @param data new call_id
     */
    on_update_cid(client: io.Socket, data: string): void {
        this.simS.on_update_cid(client, data);
    }

    /**
     * Handle the new connection to `client`.
     * @param client connecting client
     */
    on_connection(client: io.Socket) {
        //Useful to know when someone connects
        console.log('\t socket.io:: player ' + client.id + ' connected');
        this.simS.push_client(client, Date.now());
        // add listeners to this socket
        this.carrier.init_socket(client, this);
    }

    /**
     * Answer `client`'s ping with a pong.
     * The pong includes the timestamp of the ping sent by `client` and the timestamp when the ping was received.
     * @param client who sent the ping
     * @param data 
     */
    on_ping(client: io.Socket, data: PingData) {
        const now = Date.now();
        this.carrier.emit_pong(client, [data, now]);
    }

    /**
     * Apply the input of the player to its state at the corresponding time.
     * @param client who has sent an input
     * @param data the input data, consisting of the input and the corresponding timestamp
     */
    on_input(client: io.Socket, data: InputMsg) {
        //TODO security threat: If client gives timestamp as data, they may "rewrite history"
        //console.log(data);//DEBUG
        const id = data.id;
        const input = data.input;
        if (LobbyServer.allow_remote) {
            if (this.simS.has_player(id)) {
                this.simS.on_input(id, input);
            } else {
                console.warn('player ' + id + ' does not exist');
            }
        } else {
            this.simS.on_input(client.id, input);
        }
    }

    /**
     * Remove a disconnected client from the simulation.
     * @param client who has disconnected
     * @param _data reason of disconnection (see socket.io doc)
     */
    on_disconnect(client: io.Socket, _data: DisconnectData) {
        this.simS.rm_client(client);
    }

}
