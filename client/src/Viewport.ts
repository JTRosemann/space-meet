import { Game } from "../../common/src/Game";
import { Projectable } from "./Projectable";
import { Drawable } from "./Drawable";

/**
 * This class draws on the viewport.
 */

export class Viewport {
    private drawables: Drawable[] = [];
    private projectables: Projectable[] = [];
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private game: Game;
    private user_id: string;
    private show_support = false;
    private clip = false;
    private traces = false;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number, game: Game, user_id: string) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.game = game;
        this.user_id = user_id;
    }

    push_drawable(d: Drawable) {
        this.drawables.push(d);
    }

    push_projectable(p: Projectable) {
        this.projectables.push(p);
    }

    rm_drawable(id: string) {
        this.drawables = this.drawables.filter((d: Drawable) => d.item.id != id);
    }

    rm_projectable(id: string) {
        this.projectables = this.projectables.filter((d: Projectable) => d.item.id != id);
    }

    get_drawables(): Drawable[] {
        return Object.values(this.drawables);
    }

    draw() {
        //Clear the screen area
        if (this.ctx && !this.traces) { // && !this.traces
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
        const self_state = this.game.get_item_state(this.user_id);
        const self_rad = this.game.get_item_rad(this.user_id);
        if (this.ctx && self_state != undefined && self_rad != undefined) {
            this.ctx.save();
            const mid_x = this.width / 2;
            const mid_y = this.height / 2;
            this.ctx.translate(mid_x, mid_y);
            this.ctx.rotate(-Math.PI / 2);

            const self_state = this.game.get_item_state(this.user_id);
            
            this.ctx.rotate(-self_state.dir);
            if (this.show_support) {
                this.draw_rays();
            }
            this.draw_linear_projections();
            //draw circle
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.width / 6, 0, 2 * Math.PI);
            this.ctx.strokeStyle = "black";
            this.ctx.stroke();
            if (this.clip) {
                this.ctx.clip();
            }
            //this or several canvas layers may be used to prevent overwriting videos
            //this.ctx.globalCompositeOperation = 'destination-over';
            this.ctx.translate(-self_state.pos.x, -self_state.pos.y);
            this.ctx.strokeStyle = "red";
            this.ctx.strokeRect(0, 0, this.game.world.width, this.game.world.height);

            this.draw_icons();

            //    this.ctx.translate(this.get_self().state.pos.x, this.get_self().state.pos.y);
            //    this.ctx.rotate(this.get_self().state.dir);
            //    this.ctx.rotate(Math.PI/2);
            //    this.ctx.translate(-mid_x, -mid_y);
            this.ctx.restore(); // restore removes the need to reset the translations & rotations one by one
        }
        
    }

    private get_self_state() {
        return this.game.get_item_state(this.user_id);
    }

    private get_self_rad() {
        return this.game.get_item_rad(this.user_id);
    }
    
    private draw_icons() {
        for (const p of this.get_drawables()) {
            //if (p.item.id == this.user_id) continue;
            this.ctx.save();
            this.ctx.translate(p.item.state.pos.x, p.item.state.pos.y);
            this.ctx.rotate(p.item.state.dir); // beware: the coordinate system is mirrored at y-axis

            p.draw_icon(this.ctx, this.show_support);
            this.ctx.restore();
        }
    }

    private draw_gallery_projections() {
        
    }

    private draw_linear_projections() {
        const self_state = this.get_self_state();
        for (const p of this.projectables) {
            if (p.item.id == this.user_id)
                continue;

            const pos = p.item.state.pos.sub(self_state.pos);
            const abs_val = pos.abs();
            const dist_c = this.width / 6;

            const eps = 1;
            // use intercept theorem: (projector_rad + rad) / (abs_val) = (rad / player.rad) and solve it
            // prevent non-positive values in the divisor using Math.max(eps, ..)
            const max_rad = dist_c;
            // bound the maximum size of the radius
            const lin_rad = Math.min(p.item.rad * dist_c / Math.max(eps, abs_val - p.item.rad), max_rad);
            const rad = (this.game.on_podium(p.item.state.pos)) ? max_rad : lin_rad;
            const dist = dist_c + rad;
            const center_x = dist * pos.x / abs_val; //FIXME: divide by zero
            const center_y = dist * pos.y / abs_val;
            this.ctx.save();
            this.ctx.translate(center_x, center_y);
            this.ctx.rotate(self_state.dir + Math.PI / 2); // rewind the rotation from outside

            p.draw_projection(this.ctx, rad);

            this.ctx.restore();
        }
    }

    private draw_rays() {
        const self_state = this.get_self_state();
        const self_rad = this.get_self_rad();
        for (const p of this.get_drawables()) {
            this.ctx.beginPath();
            if (p.item.id == this.user_id)
                continue;
            console.log(p.item);
            const other_sub_self = p.item.state.pos.sub(self_state.pos);
            const alpha = Math.asin(self_rad / other_sub_self.abs());
            this.ctx.rotate(alpha);
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo((other_sub_self.x) * 10,
                (other_sub_self.y) * 10);
            this.ctx.rotate(-alpha);
            this.ctx.rotate(-alpha);
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo((other_sub_self.x) * 10,
                (other_sub_self.y) * 10);
            this.ctx.strokeStyle = "yellow";
            this.ctx.stroke();
            this.ctx.rotate(alpha);
        }
    }
}
