import { CarrierClient, FullUpdateData, PongData, ResponderClient } from "../../common/src/protocol";
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
import { Snap } from "../../common/src/Snap";
import { ClientEffects } from "./ClientEffects";
import { Debugger } from "./Debugger";
import { RessourceMap } from "../../common/src/RessourceMap";

/**
 * This class represents a client UI.
 * It manages several FrontEnds for Visua-/Audiolization and a debugging menu.
 * This is also the first responder for all messages from the server.
 */
export class ClientInstance implements ResponderClient<EuclideanCircle> {

    private static ping_interval = 100;//ms
    private static input_interval = 91;
    private static remote : string = '';//TODO purge static variables

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

    /**
     * Connect to the server.
     * The own socket ID is only visible after the first server message is witnessed.
     */
    constructor(viewport: HTMLCanvasElement) {
        const socket = sio.connect();
        console.log('Connect to server with id ' + socket.id)// here we don't know the id yet
        this.carrier = new CarrierClient(socket, this);
        if (String(window.location).indexOf('debug') != -1 ) {
            // if desired, a debugging UI is created
            // TODO: the debugger needs access to some interface view of this
            // TODO: a GUI could be instantiated in a similar way
            this.debugger = new Debugger(this.carrier);
        }
        this.viewport = viewport;
        this.timer = new Timer(this.debugger);
        this.my_id = '';
        console.warn("client prediction disabled");
        this.ping_server();
    }

    private ping_server() {
        const ping = this.timer.get_server_time();
        this.carrier.emit_ping(ping);
        window.setTimeout(this.ping_server.bind(this), ClientInstance.ping_interval);
    }

    /**
     * Instantiate simulation, media_manager & view_selector.
     * This is only possible as soon as we have received the first server update.
     * @param data the data to create the initial simulation etc
     */
    private init(data: FullUpdateData<EuclideanCircle>) {
        this.simulation = ClientSimulation.establish(data.sim);
        const res_map = RessourceMap.establish(data.res_map);
        this.my_id = this.carrier.get_id();
        ClientInstance.remote = this.my_id;
        if (!this.simulation.has_player(this.my_id)) {
            // resilience against old messages (due to lag) (actually probably only bc. of fake_lag)
            // we have to ignore update that don't include us
            this.my_id = '';
            return;
        }
        this.media_manager = new MediaManager(res_map, this.my_id, this.carrier);
        this.in_proc = new ArrowInputProcessor(
            this.simulation.get_latest_state_time(this.my_id));
        this.view_selector = new ViewSelector(this.simulation, this.my_id);
        this.init_frontends();
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
        console.log('Start animation loop');
        // read the input and distribute it
        this.read_sync_input();
        console.log('Start listening for inputs');
    }

    /**
     * Read input, register it in the ViewSelector and emit it to the server.
     * @returns the read input
     */
    private read_sync_input() {
        const server_time = this.timer.get_server_time();
        const input = this.in_proc.fetch_input(server_time);
        //if (input == undefined) return;
        // register input for client prediction
        this.view_selector.register_input(input, server_time);
        // emit input to server
        const input_msg = {
            input: input,
            id: ClientInstance.remote
        };
        this.carrier.emit_input(input_msg);
        window.setTimeout(this.read_sync_input.bind(this), ClientInstance.input_interval);
    }

    /**
     * Produce a snap of the simulation and hit the frontends to render it.
     */
    run() {
        const server_time = this.timer.get_server_time();
        const self_time = this.timer.get_self_time();
        const others_time = this.timer.get_others_time();
        // select a snapshot to render
        const snap = this.view_selector.select_view(others_time, self_time);
        // render the chosen snapshot of the simulation
        const client_cfg = this.create_client_config(snap);
        this.videoFrontend.render(snap, client_cfg);
        this.audioFrontend.render(snap, client_cfg);
        // this guarantees updates forever
        window.requestAnimationFrame(this.run.bind(this));
    }

    private create_client_config(snap: Snap<EuclideanCircle>) {
        const effs = snap.get_effectors();
        const client_cfg = new ClientEffects();
        effs.forEach(eff => {
            eff.provoke(client_cfg, snap);
        });
        return client_cfg;
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
            this.init(data);
        } else {
            this.simulation.incorporate_update(data.sim);
            this.media_manager.incorporate_update(RessourceMap.establish(data.res_map));
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
