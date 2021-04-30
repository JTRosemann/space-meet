import { InputProcessor } from "./InputProcessor";
import { ParsedInput } from "../../common/src/protocol";


export class ArrowInputProcessor implements InputProcessor {
    fetch_input(): ParsedInput {
        throw new Error("Method not implemented.");
    }
}
