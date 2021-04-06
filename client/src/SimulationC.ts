import { FullUpdateData } from "../../common/src/protocol";
import { Simulation } from "./Simulation";
import { Snap } from "./Snap";

export class SimulationC implements Simulation {

    static establish(data: FullUpdateData): SimulationC {
        throw new Error("Method not implemented.");
    }

    incorporate_update(data: FullUpdateData) {
        throw new Error("Method not implemented.");
    }

    snapshot() : Snap {
        throw new Error("Method not implemented.");
    }
}
