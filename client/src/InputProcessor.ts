import { InterpretedInput } from "./InterpretedInput";

export interface InputProcessor<S> {
    fetch_input() : InterpretedInput<S>;
}
