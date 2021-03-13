import { SSL_OP_NETSCAPE_CA_DN_BUG } from "constants";
import { ClientUI } from "./ClientUI";

let client;
//When loading, we store references to our
//drawing canvases, and initiate a game instance.
console.log('before onload');
window.onload = function(){
    console.log('onload');
    //Create our game client instance.
    client = new ClientUI();
}; //window.onload
