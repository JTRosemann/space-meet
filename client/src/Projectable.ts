import { Item } from "../../common/src/Item";

export interface Projectable {
    item: Item;
    draw_projection(ctx: CanvasRenderingContext2D, rad: number): void;
}
