import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Snap } from "../../common/src/Snap";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { EuclideanCircleSnap } from "../../common/src/EuclideanCircleSnap";
import { Effector } from "../../common/src/Effector";
import { Podium } from "../../common/src/Podium";
import { TripleCircle } from "./TripleCircle";
import { Drawable } from "./Drawable";
import { EuclideanVector } from "../../common/src/EuclideanVector";
import { ArrowShape } from "./ArrowShape";
import { JitsiProjectable } from "./JitsiProjectable";
import { Projectable } from "./Projectable";
import { ClientConfig } from "./ClientConfig";

export class HybridMap implements Frontend<EuclideanCircle> {

    private mediaManager: MediaManager;
    private viewport: HTMLCanvasElement;
    private viewer_id: string;

    //TODO make parameters accessible
    private border_style = "red";
    private circle_style = "black";
    private player_color = "grey";//MAYDO make it customizable
    private line_width = 2;

    constructor(mediaManager: MediaManager, viewport: HTMLCanvasElement, viewer_id: string) {
        this.mediaManager = mediaManager;
        this.viewport = viewport;
        this.viewer_id = viewer_id;
        //Adjust viewport size
        viewport.width = viewport.offsetWidth;
        viewport.height = viewport.offsetHeight;
        console.warn("HybridMap doesn't apply effectors");//TODO fix this
    }

    /**
     * Render the hybrid map from the snap:
     * - render a relatively orientated map
     * - render a the videos as bubbles around the player
     * @param snap snap to render
     */
    render(snap: Snap<EuclideanCircle>, client_cfg: ClientConfig): void {
        //MAYDO find a better way (generalize over physics?) 
        const eu_snap = snap as EuclideanCircleSnap;

        // get a fresh context - this is necessary in case some resizing has happenend
        const ctx = this.viewport.getContext('2d');
        this.viewport.width = this.viewport.offsetWidth;
        this.viewport.height = this.viewport.offsetHeight;
        const map_width = eu_snap.get_width();
        const map_height = eu_snap.get_height();
        const width = this.viewport.width;
        const height = this.viewport.height;
        // width should equal height
        if (width != height) console.warn('viewport width - height = ' + (width - height));
        const scale = width/map_width; //TODO map_width is not the right way to scale

        //Clear the screen area
        // if (!this.traces) //MAYDO add trace support
        ctx.clearRect(0, 0, width, height);

        //rotate according to self position and center the context
        const self_state = eu_snap.get_player_state(this.viewer_id);
        if (self_state == undefined) {
            //Don't render without self_state (shouldn't even be called)
            throw Error("try to render without player state");
        }
        this.align_ctx(ctx, self_state, width);
        
        //draw circle & (may) clip
        ctx.lineWidth = this.line_width;
        this.draw_circle(ctx, width);
        //MAYDO enable (parameterised) clipping
        /*if (this.clip) {
            ctx.clip();
        }*/

        //save unscaled ctx to be restored, scale into map scale, translate to self position
        ctx.save();
        ctx.scale(scale, scale);
        ctx.lineWidth = this.line_width/scale; //descale line width
        ctx.translate(-self_state.get_pos().get_x(), -self_state.get_pos().get_y());

        //draw boundaries
        this.draw_border(ctx, map_width, map_height);

        //draw zones
        this.draw_zones(ctx, eu_snap.get_effectors());

        //draw player icons
        this.draw_players(ctx, Object.values(eu_snap.get_states()));

        //draw bubbles
        ctx.restore();
        this.draw_positional_projections(ctx, snap, width, true, client_cfg);
    }

    private draw_circle(ctx: CanvasRenderingContext2D, width: number) {
        ctx.beginPath();
        // radius= width / 6, to make sure another circle of same size fits everywhere around
        ctx.arc(0, 0, width / 6, 0, 2 * Math.PI);
        ctx.strokeStyle = this.circle_style;
        ctx.stroke();
    }

