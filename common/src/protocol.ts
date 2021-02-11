//import * as SocketIOClient from 'socket.io-client';

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

export interface GameJoinData {
    game;
    time: number;
}
export type DisconnectData = any;

interface InputObj {
    x: number,
    y: number,
    d: number,
    l: number
}

export interface ServerUpdateData {
    players: Record<string,InputObj>;
    t: number;
}

export type ConnectedData = {id: string};
export type RmPlayerData = any;
export type PushPlayerData = any;
export type UpdateCidData = any;
export type PingData = any;
export type GameStateData = any;

export interface ResponderClient {
    client_onconnected(data: ConnectedData) : void;
    client_onjoingame(data: GameJoinData) : void;
    client_onserverupdate_recieved(data: ServerUpdateData) : void;
    client_on_rm_player(data: RmPlayerData) : void;
    client_on_push_player(data: PushPlayerData) : void;
    client_on_update_cid(data: UpdateCidData) : void;
    client_ondisconnect(data: DisconnectData) : void;
    client_on_ping(data: PingData) : void;
    client_onnetmessage(data: string);
}

export type CallIdData = any;
export type MvmntData = any;
export class CarrierClient {
    socket: any; // SocketIOClient.Socket
    constructor(socket: any, msgC: ResponderClient) {
        this.socket = socket;
        //Sent when we are disconnected (network, server down, etc)
        this.socket.on('disconnect', msgC.client_ondisconnect.bind(msgC));
        //Sent each tick of the server simulation. This is our authoritive update
        this.socket.on('onserverupdate', msgC.client_onserverupdate_recieved.bind(msgC));
        //When we connect, we are not 'connected' until we have a server id
        //and are placed in a game by the server. The server sends us a message for that.
        //Handle when we connect to the server, showing state and storing id's.
        this.socket.on('onconnected', msgC.client_onconnected.bind(msgC));
        //On error we just show that we are not connected for now. Can print the data.
        this.socket.on('error', msgC.client_ondisconnect.bind(msgC));

        this.socket.on('onjoingame', msgC.client_onjoingame.bind(msgC));

        this.socket.on('on_rm_player', msgC.client_on_rm_player.bind(msgC));

        this.socket.on('on_push_player', msgC.client_on_push_player.bind(msgC));

        this.socket.on('on_update_cid', msgC.client_on_update_cid.bind(msgC));
        //TODO: remove
        this.socket.on('message', msgC.client_onnetmessage.bind(msgC))
    }
    emit_call_id(data: CallIdData) {
        this.socket.emit('on_update_cid', data);
    }
    emit_input(data: MvmntData){
        this.socket.send(data);
    }
    emit_ping(data: PingData){
        this.socket.send(data);
    }
}

export interface ResponderServer {
    on_connection(client: any);// missing in CarrierServer by design
    on_update_cid(client: any, data: UpdateCidData);
    on_input(client: any, data: ServerUpdateData);
    on_disconnect(client: any, data: DisconnectData);
    //TODO remove
    onMessage(client: any, data: any);
}

function curry<A,B,C>(f: (x: A, y: B) => C, arg: A) : (x: B) => C {
    return function (z: B) { return f(arg, z);};
}

export class CarrierServer {
    
    init_socket(socket, msgS: ResponderServer) {
        socket.on('on_update_cid', curry(msgS.on_update_cid.bind(msgS),socket));
        socket.on('message', curry(msgS.onMessage.bind(msgS),socket));
        socket.on('input', curry(msgS.on_input.bind(msgS),socket));
        socket.on('disconnect', curry(msgS.on_disconnect.bind(msgS),socket));
    }

    emit_connected(socket, data: ConnectedData) {

    }
    
    emit_joingame(socket, data: GameJoinData) {
        socket.emit('onjoingame', data);
    }

    emit_pushplayer(socket, data: PushPlayerData) {
        socket.emit('on_push_player', data);
    }

    emit_updatecid(socket, data: UpdateCidData) {
        socket.emit('on_update_cid', data);
    }

    emit_update(socket, data: GameStateData) {
        socket.emit( 'onserverupdate', data);
    }

    emit_rmplayer(socket, data: RmPlayerData) {
        socket.emit('on_rm_player', data);
    }

    emit_message(socket, data: string) {
        socket.send(data);
    }
}