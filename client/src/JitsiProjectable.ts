import { Conference } from "../../common/src/Conference";
import { Item, rgba } from "../../common/src/game.core";
import { Projectable } from "./Projectable";


export class JitsiProjectable implements Projectable {
    color: string; //TODO initialize here & drawable
    item: Item;
    conf: Conference;

    constructor(item: Item, conf: Conference) {
        this.item = item;
        this.color = rgba(255, 255, 255, 0.5);
        this.conf = conf;
    }

    draw_projection(ctx: CanvasRenderingContext2D, rad: number, support: boolean = false, video_enabled = true): void {
        // the ctx should be appropriately rotated and translated
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0 /*start_angle*/, 2 * Math.PI /*arc_angle*/);
        ctx.clip();
        if (video_enabled) {
            const vid = document.getElementById('vid' + this.conf.call_ids[this.item.id]) as HTMLVideoElement;
            if (vid) {
                const w = vid.offsetWidth;
                const h = vid.offsetHeight;
                if (w > h) { //landscape video input
                    const ratio = w / h;
                    const h_scaled = 2 * rad;
                    const w_scaled = ratio * h_scaled;
                    const diff = w_scaled - h_scaled;
                    ctx.drawImage(vid, -rad - diff / 2, -rad, w_scaled, h_scaled);
                } else { //portrait video input
                    const ratio = h / w;
                    const w_scaled = 2 * rad;
                    const h_scaled = ratio * w_scaled;
                    const diff = h_scaled - w_scaled;
                    ctx.drawImage(vid, -rad, -rad - diff / 2, w_scaled, h_scaled);
                }
            }
        } else {
            ctx.moveTo(-10, 10);
            ctx.lineTo(0, 0);
            ctx.lineTo(10, 10);
        }
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
}
