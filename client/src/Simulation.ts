import { FullUpdateData } from "../../common/src/protocol";


export interface Simulation {

    incorporate_update(data: FullUpdateData): void;

}
