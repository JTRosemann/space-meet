import { SimulatorClient } from "./SimulatorClient";
import * as dat from 'dat.gui';
import * as sio from 'socket.io-client';
import { CarrierClient, ConnectedData, FullUpdateData, GameJoinData, PushPlayerData, ResponderClient, ServerUpdateData, UpdateCidData } from "../../common/src/protocol";
import { establish_item, Game } from "../../common/src/Game";
import { JitsiConf } from "./JitsiConf";
import { Conference } from "../../common/src/Conference";
import { State } from "../../common/src/State";
import { Debugger } from "./Debugger";

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

    constructor() {
        //Create the default configuration settings
        this.client_create_gui();
        //Connect to the socket.io server!
        this.client_connect_to_server()

        //Make this only if requested
        if(String(window.location).indexOf('debug') != -1) {
            this.debugger = new Debugger(this.gui);
        }

        //Fetch the viewport
        this.viewport = document.getElementById('viewport') as HTMLCanvasElement;
        //Adjust their size
        this.viewport.width = this.viewport.offsetWidth;
        this.viewport.height = this.viewport.offsetHeight;

        //Fetch the rendering contexts
        this.ctx = this.viewport.getContext('2d');

        //Set the draw style for the font
        this.ctx.font = '11px "Helvetica"';
        console.log('ui initialised');
    }

    client_onserverupdate_received(data: FullUpdateData): void {
        this.user_id = this.carrier.socket.id;
        if (this.sim == undefined) {
            // on the first update there is more to do
            const game = Game.establish(data.game);
            const conf = Conference.establish(data.conf);
            this.audio_ctx = new AudioContext();
            this.conf = new JitsiConf(conf, this.carrier, this.user_id, this.audio_ctx);
            this.sim = new SimulatorClient(game, data.time, this.carrier, this.user_id,
                this.viewport,
                this.conf.get_listener(), this.conf.get_panners(), conf);
            this.conf.init_meeting();
            this.sim.start();
        } else {
            const conf = Conference.establish(data.conf);
            this.conf.update_conf(conf);
            this.sim.incorporate_update(Game.establish(data.game), this.conf, conf, data.time);
        }
    }        
/*

    client_on_rm_player(data: string): void {
    X    this.conf.rm_player(data);
    X    this.sim.rm_player(data);
    }

    client_on_push_player(data: PushPlayerData): void {
        //TODO is this message even neccessary? player should exist anyway in next server update
    X    if (this.conf == undefined || this.sim == undefined) return;
    X    this.conf.set_cid(data.id, data.call_id);
    FIXNOW    this.sim.push_player(data.id, State.establish(data.state), this.conf.get_Panner(data.id), this.conf.conf);
    }

*/

    client_ondisconnect(data: string): void {
        console.log('Disconnected.');
    }

    client_on_pong(data: number): void {
        this.sim.on_pong(data);
    }

    client_connect_to_server() {
        //Store a local reference to our connection to the server
        const socket = sio.connect();
        console.log('Connect to server with id ' + socket.id)// here we don't know the id yet
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
