import { SimulatorClient } from "./SimulatorClient";
import * as dat from 'dat.gui';
import * as sio from 'socket.io-client';
import { CarrierClient, ConnectedData, GameJoinData, PushPlayerData, ResponderClient, ServerUpdateData, UpdateCidData } from "../../common/src/protocol";
import { establish_item, Game } from "../../common/src/Game";
import { JitsiConf } from "./JitsiConf";
import { Conference } from "../../common/src/Conference";
import { Item, State } from "../../common/src/game.core";

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
    traces: boolean;
    clip: boolean;
    show_support: boolean;
    show_video: boolean;
    show_help: boolean;
    naive_approach: boolean;
    show_server_pos: boolean;
    show_dest_pos: boolean;
    client_predict: boolean;
    input_seq: number;
    client_smoothing: boolean;
    client_smooth: number;
    pos_audio: boolean;
    net_latency: number;
    net_ping: number;
    last_ping_time: number;
    fake_lag: number;
    fake_lag_time: number;
    net_offset: number;
    buffer_size: number;
    target_time: number;
    oldest_tick: number;
    client_time: number;
    server_time: number;
    dt: number;
    fps: number;
    fps_avg_count: number;
    fps_avg: number;
    fps_avg_acc: number;
    lit: number;
    llt: number;
    ctx: CanvasRenderingContext2D;
    viewport: HTMLCanvasElement;
    gui: dat.GUI;
    audio_ctx: AudioContext;

    client_onconnected(data: ConnectedData): void {
        console.log('onconnected with id ' + data.id);
        //The server responded that we are now in a game,
        //this lets us store our id
        this.user_id = data.id;
    }

    client_onjoingame(data: GameJoinData): void {
        console.log('RECEIVE onjoin');
        if (DEBUG) {
            console.log(data);
        }
        const game = Game.establish(data.game);
        const conf = Conference.establish(data.conf);
        if (this.user_id) {
            this.audio_ctx = new AudioContext();
            this.conf = new JitsiConf(conf, this.carrier, this.user_id, this.audio_ctx);
            this.sim = new SimulatorClient(game, data.time, this.carrier, this.user_id,
                 this.ctx, this.viewport.width, this.viewport.height,
                 this.conf.get_listener(), this.conf.get_panners(), conf);
            this.conf.init_meeting();
        }
        this.sim.start();
    }


    client_onserverupdate_recieved(data: ServerUpdateData): void {
        const remat = {
            game: data.game.map(establish_item),
            time: data.time
        }
        this.sim.incorporate_update(remat);
    }

    client_on_rm_player(data: string): void {
        this.conf.rm_player(data);
        this.sim.rm_player(data);
    }

    client_on_push_player(data: PushPlayerData): void {
        //TODO is this message even neccessary? player should exist anyway in next server update
        if (this.conf == undefined || this.sim == undefined) return;
        this.conf.set_cid(data.id, data.call_id);
        this.sim.push_player(data.id, State.establish(data.state), this.conf.get_Panner(data.id), this.conf.conf);
    }

    client_on_update_cid(data: UpdateCidData): void {
        this.conf.set_cid(data.id, data.call_id);
    }

    client_ondisconnect(data: string): void {
        console.log('Disconnected.');
    }

    client_on_pong(data: number): void {
        this.sim.on_pong(data);
    }

    init_ui() {
        //Create the default configuration settings
        this.client_create_configuration();
        //Connect to the socket.io server!
        this.client_connect_to_server()

        //Make this only if requested
        if(String(window.location).indexOf('debug') != -1) {
            this.client_create_debug_gui();
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

    client_connect_to_server() {
        //Store a local reference to our connection to the server
        const socket = sio.connect();
        console.log('Connect to server with id ' + socket.id)
        this.carrier = new CarrierClient(socket, this);
    }; //game_core.client_connect_to_server

    client_create_debug_gui() {
        this.gui = new dat.GUI();// <- see THREEx.keyboard issue

    //    const _playersettings = this.gui.addFolder('Your settings');

    //    this.colorcontrol = _playersettings.addColor(this, 'color');

        //We want to know when we change our color so we can tell
        //the server to tell the other clients for us
    /*    this.colorcontrol.onChange(function(value) {
            this.get_self().color = value;
            localStorage.setItem('color', value);
            this.socket.send('c.' + value);
        }.bind(this));
    */
    //    _playersettings.open();

        const _drawsettings = this.gui.addFolder('Drawing');
        _drawsettings.add(this, 'traces').listen();
        _drawsettings.add(this, 'clip').listen();
        _drawsettings.add(this, 'show_support').listen();
        _drawsettings.add(this, 'show_video').listen();

        _drawsettings.open();

        const _othersettings = this.gui.addFolder('Methods');

        _othersettings.add(this, 'naive_approach').listen();
        _othersettings.add(this, 'client_smoothing').listen();
        _othersettings.add(this, 'client_smooth').listen();
        _othersettings.add(this, 'client_predict').listen();
        _othersettings.add(this, 'pos_audio').listen();

        const _debugsettings = this.gui.addFolder('Debug view');

        _debugsettings.add(this, 'show_help').listen();
        _debugsettings.add(this, 'fps_avg').listen();
        _debugsettings.add(this, 'show_server_pos').listen();
        _debugsettings.add(this, 'show_dest_pos').listen();
        _debugsettings.add(this, 'local_time').listen();

        const _consettings = this.gui.addFolder('Connection');
        _consettings.add(this, 'net_latency').step(0.001).listen();
        _consettings.add(this, 'net_ping').step(0.001).listen();

        //When adding fake lag, we need to tell the server about it.
        const lag_control = _consettings.add(this, 'fake_lag').step(0.001).listen();
        lag_control.onChange(function(value: number){
            this.socket.send('l.' + value);
        }.bind(this));

        const _netsettings = this.gui.addFolder('Networking');

        _netsettings.add(this, 'net_offset').min(0.01).step(0.001).listen();
        _netsettings.add(this, 'server_time').step(0.001).listen();
        _netsettings.add(this, 'client_time').step(0.001).listen();
        //_netsettings.add(this, 'oldest_tick').step(0.001).listen();

    } //game_core.client_create_debug_gui

    client_create_configuration() {

        this.traces = false;                 //whether to show traces of drawn items (i.e. don't clear)
        this.clip = false;                   //whether to clip everything around the map circle
        this.show_support = false;          //whether to show support lines
        this.show_video = true;             //whether to draw the video in the head

        this.show_help = false;             //Whether or not to draw the help text
        this.naive_approach = false;        //Whether or not to use the naive approach
        this.show_server_pos = false;       //Whether or not to show the server position
        this.show_dest_pos = false;         //Whether or not to show the interpolation goal
        this.client_predict = true;         //Whether or not the client is predicting input
        this.input_seq = 0;                 //When predicting client inputs, we store the last input as a sequence number
        this.client_smoothing = true;       //Whether or not the client side prediction tries to smooth things out
        this.client_smooth = 25;            //amount of smoothing to apply to client update dest
        this.pos_audio = true;             //whether to enable positional audio

        this.net_latency = 0.001;           //the latency between the client and the server (ping/2)
        this.net_ping = 0.001;              //The round trip time from here to the server,and back
        this.last_ping_time = 0.001;        //The time we last sent a ping
        this.fake_lag = 0;                //If we are simulating lag, this applies only to the input client (not others)
        this.fake_lag_time = 0;

        this.net_offset = 100;              //100 ms latency between server and client interpolation for other clients
        this.buffer_size = 2;               //The size of the server history to keep for rewinding/interpolating.
        this.target_time = 0.01;            //the time where we want to be in the server timeline
        this.oldest_tick = 0.01;            //the last time tick we have available in the buffer

        this.client_time = 0.01;            //Our local 'clock' based on server time - client interpolation(net_offset).
        this.server_time = 0.01;            //The time the server reported it was at, last we heard from it

        this.dt = 0.016;                    //The time that the last frame took to run
        this.fps = 0;                       //The current instantaneous fps (1/this.dt)
        this.fps_avg_count = 0;             //The number of samples we have taken for fps_avg
        this.fps_avg = 0;                   //The current average fps displayed in the debug UI
        this.fps_avg_acc = 0;               //The accumulation of the last avgcount fps samples

        this.lit = 0;
        this.llt = new Date().getTime();

    };//game_core.client_create_configuration

}
