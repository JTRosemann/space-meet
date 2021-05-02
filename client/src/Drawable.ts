/**
 * An interface for objects that can be drawn on a CanvasRenderingContext2D.
 */
export interface Drawable {
    /**
     * Draw this Drawable.
     * @param ctx context to be drawn on
     */
    draw_icon(ctx: CanvasRenderingContext2D): void;
}
