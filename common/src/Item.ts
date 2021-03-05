import { State } from "./State";


export interface Item {
    /**
     * used to map to matching video & sound in the client
     */
    id: string;
    state: State;
    rad: number;
}
