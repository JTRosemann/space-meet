import { Item } from "../../common/src/Item";

export interface Drawable {
    item: Item;
    draw_icon(ctx: CanvasRenderingContext2D, show_support: boolean): void;
}
