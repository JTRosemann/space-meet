import { Drawable } from "./Drawable";

export class ArrowShape implements Drawable {
    
    private rad : number;
    private color: string;
    
    constructor(rad : number, color : string) {
        this.rad = rad;
        this.color = color;
    }

    /**
     * Draw an arrow pointing right, i.e. in polar coordinates: phi = 0.
     * @param ctx context to be drawn on
     */
    draw_icon(ctx: CanvasRenderingContext2D): void {
        // the ctx should be appropriately rotated and translated
        //Set the color for this player
        ctx.fillStyle = this.color;
        /*
        MAYDO support "support" lines, move this code at an appropriate place
        if (support) {
            ctx.beginPath();
            ctx.arc(0, 0, this.rad, 0, 2 * Math.PI);
            ctx.strokeStyle = "yellow";
            ctx.stroke();
        }
        */
        ctx.beginPath();
        const rt2 = Math.sqrt(0.5);
        ctx.moveTo(0, 0);//center
        ctx.lineTo(rt2 * -this.rad, rt2 * this.rad);//left stand
        ctx.lineTo(this.rad, 0);//arrowhead
        ctx.lineTo(rt2 * -this.rad, rt2 * -this.rad);//right stand
        ctx.closePath();
        ctx.fill();
    }
}