    private align_ctx(ctx: CanvasRenderingContext2D, self_state: EuclideanCircle, width: number) {
        // move self to center and rotate in direction of self -π/2
        const mid = width / 2;
        ctx.translate(mid, mid);
        ctx.rotate(-Math.PI / 2);        
        ctx.rotate(- self_state.get_dir());
    }

    private draw_border(ctx : CanvasRenderingContext2D, map_width: number, map_height: number) {
        ctx.strokeStyle = this.border_style;
        ctx.strokeRect(0, 0, map_width, map_height);
    }

    private draw_zones(ctx: CanvasRenderingContext2D, effectors: Effector<EuclideanCircle>[]) {
        for (const e of effectors) {
            if (e instanceof Podium) {
                const drawable = this.create_podium_drawable(ctx, e);
                const pos = e.get_pos();
                this.draw_transl_rot(ctx, drawable, pos, 0);
            }
        }
    }

    private draw_players(ctx: CanvasRenderingContext2D, states : EuclideanCircle[]) {
        for (const s of states) {
            const drawable = new ArrowShape(s.get_rad(), this.player_color);
            this.draw_transl_rot(ctx, drawable, s.get_pos(), s.get_dir());
        }
    }

    private create_podium_drawable(ctx: CanvasRenderingContext2D, p: Podium) : Drawable {
        const pos = p.get_pos();
        const rad = p.get_rad();
        const step = rad / 6; // make sure there is still space after the step
        return new TripleCircle(rad, step);
    }

    private draw_transl_rot(
            ctx: CanvasRenderingContext2D, d: Drawable, pos: EuclideanVector, dir: number) {
        ctx.save();
        ctx.translate(pos.get_x(), pos.get_y());
        ctx.rotate(dir);
        d.draw_icon(ctx);
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
     private draw_positional_projections(ctx: CanvasRenderingContext2D, snap: Snap<EuclideanCircle>,
            width: number, sqrt: boolean, client_cfg: ClientConfig) {
        const self_state = snap.get_player_state(this.viewer_id);
        // order projectables in reverse order with respect to distance, i.e. furthest first
        let players : [string,EuclideanCircle][] = [];
        const all_states = snap.get_states();
        for (const id of Object.keys(all_states)) {
            if (id != this.viewer_id) {
                players.push([id,all_states[id]]);
            }
        }
        const sorted = players.sort(
            (a: [string,EuclideanCircle], b: [string,EuclideanCircle]) =>
             self_state.get_pos().sub(b[1].get_pos()).get_abs()
              - self_state.get_pos().sub(a[1].get_pos()).get_abs());
        for (const idp of sorted) {
            const p = idp[1];
            const id = idp[0];
            const pos = p.get_pos().sub(self_state.get_pos());
            const abs_val = pos.get_abs();
            const dist_c = width / 6;

            const eps = 0.0001;
            // use intercept theorem: (projector_rad + rad) / (abs_val) = (rad / player.rad) and solve it
            // prevent non-positive values in the divisor using Math.max(eps, ..)
            const max_rad = dist_c;
            // bound the maximum size of the radius
            const lin_rad = p.get_rad() * dist_c / Math.max(eps, abs_val - p.get_rad());
            const sqrt_rad = Math.sqrt(lin_rad/max_rad) * max_rad;
            const bounded_rad = Math.min(sqrt ? sqrt_rad : lin_rad, max_rad);
            const rad = client_cfg.is_maximized(id) ? max_rad : bounded_rad;
            const dist = dist_c + rad;
            const center_x = dist * pos.get_x() / abs_val; //FIXME: divide by zero
            const center_y = dist * pos.get_y() / abs_val;
            const proj = new JitsiProjectable(rad, this.mediaManager.get_video(id));
            this.positional_draw_projection(ctx, self_state.get_dir(), center_x, center_y, rad, proj);
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
    private positional_draw_projection(ctx: CanvasRenderingContext2D, self_angle: number,
            center_x: number, center_y: number, rad: number, p: Projectable) {
        ctx.save();
        ctx.translate(center_x, center_y);
        ctx.rotate(self_angle + Math.PI / 2); // rewind the rotation from outside
        p.draw_projection(ctx);
        ctx.restore();
    }
}
