
/**
 * This interface must implemented by front-ends to instantiate effects.
 */
export interface PresentationConfig {
    /**
     * Mute a specific player.
     * @param id the player to be muted
     */
    mute(id: string): void;

    /**
     * Maximize a specific player: This can happen visually and acoustically.
     * @param id player to be maximized
     */
    maximize(id: string): void;
}
