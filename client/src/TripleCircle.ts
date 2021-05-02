import { EuclideanCircle } from "../../common/src/EuclideanCircle";
import { EuclideanVector } from "../../common/src/EuclideanVector";
import { Drawable } from "./Drawable";

/**
 * This class implements a drawable for a three layered circle.
 */
export class TripleCircle implements Drawable {

    private rad: number;
    private step: number;

    constructor(rad: number, step: number) {
        this.rad = rad;
        this.step = step;
    }

    /**
     * Draw a three layered circle.
     * @param ctx context to be drawn on
     * @param show_support 
     */
    draw_icon(ctx: CanvasRenderingContext2D, show_support: boolean = false): void {
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, this.rad, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.rad - this.step, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.rad - 2*this.step, 0, 2 * Math.PI);
        ctx.stroke();
    }
}
