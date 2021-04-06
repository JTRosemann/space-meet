import { Simulation } from "./Simulation";
import { Snap } from "./Snap";
import { InterpretedInput } from "./InterpretedInput";

/**
 * This class is responsible for producing the snapshot of the simulation,
 * that is to be rendered.
 * This includes interpolating the correct position at a given time for all players
 * and predicting the position of the cllient-controlled player according to the inputs,
 * as well as emitting the inputs to the server using the input processor.
 * Here only geometric information is handled - not the respective media.
 */
export class ViewSelector {
    private simulation: Simulation;
    private viewer_id: string;

    constructor(simulation: Simulation, viewer_id: string) {
        this.simulation = simulation;
        this.viewer_id = viewer_id;
    }

    private snapshot(tbuf: number) : Snap {
        //TODO: where is which code for interpolation?
        // we need a for loop over players, interpolating eachs position
        // interpolation should be in the geometry model
        throw new Error("Method not implemented.");
    }

    /**
     * Select a view of the simulation:
     * For all other players the position they had at now - tbuf is interpolated,
     * using the server data.
     * For the controlling player the last server update is used.
     * All inputs that are newer than that update are played upon it.
     * @param tbuf the time difference in ms between now and the view to be rendered
     */
    select_view(tbuf: number, input: InterpretedInput): Snap {
        // make a snap from the past
        const snap = this.snapshot(tbuf);
        // update the current state of this player with read inputs
        const curr_state = snap.get_player_state(this.viewer_id);
        const predict_me = input.apply_to(curr_state);
        snap.set_player(this.viewer_id, predict_me);
        // return smoothened & predicted snap
        return snap;
    }
}
