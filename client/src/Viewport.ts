import { Game } from "../../common/src/Game";
import { Projectable } from "./Projectable";
import { Drawable } from "./Drawable";
import { vec } from "../../common/src/vec";

/**
 * This class draws on the viewport.
 * It holds a list of drawables and projectables.
 * Drawables are drawn at their position relative to the viewer.
 * Projectables are drawn as projection of their relative position to the viewer on a screen in between.
 * There are different modes for projections, they vary in size and arrangement.
 */

export class Viewport {
    private drawables: Drawable[] = [];
    private projectables: Projectable[] = [];
    private viewport: HTMLCanvasElement;
    private game: Game;
    private user_id: string;
    private show_support = false;
    private clip = false;
    private traces = false;

    constructor(viewport: HTMLCanvasElement, game: Game, user_id: string) {
        this.viewport = viewport;
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

    draw(gallerymode: boolean = false, sqrt: boolean) {
        // get a fresh context - this is necessary in case some resizing has happenend
        const ctx = this.viewport.getContext('2d');
        this.viewport.width = this.viewport.offsetWidth;
        this.viewport.height = this.viewport.offsetHeight;
        const width = this.viewport.width;
        const height = this.viewport.height;
        const scale = width/480;
        //Clear the screen area
        if (ctx && !this.traces) { // && !this.traces
            ctx.clearRect(0, 0, width, height);
        }
        const self_state = this.game.get_item_state(this.user_id);
        const self_rad = this.game.get_item_rad(this.user_id);
        // only draw if neccary information is available
        if (ctx && self_state != undefined && self_rad != undefined) {
            // move self to center and rotate in direction of self -π/2
            const mid_x = width / 2;
            const mid_y = height / 2;
            ctx.translate(mid_x, mid_y);
            ctx.rotate(-Math.PI / 2);
            
            ctx.rotate(-self_state.dir);
            // the content that is still to be rendered is on the map,
            // it has to be scaled appropriatly

            // if enabled clip the map outside of the circle
            if (this.clip) {
                ctx.clip();
            }
            ctx.save();
            ctx.scale(scale, scale);
            //this or several canvas layers may be used to prevent overwriting videos
            //this.ctx.globalCompositeOperation = 'destination-over';
            ctx.translate(-self_state.pos.x, -self_state.pos.y);
            ctx.strokeStyle = "red";
            ctx.strokeRect(0, 0, this.game.world.width, this.game.world.height);

            this.draw_icons(ctx);

            //    this.ctx.translate(this.get_self().state.pos.x, this.get_self().state.pos.y);
            //    this.ctx.rotate(this.get_self().state.dir);
            //    this.ctx.rotate(Math.PI/2);
            //    this.ctx.translate(-mid_x, -mid_y);
            ctx.restore(); // restore removes the need to reset the translations & rotations one by one
            // the projections are the last thing to be drawn
            // draw appropriate projections, potentially with supporting lines
            if (this.show_support) {
                this.draw_rays(ctx);
            }
            if (gallerymode) {
                this.draw_gallery_projections(ctx, width);
            } else {
                this.draw_positional_projections(ctx, width, sqrt);
            }
            //draw circle around self
            ctx.beginPath();
            ctx.arc(0, 0, width / 6, 0, 2 * Math.PI);
            ctx.strokeStyle = "black";
            ctx.stroke();
        }
        
    }

    private get_self_state() {
        return this.game.get_item_state(this.user_id);
    }

    private get_self_rad() {
        return this.game.get_item_rad(this.user_id);
    }
    
    private draw_icons(ctx: CanvasRenderingContext2D) {
        const rev = this.get_drawables().reverse();
        for (const p of rev) {
            //if (p.item.id == this.user_id) continue;
            ctx.save();
            ctx.translate(p.item.state.pos.x, p.item.state.pos.y);
            ctx.rotate(p.item.state.dir); // beware: the coordinate system is mirrored at y-axis

            p.draw_icon(ctx, this.show_support);
            ctx.restore();
        }
    }

    private get_rel_angle(v: vec) {
        const self_state = this.get_self_state();
        const sub = v.sub(self_state.pos);
        return sub.angle();
    }

    /**
     * This method draws projections as a gallery:
     * Each projection has the same size independent from distance to the viewer.
     * The projection are drawn loosely in the (angular) order they appear to the viewer,
     * while maximizing the size of the projections.
     * @param ctx context to be drawn upon
     * @param width width of said context
     */
    private draw_gallery_projections(ctx: CanvasRenderingContext2D, width: number) {
        const self_state = this.get_self_state();
        // sort projectables by their angle relative to the self_player
        const sorted = this.projectables.sort(
            (a: Projectable, b: Projectable) =>
             this.get_rel_angle(a.item.state.pos) - this.get_rel_angle(b.item.state.pos));
        const dist_c = width / 6;
        // support for a second row if there are more than 9 player
        const num = sorted.length; // number of players
        const min_pr = 9; // minimum of number of bubbles such that two rows are possible
        const per_row = num > min_pr ? Math.max(min_pr, Math.ceil(num/2)) : num;
        // use law of sines to compute the radius:
        // r / sin (α/2) = r + p / sin (π/2) = r + p
        // where α is 2π / n
        const alpha = 2*Math.PI / per_row; // divide the full circle by the number of players per row
        const half_alpha = alpha / 2;
        const r = Math.min(dist_c, dist_c / (1/Math.sin(half_alpha) - 1));
        let n = 0;
        for (const p of sorted) {
            let pos: vec;
            if (n < per_row) {
                pos = vec.from_polar(r + dist_c, n*alpha);
            } else if (n >= per_row) {
                const x = r*Math.tan(Math.PI/3); // <-- FIXME this is imprecise
                pos = vec.from_polar(r + dist_c + x, n*alpha - half_alpha);
            }
            this.positional_draw_projection(ctx, pos.x, pos.y, r, p);
            n++;
        }
    }

    /**
     * Draw a given projectable at a given position with a given radius.
     * @param ctx context to be drawn upon
     * @param center_x x coordinate of center
     * @param center_y y coordinate of center
     * @param rad radius
     * @param p projectable to be drawn
     */
    private positional_draw_projection(ctx: CanvasRenderingContext2D, center_x: number, center_y: number, rad: number, p: Projectable) {
        ctx.save();
        ctx.translate(center_x, center_y);
        ctx.rotate(this.get_self_state().dir + Math.PI / 2); // rewind the rotation from outside
        p.draw_projection(ctx, rad);
        ctx.restore();
    }

    /**
     * Draw the projectables as actual positional projections:
     * The projection is drawn at the same angle as the corresponding item is viewed from the viewer,
     * and the radius is either 1/d or 1/√d depending on the flag `sqrt` where d is the distance relative to the viewer.
     * @param ctx context to be drawn upon
     * @param width width of said context
     * @param sqrt boolean flag to indicate how to compute the radius from the distance.
     */
    private draw_positional_projections(ctx: CanvasRenderingContext2D, width: number, sqrt: boolean) {        
        const self_state = this.get_self_state();
        // order projectables in reverse order with respect to distance, i.e. furthest first
        const sorted = this.projectables.sort(
            (a: Projectable, b: Projectable) =>
             self_state.pos.sub(b.item.state.pos).abs() - self_state.pos.sub(a.item.state.pos).abs());
        for (const p of sorted) {
            if (p.item.id == this.user_id)
                continue;

            const pos = p.item.state.pos.sub(self_state.pos);
            const abs_val = pos.abs();
            const dist_c = width / 6;

            const eps = 1;
            // use intercept theorem: (projector_rad + rad) / (abs_val) = (rad / player.rad) and solve it
            // prevent non-positive values in the divisor using Math.max(eps, ..)
            const max_rad = dist_c;
            // bound the maximum size of the radius
            const lin_rad = p.item.rad * dist_c / Math.max(eps, abs_val - p.item.rad);
            const sqrt_rad = Math.sqrt(lin_rad/max_rad) * max_rad;
            const bounded_rad = Math.min(sqrt ? sqrt_rad : lin_rad, max_rad);
            const rad = (this.game.on_podium(p.item.state.pos)) ? max_rad : bounded_rad;
            const dist = dist_c + rad;
            const center_x = dist * pos.x / abs_val; //FIXME: divide by zero
            const center_y = dist * pos.y / abs_val;
            this.positional_draw_projection(ctx, center_x, center_y, rad, p);
        }
    }

    /**
     * Draw rays indicating the euclidian projected position of the corresponding item with respect to the viewer.
     * @param ctx context to be drawn upon
     */
    private draw_rays(ctx: CanvasRenderingContext2D) {
        const self_state = this.get_self_state();
        const self_rad = this.get_self_rad();
        for (const p of this.get_drawables()) {
            ctx.beginPath();
            if (p.item.id == this.user_id)
                continue;
            console.log(p.item);
            const other_sub_self = p.item.state.pos.sub(self_state.pos);
            const alpha = Math.asin(self_rad / other_sub_self.abs());
            ctx.rotate(alpha);
            ctx.moveTo(0, 0);
            ctx.lineTo((other_sub_self.x) * 10,
                (other_sub_self.y) * 10);
            ctx.rotate(-alpha);
            ctx.rotate(-alpha);
            ctx.moveTo(0, 0);
            ctx.lineTo((other_sub_self.x) * 10,
                (other_sub_self.y) * 10);
            ctx.strokeStyle = "yellow";
            ctx.stroke();
            ctx.rotate(alpha);
        }
    }
}
