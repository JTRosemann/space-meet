import { rgba } from "../../common/src/util";
import { Item } from "../../common/src/Item";
import { Drawable } from "./Drawable";

export class ArrowShape implements Drawable {
    item: Item;
    color: string;
    
    constructor(item: Item) {
        this.item = item;
        this.color = rgba(255, 255, 255, 0.5);
    }

    draw_icon(ctx: CanvasRenderingContext2D, support: boolean = false): void {
        // the ctx should be appropriately rotated and translated
        //Set the color for this player
        ctx.fillStyle = this.color;

        if (support) {
            ctx.beginPath();
            ctx.arc(0, 0, this.item.rad, 0, 2 * Math.PI);
            ctx.strokeStyle = "yellow";
            ctx.stroke();
        }
        ctx.beginPath();
        const rt2 = Math.sqrt(0.5);
        ctx.moveTo(0, 0);
        ctx.lineTo(rt2 * -this.item.rad, rt2 * this.item.rad);
        ctx.lineTo(this.item.rad, 0);
        ctx.lineTo(rt2 * -this.item.rad, rt2 * -this.item.rad);
        ctx.closePath();
        ctx.fill();
    }
}
