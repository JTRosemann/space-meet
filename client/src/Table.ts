import { Item } from "../../common/src/Item";
import { Drawable } from "./Drawable";

export class Table implements Drawable {
    item: Item;

    constructor(it: Item) {
        this.item = it;
    }

    draw_icon(ctx: CanvasRenderingContext2D, show_support: boolean): void {
        ctx.strokeStyle = 'green';
        //draw outer circle
        ctx.beginPath();
        ctx.arc(0, 0, this.item.rad, 0, 2 * Math.PI);
        ctx.setLineDash([4]);
        ctx.stroke();
        //(don't) draw inner circle
        //ctx.beginPath();
        // for now the inner circle has half the radius
        //ctx.arc(0, 0, this.item.rad / 2, 0, 2 * Math.PI);
        ctx.setLineDash([]); // reset line style to solid line
        //ctx.stroke();
    }
}
