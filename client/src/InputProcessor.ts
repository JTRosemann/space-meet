import { InterpretedInput } from "../../common/src/InterpretedInput";

export interface InputProcessor<S> {
    fetch_input() : InterpretedInput<S>;
}
