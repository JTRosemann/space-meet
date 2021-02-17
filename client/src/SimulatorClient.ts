import { Game } from "../../common/src/Game";
import { Item } from "../../common/src/game.core";
import { CarrierClient, ServerUpdateData } from "../../common/src/protocol";
import { Queue } from "../../common/src/Queue";
import { Simulator } from "../../common/src/Simulator";
import { InputController } from "./InputController";
import { ServerPlayerData } from "./ServerPlayerData";
import { SelfPlayer } from "./SelfPlayer";
import { OtherPlayer } from "./OtherPlayer";
import { Projectable } from "./Projectable";
import { Drawable } from "./Drawable";

export class SimulatorClient {
    static update_loop = 45;//ms
    user_id: string;
    sim: Simulator;
    server_data: Record<string,Queue<ServerPlayerData>>;
    carrier: CarrierClient;
    drawables: Drawable[] = [];
    projectables: Projectable[] =[];
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    in_ctrl: InputController;
    show_support: false;
    traces = false;
    clip = true;
    
    constructor(game: Game, time: number, carrier: CarrierClient, id: string, 
            ctx: CanvasRenderingContext2D, width: number, height: number,
            listener: AudioListener, panners: Record<string, PannerNode>) {
        this.server_data = {};
        this.sim = new Simulator(game);
        this.carrier = carrier;
        this.user_id = id;
        this.push_game_data(game.get_items(), time);
        this.init_controllers(game, listener, panners);
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        // init input controller
        this.in_ctrl = new InputController(this.carrier);
    }

    init_controllers(game: Game, listener: AudioListener, panners: Record<string,PannerNode>) {
        for (const it of game.get_items()) {
            if (it.id == this.user_id) {
                // init self (controls listener)
                const p = new SelfPlayer(it.id, game, this.server_data[it.id], listener);
                this.sim.put_player(p);
            } else {
                // init other players (control pannernodes)
                this.push_player(it.id, panners[it.id]);
            }
        }
    }

    start() {
        window.requestAnimationFrame(this.do_update.bind(this));
    }

    do_update(timestamp) {
        //Clear the screen area
        if (this.ctx && !this.traces) { // && !this.traces
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
        //capture inputs from local player & send them to the server
        this.in_ctrl.update(42, timestamp);
        //draw
        if (this.ctx) {
            this.ctx.save();
            const mid_x = this.width/2;
            const mid_y = this.height/2;
            this.ctx.translate(mid_x, mid_y);
            this.ctx.rotate(-Math.PI/2);

            const self_state = this.sim.game.get_item_state(this.user_id);
            const self_rad = this.sim.game.get_item_rad(this.user_id);

            this.ctx.rotate(-self_state.dir);
            if (this.show_support) {
                for (const p of this.drawables) {
                    this.ctx.beginPath();
                    if (p.item.id == this.user_id) continue;
                    const other_sub_self = p.item.state.pos.sub(self_state.pos);
                    const alpha = Math.asin(self_rad / other_sub_self.abs());
                    this.ctx.rotate(alpha);
                    this.ctx.moveTo(0,0);
                    this.ctx.lineTo((other_sub_self.x)*10,
                            (other_sub_self.y)*10);
                    this.ctx.rotate(-alpha);
                    this.ctx.rotate(-alpha);
                    this.ctx.moveTo(0,0);
                    this.ctx.lineTo((other_sub_self.x)*10,
                            (other_sub_self.y)*10);
                    this.ctx.strokeStyle = "yellow";
                    this.ctx.stroke();
                    this.ctx.rotate(alpha);
                }
            }
            for (const p of this.projectables) {
                if (p.item.id == this.user_id) continue;

                const pos = p.item.state.pos.sub(self_state.pos);
                const abs_val = pos.abs();
                const dist_c = this.width/6;

                const eps = 1;
                // use intercept theorem: (projector_rad + rad) / (abs_val) = (rad / player.rad) and solve it
                // prevent non-positive values in the divisor using Math.max(eps, ..)
                const max_rad = dist_c;
                // bound the maximum size of the radius
                const rad = Math.min(p.item.rad * dist_c / Math.max(eps,abs_val - p.item.rad), max_rad);
                const dist = dist_c + rad;
                const center_x = dist * pos.x / abs_val;//FIXME: divide by zero
                const center_y = dist * pos.y / abs_val;
                this.ctx.save();
                this.ctx.translate(center_x, center_y);
                this.ctx.rotate(self_state.dir + Math.PI/2); // rewind the rotation from outside

                p.draw_projection(this.ctx, rad);

                this.ctx.restore();
            }
            //draw circle
            this.ctx.beginPath();
            this.ctx.arc(0,0, this.width/6, 0, 2*Math.PI);
            this.ctx.strokeStyle = "black";
            this.ctx.stroke();
            if (this.clip) {
                this.ctx.clip();
            }
            //    this.ctx.fillStyle = "#FF0000";
            //    this.ctx.fillRect(-10, -10, 20, 20);// rotation point

            this.ctx.translate(-self_state.pos.x, -self_state.pos.y);
            //    this.ctx.fillStyle = "#FF8800";
            //    this.ctx.fillRect(-10, -10, 20, 20);// (0,0)
            this.ctx.strokeStyle = "red";
            this.ctx.strokeRect(0,0,this.sim.game.world.width,this.sim.game.world.height);
            for (const p of this.drawables) {
                if (p.item.id == this.user_id) continue;
                this.ctx.save();
                this.ctx.translate(p.item.state.pos.x,p.item.state.pos.y);
                this.ctx.rotate(p.item.state.dir); // beware: the coordinate system is mirrored at y-axis

                p.draw_icon(this.ctx, this.show_support);
                this.ctx.restore();
            }

            //    this.ctx.translate(this.get_self().state.pos.x, this.get_self().state.pos.y);
            //    this.ctx.rotate(this.get_self().state.dir);

            //    this.ctx.rotate(Math.PI/2);
            //    this.ctx.translate(-mid_x, -mid_y);
            this.ctx.restore(); // restore removes the need to reset the translations & rotations one by one
        }
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
        this.sim.rm_player(id);
    }

    push_player(id: string, panner: PannerNode) {
        const p = new OtherPlayer(id, this.sim.game, this.server_data[id], panner);
        this.sim.put_player(p);
    }
}
