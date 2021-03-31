import { Item } from "../../common/src/Item";
import { Drawable } from "./Drawable";

/**
 * TripleCircle draws three circles, that are stacked on to each other.
 */
export class TripleCircle implements Drawable {
    item: Item;
    private step: number;

    constructor(it: Item, step: number) {
        this.item = it;
        this.step = step;
    }

    draw_icon(ctx: CanvasRenderingContext2D, show_support: boolean = false): void {
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, this.item.rad, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.item.rad - this.step, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.item.rad - 2*this.step, 0, 2 * Math.PI);
        ctx.stroke();
    }
}
