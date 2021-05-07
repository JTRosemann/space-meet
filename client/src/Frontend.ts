import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { ClientEffects as ClientEffects } from "./ClientEffects";

export interface FrontEnd<S extends State> {
    render(snap: Snap<S>, pres_cfg: ClientEffects) : void;
}