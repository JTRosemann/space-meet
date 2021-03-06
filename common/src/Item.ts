import { State } from "./State";


/**
 * used to map to matching video & sound in the client
 */
export interface Item {
    //TODO purge id
    id: string;
    state: State;
    rad: number;
}
