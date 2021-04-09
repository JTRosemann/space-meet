import { CarrierClient, FullUpdateData, ResponderClient } from "../../common/src/protocol";
import { Debugger } from "./Debugger";
import { FrontEnd as Frontend } from "./Frontend";
import * as sio from 'socket.io-client';
import { HybridMap } from "./HybridMap";
import { SimulationC } from "./SimulationC";
import { Simulation } from "./Simulation";
import { Auditorium } from "./Auditorium";
import { MediaManager } from "./MediaManager";
import { ViewSelector } from "./ViewSelector";
import { InputProcessor } from "./InputProcessor";
import { InterpretedInput } from "./InterpretedInput";
import { TrnMvInputProcessor } from "./TrnMvInputProcessor";
import { EuclideanCircle } from "./EuclideanCircle";

/**
 * This class represents a client UI.
 * It manages several FrontEnds for Visua-/Audiolization and a debugging menu.
 * This is also the first responder for all messages from the server.
 */
export class ClientInstance implements ResponderClient {
    private viewport: HTMLCanvasElement;
    private carrier: CarrierClient;
    private debugger: Debugger;
    private simulation: Simulation<EuclideanCircle>;
    private in_proc: InputProcessor<EuclideanCircle>;
    private media_manager: MediaManager;
    private view_selector: ViewSelector<EuclideanCircle>;
    private audioFrontend: Frontend;
    private videoFrontend: Frontend;
    private my_id: string;

    constructor(viewport: HTMLCanvasElement) {
        if (String(window.location).indexOf('debug') != -1 ) {
            // if desired, a debugging UI is created
            // TODO: the debugger needs access to some interface view of this
            // TODO: a GUI could be instantiated in a similar way
            this.debugger = new Debugger();
        }
        this.viewport = viewport;
        this.connect_to_server();
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
    }

    /**
     * Instantiate simulation, media_manager & view_selector.
     * This is only possible as soon as we have received the first server update.
     * @param data the data to create the initial simulation etc
     */
    private init_core(data: FullUpdateData) {
        this.simulation = SimulationC.establish(data);
        this.media_manager = new MediaManager(data);
        this.in_proc = new TrnMvInputProcessor();
        this.my_id = this.carrier.get_id();
        this.view_selector = new ViewSelector(this.simulation, this.my_id);
    }

    /**
     * Initialize the different frontends and start the animation loop.
     */
    private init_frontends() {
        //TODO frontends shouldn't need the simulation. (nor the media_manager?)
        this.videoFrontend = new HybridMap(this.simulation, this.media_manager, this.viewport);
        this.audioFrontend = new Auditorium(this.simulation, this.media_manager);
        //start animation loop
        this.run();
    }

    private read_sync_input() : InterpretedInput<EuclideanCircle> {
        const input = this.in_proc.fetch_input();
        //TODO update input here & on server
        this.view_selector.register_input(input);
        //this.carrier.emit_input(input);
        return input;
    }

    /**
     * Produce a snap of the simulation and hit the frontends to render it.
     */
    run() {
        const tbuf = 100;//ms // TODO: make the smoothening buffer dynamic
        const input = this.read_sync_input();
        const snap = this.view_selector.select_view(tbuf, input);
        //TODO: connect snap with media
        this.videoFrontend.animate(snap);
        this.audioFrontend.animate(snap);
        window.requestAnimationFrame(this.run.bind(this));
    }

    /**
     * This is the server-update handler.
     * Whenever a server-update is received the simulation and the mediaManager are updated accordingly.
     * If it's the first message from the server, simulation, mediaManager and both Frontends have to be inittialized as well.
     * @param data update received from server
     */
    client_onserverupdate_received(data: FullUpdateData): void {
        // the own id should be available after the first update, as soon as we have it we can initialize stuff
        if (this.my_id == '') {
            //TODO change FullUpdateData into Simulation-like format (+ Conf id ?)
            //core initialization includes incorporating the update in simulation & media_manager
            this.init_core(data);
            this.init_frontends();
        } else {
            this.simulation.incorporate_update(data);
            this.media_manager.incorporate_update(data);
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
     * Responsible for determining the lag.
     * @param data timestamp
     */
    client_on_pong(data: number): void {
        //TODO implement
        throw new Error("Method not implemented.");
    }
}
