import { FrontEnd as Frontend } from "./Frontend";
import { MediaManager } from "./MediaManager";
import { Snap } from "../../common/src/Snap";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { EuclideanStepPhysics } from "../../common/src/EuclideanStepPhysics";
import { EuclideanCircleSnap } from "../../common/src/EuclideanCircleSnap";

export class HybridMap implements Frontend<EuclideanCircle> {

    private mediaManager: MediaManager;
    private viewport: HTMLCanvasElement;
    private viewer_id: string;

    constructor(mediaManager: MediaManager, viewport: HTMLCanvasElement, viewer_id: string) {
        this.mediaManager = mediaManager;
        this.viewport = viewport;
        this.viewer_id = viewer_id;
        //Adjust viewport size
        viewport.width = viewport.offsetWidth;
        viewport.height = viewport.offsetHeight;
    }

    render(snap: Snap<EuclideanCircle>): void {
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
        this.draw_circle(ctx, width);
        //MAYDO enable (parameterised) clipping
        /*if (this.clip) {
            ctx.clip();
        }*/

        //save unscaled ctx to be restored, scale into map scale, translate to self position
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-self_state.get_pos().get_x(), -self_state.get_pos().get_y());

        //draw boundaries
        this.draw_border(ctx, map_width, map_height);

        //draw zones

        //draw player icons

        //draw bubbles
    }

    private draw_circle(ctx: CanvasRenderingContext2D, width: number) {
        ctx.beginPath();
        // radius= width / 6, to make sure another circle of same size fits everywhere around
        ctx.arc(0, 0, width / 6, 0, 2 * Math.PI);
        ctx.strokeStyle = "black"; //MAYDO Paramaterize
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
        ctx.strokeStyle = "red";//MAYDO Parameterize
        ctx.lineWidth = 0.02;//TODO should lineWidth be (de-)scaled? TODO Parametrize
        ctx.strokeRect(0, 0, map_width, map_height);
    }
}
