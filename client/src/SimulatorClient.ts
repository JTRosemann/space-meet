import { Game } from "../../common/src/Game";
import { State } from "../../common/src/State";
import { Item } from "../../common/src/Item";
import { CarrierClient, ServerUpdateData } from "../../common/src/protocol";
import { Queue } from "../../common/src/Queue";
import { Simulator } from "../../common/src/Simulator";
import { InputController } from "./InputController";
import { ServerPlayerData } from "./ServerPlayerData";
import { SelfPlayer } from "./SelfPlayer";
import { OtherPlayer } from "./OtherPlayer";
import { ArrowShape } from "./ArrowShape";
import { JitsiProjectable } from "./JitsiProjectable";
import { Conference } from "../../common/src/Conference";
import { vec } from "../../common/src/vec";
import { InputPlayer } from "../../common/src/InputPlayer";
import { PingController } from "./PingController";
import { Viewport } from "./Viewport";
import { TripleCircle } from "./TripleCircle";
import { Table } from "./Table";

/**
 * This class hosts the update loop (requestAnimationFrame).
 * It is responsible for updating the canvas.
 */
export class SimulatorClient {
    user_id: string;
    sim: Simulator;
    server_data: Record<string,Queue<ServerPlayerData>>;
    carrier: CarrierClient;
    viewport: Viewport;
    in_ctrl: InputController;
    show_support: false;
    gallerymode: boolean = false;
    sqrt: boolean = true;
    
    constructor(game: Game, time: number, carrier: CarrierClient, id: string, 
            viewport: HTMLCanvasElement,
            listener: AudioListener, panners: Record<string, PannerNode>, conf: Conference) {
        this.server_data = {};
        this.sim = new Simulator(game);
        this.carrier = carrier;
        this.user_id = id;
        this.viewport = new Viewport(viewport, game, id);
        this.push_game_data(game.get_items(), time);
        this.init_controllers(listener, panners, conf);
        // init input controller
        this.in_ctrl = new InputController(this.carrier);
    }

    init_controllers(listener: AudioListener, panners: Record<string,PannerNode>, conf: Conference) {
        const ping_ctrl = new PingController(this.carrier);
        this.sim.bots.push(ping_ctrl);
        const game = this.sim.game;
        for (const it of game.get_items()) {
            const its_state = game.get_item_state(it.id);
            if (it.id == this.user_id) {
                // init self (controls listener)
                const p = new SelfPlayer(it.id, game, this.server_data[it.id], listener);
                this.sim.put_player(p, its_state, game.std_rad);
                this.viewport.push_drawable(new ArrowShape(it));
            } else {
                // init other players (control pannernodes)
                if (panners[it.id]) {
                    this.push_player(it.id, its_state, panners[it.id], conf);
                }
            }
        }
        for (const pod of game.podiums) {
            this.viewport.push_drawable(new TripleCircle(pod, game.std_step));
        }
        for (const tab of game.tables) {
            this.viewport.push_drawable(new Table(tab));
        }
    }

    start() {
        window.requestAnimationFrame(this.do_update.bind(this));
    }

    disable_gallerymode() {
        this.gallerymode = false;
    }

    enable_gallerymode() {
        this.gallerymode = true;
    }

    disable_sqrt() {
        this.sqrt = false;
    }

    enable_sqrt() {
        this.sqrt = true;
    }

    do_update(timestamp: number) {
        //capture inputs from local player & send them to the server
        this.in_ctrl.update(42, timestamp);
        //draw
        this.viewport.draw(this.gallerymode, this.sqrt);
        //Work out the fps average
        //this.client_refresh_fps(); not needed yeeeeet

        //repeat
        window.requestAnimationFrame(this.do_update.bind(this))
    }

    on_pong(time: number) {
        //TODO implement (update latency)
    }

    incorporate_update(data: ServerUpdateData) {
        this.push_game_data(data.game, data.time);
    }

    private push_game_data(items: Item[], time: number) {
        for (const it of items) {
            if (this.server_data[it.id] == undefined) {
                this.server_data[it.id] = new Queue();
            }
            this.server_data[it.id].enqueue({state: it.state, time: time});
        }
    }
    
    rm_player(id: string) {
        this.viewport.rm_drawable(id);
        this.viewport.rm_projectable(id);
        this.sim.rm_player(id);
    }

    push_player(id: string, state: State, panner: PannerNode, conf: Conference) {
        if (this.server_data[id] == undefined) {
            this.server_data[id] = new Queue();
        }
        const p = new OtherPlayer(id, this.sim.game, this.server_data[id], panner, this.user_id);
        this.sim.put_player(p, state, this.sim.game.std_rad);
        const it = this.sim.game.get_item(id);
        this.viewport.push_drawable(new ArrowShape(it));
        this.viewport.push_projectable(new JitsiProjectable(it, conf));
    }
}
