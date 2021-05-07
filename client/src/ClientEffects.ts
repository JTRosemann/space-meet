import { PresentationConfig } from "../../common/src/PresentationConfig";


export class ClientEffects implements PresentationConfig {

    private muted: string[] = [];
    private maximized: string[] = [];

    /**
     * Mute a specific audio.
     * @param id to be muted
     */
    mute(id: string): void {
        this.muted.push(id);
    }

    /**
     * Maximize the player `id`.
     * @param id to be maximized
     */
    maximize(id: string): void {
        this.maximized.push(id);
    }

    /**
     * Check whether `id` is muted.
     * @param id of checked player
     * @returns boolean
     */
    is_muted(id: string) {
        return this.muted.includes(id);
    }

    /**
     * Check whether `id` is maximized.
     * @param id of checked player
     * @returns boolean
     */
    is_maximized(id: string) {
        return this.maximized.includes(id);
    }
}
