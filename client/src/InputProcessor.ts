import { ParsedInput } from "../../common/src/protocol";

export interface InputProcessor {
    fetch_input() : ParsedInput;
}
