import { InterpretedInput } from "../../common/src/InterpretedInput";
import { InputProcessor } from "./InputProcessor";
import { EuclideanCircle } from "../../common/src/EuclideanCircle";


export class TrnMvInputProcessor implements InputProcessor<EuclideanCircle> {
    fetch_input(): InterpretedInput<EuclideanCircle> {
        throw new Error("Method not implemented.");
    }
}
