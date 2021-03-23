import { SimulatorClient } from "./SimulatorClient";
import * as dat from 'dat.gui';
import * as sio from 'socket.io-client';
import { CarrierClient, ConnectedData, GameJoinData, PushPlayerData, ResponderClient, ServerUpdateData, UpdateCidData } from "../../common/src/protocol";
import { establish_item, Game } from "../../common/src/Game";
import { JitsiConf } from "./JitsiConf";
import { Conference } from "../../common/src/Conference";
import { State } from "../../common/src/State";
import { Debugger } from "./Debugger";
import { fixed } from "../../common/src/util";

//window['DEBUG'] = false;
export const DEBUG = false;

/**
 * This class controls the overall user interface of the client.
 * It's the first responder to all messages from the server and responsible for forwarding them to the affected modules.
 */
export class ClientUI implements ResponderClient {
    sim: SimulatorClient;
    carrier: CarrierClient;
    user_id: string = '';
    conf: JitsiConf;
    // ui stuff
    ctx: CanvasRenderingContext2D;
    viewport: HTMLCanvasElement;
    gui: dat.GUI;
    audio_ctx: AudioContext;
    screenshare: boolean = false; // just DEMO 
    debugger: Debugger;
    equally_distributed: boolean = false;
    show_gallery: boolean = false;
    sqrt: boolean = true;
    rndm: boolean = false;

    constructor() {
        //Create the default configuration settings
        this.client_create_gui();
        //Connect to the socket.io server!
        this.client_connect_to_server()

        //Make this only if requested
        if(String(window.location).indexOf('debug') != -1) {
            // TODO improve this, e.g. see https://www.carlrippon.com/accessing-browser-query-parameters-in-javascript/
            this.debugger = new Debugger(this.gui);
            this.rndm = true;
        } else {

            //Fetch the viewport
            this.viewport = document.getElementById('viewport') as HTMLCanvasElement;
            //Adjust their size
            this.viewport.width = this.viewport.offsetWidth;
            this.viewport.height = this.viewport.offsetHeight;

            //Fetch the rendering contexts
            // TODO remove
            this.ctx = this.viewport.getContext('2d');

            //Set the draw style for the font
            this.ctx.font = '11px "Helvetica"';
            console.log('ui initialised');
        }
    }

    client_onconnected(data: ConnectedData): void {
        console.log('onconnected with id ' + data.id);
        //The server responded that we are now in a game,
        //this lets us store our id
        this.user_id = data.id;
    }

    private coin_flip() : boolean {
        return Math.random() < 0.5;
    }

    client_loop(res: number, modu: number, curr: number) {
        const input : string[] = [];
        if (curr % modu < res) {
            input.push('r');
        }
        input.push('u');
        const new_num = curr < 100*modu ? curr + 1 : 0;
        this.client_emit_inp(input);
        window.setTimeout(this.client_loop.bind(this), 16, res, modu, new_num);
    }

    client_emit_inp(input: string[]) {
        if (input.length) {
            const server_packet = {
                keys : input,
                time : 42
            }
            this.carrier.emit_input(server_packet);
        }
    }

    client_rndm_spam() {
        const input : string[] = [];
        if (this.coin_flip()) {
            input.push(this.coin_flip() ? 'l' : 'r');
        }
        if (this.coin_flip()) {
            input.push(this.coin_flip() ? 'd' : 'u');
        }
        this.client_emit_inp(input);
        //repeat
        window.setTimeout(this.client_rndm_spam.bind(this), 16);
        //window.requestAnimationFrame(this.client_rndm_spam.bind(this));
    }

    client_onjoingame(data: GameJoinData): void {
        console.log('RECEIVE onjoin');
        if (DEBUG) {
            console.log(data);
        }
        if (this.rndm) {
            this.client_loop(2, 3, 0);
            return;
        }
        const game = Game.establish(data.game);
        const conf = Conference.establish(data.conf);
        if (this.user_id) {
            this.audio_ctx = new AudioContext();
            this.conf = new JitsiConf(conf, this.carrier, this.user_id, this.audio_ctx);
            this.sim = new SimulatorClient(game, data.time, this.carrier, this.user_id,
                 this.viewport,
                 this.conf.get_listener(), this.conf.get_panners(), conf);
            this.conf.init_meeting();
            this.sim.start();
        } else {
            window.setInterval(this.client_onjoingame.bind(this), 50, data);
        }
    }

    client_onserverupdate_recieved(data: ServerUpdateData): void {
        if (!this.rndm) {//FIXME
            const remat = {
                game: data.game.map(establish_item),
                time: data.time
            }
            this.sim.incorporate_update(remat);
        }
    }

    client_on_rm_player(data: string): void {
        if (!this.rndm) { // FIXME
            this.conf.rm_player(data);
            this.sim.rm_player(data);
        }
    }

    client_on_push_player(data: PushPlayerData): void {
        //TODO is this message even neccessary? player should exist anyway in next server update
        if (this.conf == undefined || this.sim == undefined) return;
        this.conf.set_cid(data.id, data.call_id);
        this.sim.push_player(data.id, State.establish(data.state), this.conf.get_Panner(data.id), this.conf.conf);
    }

    client_on_update_cid(data: UpdateCidData): void {
        if (!this.rndm) {//FIXME
            this.conf.set_cid(data.id, data.call_id);
        }
    }

    client_ondisconnect(data: string): void {
        console.log('Disconnected.');
    }

    client_on_pong(data: number): void {
        if (!this.rndm) {
            this.sim.on_pong(data);
        }
    }

    client_connect_to_server() {
        //Store a local reference to our connection to the server
        const socket = sio.connect();
        console.log('Connect to server with id ' + socket.id)
        this.carrier = new CarrierClient(socket, this);
    }; //game_core.client_connect_to_server

    client_create_gui() {
        this.gui = new dat.GUI();
        // add gallery option
        const gallerymode = this.gui.add(this, 'equally_distributed');
        gallerymode.onChange(function(value: boolean) {
            if (value) {
                (this.sim as SimulatorClient).enable_gallerymode();
            } else {
                (this.sim as SimulatorClient).disable_gallerymode();
            }
        }.bind(this));
        // add sqrt view mode
        const sqrt = this.gui.add(this, 'sqrt');
        sqrt.onChange(function(value: boolean) {
            if (value) {
                (this.sim as SimulatorClient).enable_sqrt();
            } else {
                (this.sim as SimulatorClient).disable_sqrt();
            }
        }.bind(this));
        // add viewmode option
        const triplemode = this.gui.add(this, 'show_gallery');
        triplemode.onChange(function(value: boolean) {
            if (value) {
                (this as ClientUI).set_mode_triple();
            } else {
                (this as ClientUI).set_mode_full();
            }
        }.bind(this));
        // add screenshare option
        /*
        const screenshare = this.gui.add(this, 'screenshare');
        screenshare.onChange(function(value: boolean){
            if (value) {
                (this as ClientUI).set_mode_triple();
                (this.conf as JitsiConf).share_screen();
            } else {
                (this as ClientUI).set_mode_full();
                (this.conf as JitsiConf).stop_screenshare();
            }
        }.bind(this));
        */
    }

    set_mode_full() {
        document.getElementById('ltop').className = 'none';
        document.getElementById('lbot').className = 'full';
        document.getElementById('right').className = 'none';
        this.show_gallery = false;
    }

    set_mode_triple() {
        document.getElementById('ltop').className = 'box';
        document.getElementById('lbot').className = 'box';
        document.getElementById('right').className = 'tab';
        this.show_gallery = true;
    }
}
