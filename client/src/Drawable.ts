import { Item } from "../../common/src/game.core";

export interface Drawable {
    item: Item;
    draw_icon(ctx: CanvasRenderingContext2D, show_support: boolean): void;
}
