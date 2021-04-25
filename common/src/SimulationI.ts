import { InterpretedInput } from "./InterpretedInput";

/**
 * The Simulation keeps information on different timestamps to interpolate between them.
 * It automatically removes old information at some point.
 * Only for the most recent information there is a guarantee, that it won't be removed:
 * Accesses to older information may result in just returning the most recent information.
 */
export interface SimulationI<S> {
    /**
     * Remove the player `id` from the simulation.
     * @param id of player to be removed
     */
    rm_player(id: string) : void;

    get_last_fixed_player_state_before(id: string, time: number) : S;

    /**
     * Freeze the last state before `time` of player `p_id` until `time` and return it.
     * @param p_id ID of the player to manipulate
     * @param time time before/until the freeze
     */
    freeze_last_player_state_before(p_id: string, time: number) : S;

    /**
     * Push an update for a dedicated player in the simulation at a dedicated time.
     * @param id ID of player to update
     * @param state new state
     * @param time timestamp of the update
     */
    push_update(id: string, state: S, time: number) : void;

    /**
     * Clear data strictly older than `time` in `id`s queque.
     * @param id ID of the player whose queque is to be cleared
     * @param time threshold before which everything is cleared on `id`s queue
     */
    clear_before(id: string, time: number) : void;

    /**
     * Clear all data strictly older than `time`.
     * @param time threshold before which everything is cleared on all queues
     */
    clear_all_before(time: string) : void;

    /**
     * Clear the queue of player id.
     * @param id ID of the player whose queue is to be cleared.
     */
    clear(id: string) : void;

    /**
     * Clear all player queues, keeping only access to the most recent state.
     */
    clear_all() : void;
}
