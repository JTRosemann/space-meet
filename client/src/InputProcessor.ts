import { ParsedInput } from "../../common/src/protocol";

/**
 * The input processor must run continously:
 * The time ranges of the input shouldn't overlap, but there also shouldn't be any gaps.
 */
export interface InputProcessor {
    /**
     * Probe for an input at the given `time`.
     * The input is registered as starting from the last probing time and going to the given `time`.
     * @param time 
     * @returns a parsed input
     */
    fetch_input(time : number) : ParsedInput;
}
