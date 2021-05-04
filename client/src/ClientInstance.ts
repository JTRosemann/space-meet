import { CarrierClient, FullUpdateData, PongData, ResponderClient } from "../../common/src/protocol";
import { Debugger } from "./Debugger";
import { FrontEnd as Frontend } from "./Frontend";
import * as sio from 'socket.io-client';
import { HybridMap } from "./HybridMap";
import { ClientSimulation } from "./ClientSimulation";
import { Auditorium } from "./Auditorium";
import { MediaManager } from "./MediaManager";
import { ViewSelector } from "./ViewSelector";
import { InputProcessor } from "./InputProcessor";
import { ArrowInputProcessor } from "./ArrowInputProcessor";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { Timer } from "./Timer";

/**
 * This class represents a client UI.
 * It manages several FrontEnds for Visua-/Audiolization and a debugging menu.
 * This is also the first responder for all messages from the server.
 */
export class ClientInstance implements ResponderClient<EuclideanCircle> {

    private static offset = 100//ms

    private viewport: HTMLCanvasElement;
    private carrier: CarrierClient<EuclideanCircle>;
    private debugger: Debugger;
    private simulation: ClientSimulation<EuclideanCircle>;
    private in_proc: InputProcessor;
    private media_manager: MediaManager;
    private view_selector: ViewSelector<EuclideanCircle>;
    private audioFrontend: Frontend<EuclideanCircle>;
    private videoFrontend: Frontend<EuclideanCircle>;
    private my_id: string;
    private timer: Timer;

    constructor(viewport: HTMLCanvasElement) {
        if (String(window.location).indexOf('debug') != -1 ) {
            // if desired, a debugging UI is created
            // TODO: the debugger needs access to some interface view of this
            // TODO: a GUI could be instantiated in a similar way
            this.debugger = new Debugger();
        }
        this.viewport = viewport;
        this.connect_to_server();
        this.timer = new Timer();
        this.my_id = '';
    }

    /**
     * Connect to the server.
     * The own socket ID is only visible after the first server message is witnessed.
     */
    private connect_to_server() {
        const socket = sio.connect();
        console.log('Connect to server with id ' + socket.id)// here we don't know the id yet
        this.carrier = new CarrierClient(socket, this);
        console.warn("Ping timer disabled");//TODO fix ping
        //window.setInterval(this.ping_server.bind(this), 20);
    }

    private ping_server() {
        const ping = this.timer.get_server_time();
        this.carrier.emit_ping(ping);
    }

    /**
     * Instantiate simulation, media_manager & view_selector.
     * This is only possible as soon as we have received the first server update.
     * @param data the data to create the initial simulation etc
     */
    private init_core(data: FullUpdateData<EuclideanCircle>) {
        this.simulation = ClientSimulation.establish(data.sim);
        this.media_manager = new MediaManager(data.conf);
        this.my_id = this.carrier.get_id();
        this.in_proc = new ArrowInputProcessor(
            this.simulation.get_latest_state_time(this.my_id));
        this.view_selector = new ViewSelector(this.simulation, this.my_id);
    }

    /**
     * Initialize the different frontends and start the animation loop.
     */
    private init_frontends() {
        this.videoFrontend
         = new HybridMap(this.media_manager, this.viewport, this.my_id);
        this.audioFrontend
         = new Auditorium<EuclideanCircle>(this.media_manager, this.my_id);
        //start animation loop
        window.requestAnimationFrame(this.run.bind(this));
    }

    /**
     * Read input, register it in the ViewSelector and emit it to the server.
     * @returns the read input
     */
    private read_sync_input(server_time: number) {
        const input = this.in_proc.fetch_input(server_time);
        //if (input == undefined) return;
        // register input for client prediction
        this.view_selector.register_input(input, server_time);
        // emit input to server
        this.carrier.emit_input(input);
    }

    /**
     * Produce a snap of the simulation and hit the frontends to render it.
     */
    run() {
        //FIXME when tbuf is directly dependent of the lag, a change in the lag may reverse time
        const tbuf = ClientInstance.offset + this.timer.get_lag();
        const server_time = this.timer.get_server_time();
        // read the input and distribute it
        this.read_sync_input(server_time);
        // select a snapshot to render
        const snap = this.view_selector.select_view(server_time - tbuf);
        // render the chosen snapshot of the simulation
        this.videoFrontend.render(snap);
        this.audioFrontend.render(snap);
        // this guarantees updates forever
        window.requestAnimationFrame(this.run.bind(this));
    }

    private last_update : FullUpdateData<EuclideanCircle>;
    /**
     * This is the server-update handler.
     * Whenever a server-update is received the simulation and the mediaManager are updated accordingly.
     * If it's the first message from the server, simulation, mediaManager and both Frontends have to be inittialized as well.
     * @param data update received from server
     */
    client_onserverupdate_received(data: FullUpdateData<EuclideanCircle>): void {
        this.last_update = data;//DEBUG
        // the own id should be available after the first update, as soon as we have it we can initialize stuff
        if (this.my_id == '') {
            // FullUpdate should include: 
            //   (a) player position(s) with timestamp <- don't send them twice
            //   (b) static map data
            //   (c) data for conference (conference id)
            // a & b together form the simulation on server & client: same datastructure, different methods to access them
            //core initialization includes incorporating the update in simulation & media_manager
            this.init_core(data);
            this.init_frontends();
        } else {
            this.simulation.incorporate_update(data.sim);
            this.media_manager.incorporate_update(data.conf);
        }
    }

    /**
     * Handle disconnection to the server.
     * @param data reason for disconnection
     */
    client_ondisconnect(data: string): void {
        console.log('Disconnected: ' + data);
    }

    /**
     * Responsible for determining the lag & synchronising server_time
     * @param data timestamp
     */
    client_on_pong(data: PongData): void {
        const now = Date.now();
        this.timer.register_pong(now, data);
    }
}
