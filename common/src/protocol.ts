//import * as SocketIOClient from 'socket.io-client';

const JSONIFY = false; // this is exactly what is done anyway: 
//https://stackoverflow.com/questions/37512304/send-object-in-socket-io

import * as io from 'socket.io';
import { Conference } from './Conference';
import { RessourceMap } from './RessourceMap';
import { SimulationData } from "./Simulation";
import { State } from './State';

/*
 * client connects via socket.io
 *      server_on_client_connect/connected: sends ID to client
 * client_onconnected
 * 
 *      server_joingame/push_player: sends game data & call data to client, creating game if non-existent & starting update & physics loop os server, pushes new player to existing players
 * client_onjoingame: starts update & physics loop on client, initialize meeting
 * client_onpush_player: update player list
 * 
 * client_update_cid: send call_id to server
 *      server_on_update_cid: save call_id & distribute it to other players
 * client_on_update_cid: save cid from others
 * 
 * client_update_input: send input to server
 *      server_update: sends game update to all players
 * client_on_update_recieved[sic!]: updates positions in cur_state, leverage smooth update of state
 * 
 * client disconnects via socket.io
 *      server_ondisconnect: removes player from game & notify existing players
 * client_on_rm_player: remove player from game
 */

export interface ClientConfigData {
    mode: 'full' | 'triple';
    gallery: boolean;
}

export type DisconnectData = string;//"reason" see Socket.IO doc

export interface ParsedInput {
    up: -1 | 0 | 1;
    right: -1 | 0 | 1;
    start: number;
    duration: number;
}

export type CidData = string;
export type PingData = number;

/**
 * First number is the key from the ping, second is the receive time on server.
 */
export type PongData = [number, number];

export interface FullUpdateData<S extends State> {
    sim: SimulationData<S>;
    res_map: RessourceMap;
}

export interface ResponderClient<S extends State> {
    //client_onconnected(data: ConnectedData) : void;
    client_onserverupdate_received(data: FullUpdateData<S>) : void;
    client_ondisconnect(data: DisconnectData) : void;
    client_on_pong(data: PongData) : void;
}

export interface CallIDEmitter {
    emit_call_id(data: CidData) : void;
}

export interface ServerCfg {
    update_loop: number;
    fake_lag: number;
    allow_remote: boolean;
}

export interface ServerCfgEmitter {
    emit_server_cfg(data: ServerCfg) : void;
}

export interface InputMsg {
    input: ParsedInput;
    id: string;
}

export class CarrierClient<S extends State> implements CallIDEmitter, ServerCfgEmitter {
    static fake_lag = 0;
    private socket: io.Socket; // SocketIOClient.Socket
    constructor(socket: any, msgC: ResponderClient<S>) {
        this.socket = socket;
        //Sent when we are disconnected (network, server down, etc)
        this.socket.on('disconnect', (msgC.client_ondisconnect.bind(msgC)));
        //Sent each tick of the server simulation. This is our authoritive update
        this.socket.on('onserverupdate', (msgC.client_onserverupdate_received.bind(msgC)));
        //When we connect, we are not 'connected' until we have a server id
        //and are placed in a game by the server. The server sends us a message for that.
        //Handle when we connect to the server, showing state and storing id's.
        //this.socket.on('onconnected', (msgC.client_onconnected.bind(msgC)));
        //On error we just show that we are not connected for now. Can print the data.
        this.socket.on('error', (msgC.client_ondisconnect.bind(msgC)));
        
        this.socket.on('pong', (msgC.client_on_pong.bind(msgC)));
    }
    emit_call_id(data: CidData) {
        this.emit('on_update_cid', data);
    }
    emit_input(data: InputMsg){
        this.emit('input', data, false);
    }
    emit_ping(data: PingData){
        this.emit('ping', data, false);
    }
    emit_server_cfg(data: ServerCfg) {
        this.emit('scfg', data, true);
    }
    get_id() {
        return this.socket.id;
    }
    private emit(key: string, data: any, log = true) {
        if (log) {
            console.log('SEND ' + key);
            console.log(data);
        }
        if (CarrierClient.fake_lag > 0) {
            window.setTimeout(() => this.socket.emit(key,data), CarrierClient.fake_lag);
        } else {
            this.socket.emit(key, (data));
        }
    }
}

export interface ResponderServer {
    on_connection(client: io.Socket) : void;// missing in CarrierServer by design
    on_update_cid(client: io.Socket, data: CidData) : void;
    on_input(client: io.Socket, data: InputMsg) : void;
    on_disconnect(client: io.Socket, data: DisconnectData) : void;
    on_ping(client: io.Socket, data: PingData) : void;
    on_server_cfg(client: io.Socket, data: ServerCfg) : void;
}

function curry<A,B,C>(f: (x: A, y: B) => C, arg: A) : (x: B) => C {
    return function (z: B) { return f(arg, z);};
}

export class CarrierServer<S extends State> {
    static fake_lag: number = 0;
    init_socket(socket: io.Socket, msgS: ResponderServer) {
        socket.on('on_update_cid', (curry(msgS.on_update_cid.bind(msgS),socket)));
        socket.on('input', (curry(msgS.on_input.bind(msgS),socket)));
        socket.on('disconnect', (curry(msgS.on_disconnect.bind(msgS),socket)));
        socket.on('ping', (curry(msgS.on_ping.bind(msgS), socket)));
        socket.on('scfg', (curry(msgS.on_server_cfg.bind(msgS),socket)));
    }

    emit_pong(client: io.Socket, data: PongData) {
        this.emit(client, 'pong', data, false);
    }

    emit_update(socket: io.Server, data: FullUpdateData<S>) {
        this.emit(socket, 'onserverupdate', data, false);
    }

    private emit(socket: io.Socket | io.Server, key: string, data: any, log = true) {
        if (log) {
            console.log('SEND ' + key);
            console.log(data);
        }
        if (CarrierServer.fake_lag > 0) {
            setTimeout(() => socket.emit(key, data), CarrierServer.fake_lag);
        } else {
            socket.emit(key, (data));
        }
    }
}