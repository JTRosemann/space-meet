import { Snap } from "../../common/src/Snap";
import { State } from "../../common/src/State";
import { ClientConfig as ClientConfig } from "./ClientConfig";

export interface FrontEnd<S extends State> {
    render(snap: Snap<S>, pres_cfg: ClientConfig) : void;
}