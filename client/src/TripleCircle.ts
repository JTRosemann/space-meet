import { Item } from "../../common/src/Item";
import { Drawable } from "./Drawable";


export class TripleCircle implements Drawable {
    item: Item;

    constructor(it: Item) {
        this.item = it;
    }

    draw_icon(ctx: CanvasRenderingContext2D, show_support: boolean = false): void {
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(0, 0, this.item.rad, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.item.rad - 4, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.item.rad - 8, 0, 2 * Math.PI);
        ctx.stroke();
    }
}
