import * as UUID from 'uuid';
import * as io from 'socket.io';
import {
    CarrierServer,
    ResponderServer,
    DisconnectData,
    PingData,
    ParsedInput,
    ServerCfg,
    InputMsg,
    ClientStartConfig
} from '../../common/src/protocol';

import { GameServer } from './GameServer';
import { GameFactory } from './GameFactory';
import { EuclideanCircle } from '../../common/src/EuclideanCircle';
import { YtVideoMap } from './YtVideoMap';
import { MediaFactory } from './MediaFactory';
import { Factory } from './Factory';
import { SampleConfig } from '../../common/src/Samples';

/**
 * Perspectively, this class should
 * (a) manage different games that may be run in parallel,
 * (b) forward events to these games.
 * Currently it just starts one game and forwards everything there.
 */
export class LobbyServer implements ResponderServer {
    private simS: Record<string,GameServer<EuclideanCircle>> = {};
    private playerMap: Record<string,string> = {};
    private carrier: CarrierServer<EuclideanCircle>;
    private sio: io.Server;

    constructor(sio: io.Server) {
        this.carrier = new CarrierServer();
        this.sio = sio;
        //const vid_map = MediaFactory.create_std_media(id); <-- old approach
        //const vid_map = MediaFactory.create_many_media(id);
        //const game = GameFactory.create_tables_game(6);
        //const game = GameFactory.create_podium_game();
        //const game = GameFactory.create_lynxen_dogs_goats(); <-- old approach
        //const game = GameFactory.create_frontend_test();
    }

    /**
     * Add the some player that has pressed start to the dedicated game.
     * For now there is only one game to go. It is created if not already there.
     * @param client to be pushed to some game
     * @param data specifies which game
     */
    on_start_game(client: io.Socket, data: ClientStartConfig) {
        if (Object.keys(this.simS).length == 0) {
            const id = UUID.v4();
            const F = new Factory(SampleConfig.LYDOGO);
            const game = F.parse_game();
            const vid_map = F.parse_media(id);
            const sim = new GameServer(game, vid_map, id, this.carrier, this.sio);
            sim.push_client(client, Date.now());
            this.playerMap[client.id] = id;
            this.simS[id] = sim;
            sim.create_update_loop();
        } else {
            const id = Object.keys(this.simS)[0];
            this.simS[id].push_client(client, Date.now());
            this.playerMap[client.id] = id;
        }
    }

    /** 
     * Update the server configuration according to client message.
     */
    on_server_cfg(client: io.Socket, data: ServerCfg): void {
        const game = this.simS[this.playerMap[client.id]];
        game.on_server_cfg(data);
    }

    /**
     * Handle the updated call_id of `client`.
     * @param client who updates their call_id
     * @param data new call_id
     */
    on_update_cid(client: io.Socket, data: string): void {
        this.simS[this.playerMap[client.id]].on_update_cid(client, data);
    }

    /**
     * Handle the new connection to `client`.
     * @param client connecting client
     */
    on_connection(client: io.Socket) {
        //Useful to know when someone connects
        console.log('\t socket.io:: player ' + client.id + ' connected');
        //TODO send game config
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
        const game = this.simS[this.playerMap[client.id]];
        game.on_input(client.id, data);
    }

    /**
     * Remove a disconnected client from the simulation.
     * @param client who has disconnected
     * @param _data reason of disconnection (see socket.io doc)
     */
    on_disconnect(client: io.Socket, _data: DisconnectData) {
        const gid = this.playerMap[client.id];
        if (gid == undefined || gid == '') {
            console.log('Remove player ' + client.id + ' from no game.');
            return;
        }
        const game = this.simS[this.playerMap[client.id]];
        game.rm_client(client);
        delete this.playerMap[client.id];
    }

}
