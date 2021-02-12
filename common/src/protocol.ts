//import * as SocketIOClient from 'socket.io-client';

const JSONIFY = false; // this is exactly what is done anyway: 
//https://stackoverflow.com/questions/37512304/send-object-in-socket-io

import { timeStamp } from "console";
import { runInThisContext } from "vm";

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
 * client_update_cid: save call_id of other player
 *      server_update: sends game update to all players
 * client_on_update_recieved[sic!]: updates positions in cur_state, leverage smooth update of state
 * 
 * client disconnects via socket.io
 *      server_ondisconnect: removes player from game & notify existing players
 * client_on_rm_player: remove player from game
 */

export type GameState = {
    id: string,
    call_id: string,
    state: {x: number, y: number, d: number}
}[];

export interface GameJoinData {
    game: GameState;
    time: number;
}
export type DisconnectData = string;//"reason" see Socket.IO doc

export interface InputData {
    keys: string[];
    time: number;
    seq: number;
};

type InputObj =
    {
        state: {
            x: number,
            y: number,
            d: number
        },
        lis: number
    };

export interface ServerUpdateData {
    players: Record<string,InputObj>;//TODO remove Record
    t: number;
}

export type ConnectedData = {id: string};
export type RmPlayerData = string;
export type PushPlayerData = {
    id: string,
    call_id: string,
    state: {x: number, y: number, d: number}
};
export type SingleUpdateCidData = string;
export type UpdateCidData = {id: string, call_id: string};
export type PingData = number;


export interface GameStateData {
    game: GameState;
    time: number;
}

export interface ResponderClient {
    client_onconnected(data: ConnectedData) : void;
    client_onjoingame(data: GameJoinData) : void;
    client_onserverupdate_recieved(data: ServerUpdateData) : void;
    client_on_rm_player(data: RmPlayerData) : void;
    client_on_push_player(data: PushPlayerData) : void;
    client_on_update_cid(data: UpdateCidData) : void;
    client_ondisconnect(data: DisconnectData) : void;
    client_on_pong(data: PingData) : void;
}

function unpack<A,B>(f: (data: A) => B) : (x:string | A) => B {
    return JSONIFY ? function(raw_data: string) {
        return f(JSON.parse(raw_data));
    } : f;
}

function pack(data: any) {
    return JSONIFY ? JSON.stringify(data) : data;
}

export class CarrierClient {
    socket: any; // SocketIOClient.Socket
    constructor(socket: any, msgC: ResponderClient) {
        this.socket = socket;
        //Sent when we are disconnected (network, server down, etc)
        this.socket.on('disconnect', unpack(msgC.client_ondisconnect.bind(msgC)));
        //Sent each tick of the server simulation. This is our authoritive update
        this.socket.on('onserverupdate', unpack(msgC.client_onserverupdate_recieved.bind(msgC)));
        //When we connect, we are not 'connected' until we have a server id
        //and are placed in a game by the server. The server sends us a message for that.
        //Handle when we connect to the server, showing state and storing id's.
        this.socket.on('onconnected', unpack(msgC.client_onconnected.bind(msgC)));
        //On error we just show that we are not connected for now. Can print the data.
        this.socket.on('error', unpack(msgC.client_ondisconnect.bind(msgC)));

        this.socket.on('onjoingame', unpack(msgC.client_onjoingame.bind(msgC)));

        this.socket.on('on_rm_player', unpack(msgC.client_on_rm_player.bind(msgC)));

        this.socket.on('on_push_player', unpack(msgC.client_on_push_player.bind(msgC)));

        this.socket.on('on_update_cid', unpack(msgC.client_on_update_cid.bind(msgC)));
        
        this.socket.on('pong', unpack(msgC.client_on_pong.bind(msgC)));
    }
    emit_call_id(data: SingleUpdateCidData) {
        this.emit('on_update_cid', data);
    }
    emit_input(data: InputData){
        this.emit('input', data, false);
    }
    emit_ping(data: PingData){
        this.emit('ping', data, false);
    }
    private emit(key: string, data: any, log = true) {
        if (log) {
            console.log('SEND ' + key);
            console.log(data);
        }
        this.socket.emit(key, pack(data));
    }
}

export interface ResponderServer {
    on_connection(client: any);// missing in CarrierServer by design
    on_update_cid(client: any, data: SingleUpdateCidData);
    on_input(client: any, data: InputData);
    on_disconnect(client: any, data: DisconnectData);
    on_ping(client: any, data: PingData);
}

function curry<A,B,C>(f: (x: A, y: B) => C, arg: A) : (x: B) => C {
    return function (z: B) { return f(arg, z);};
}

export class CarrierServer {
    
    init_socket(socket, msgS: ResponderServer) {
        socket.on('on_update_cid', unpack(curry(msgS.on_update_cid.bind(msgS),socket)));
        socket.on('input', unpack(curry(msgS.on_input.bind(msgS),socket)));
        socket.on('disconnect', unpack(curry(msgS.on_disconnect.bind(msgS),socket)));
        socket.on('ping', unpack(curry(msgS.on_ping.bind(msgS), socket)));
    }

    emit_pong(client: any, data: number) {
        this.emit(client, 'pong', data, false);
    }

    emit_connected(socket, data: ConnectedData) {
        this.emit(socket, 'onconnected', data);
    }
    
    emit_joingame(socket, data: GameJoinData) {
        this.emit(socket, 'onjoingame', data);
    }

    emit_pushplayer(socket, data: PushPlayerData) {
        this.emit(socket, 'on_push_player', data);
    }

    emit_updatecid(socket, data: UpdateCidData) {
        this.emit(socket, 'on_update_cid', data);
    }

    emit_update(socket, data: ServerUpdateData) {
        this.emit(socket, 'onserverupdate', data, false);
    }

    emit_rmplayer(socket, data: RmPlayerData) {
        this.emit(socket, 'on_rm_player', data);
    }

    private emit(socket, key: string, data: any, log = true) {
        if (log) {
            console.log('SEND ' + key);
            console.log(data);
        }
        socket.emit(key, pack(data));
    }
}