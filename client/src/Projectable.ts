
export interface Projectable {
    /**
     * Draw the projection of this projetable with the given radius.
     * @param ctx context to be drawn on
     * @param rad radius of projection
     */
    draw_projection(ctx: CanvasRenderingContext2D): void;
}
