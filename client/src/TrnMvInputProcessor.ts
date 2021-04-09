import { InterpretedInput } from "./InterpretedInput";
import { InputProcessor } from "./InputProcessor";
import { EuclideanCircle } from "./EuclideanCircle";


export class TrnMvInputProcessor implements InputProcessor<EuclideanCircle> {
    fetch_input(): InterpretedInput<EuclideanCircle> {
        throw new Error("Method not implemented.");
    }
}
