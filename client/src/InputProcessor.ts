import { ParsedInput } from "../../common/src/protocol";

export interface InputProcessor {
    /**
     * Probe for an input at the given `time`.
     * The input is registered as starting from the last probing time and going to the given `time`.
     * @param time 
     * @returns a parsed input
     */
    fetch_input(time : number) : ParsedInput;
}
