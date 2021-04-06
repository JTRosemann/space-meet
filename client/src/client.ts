import { ClientInstance } from "./ClientInstance";

let client;
//When loading, we store references to our
//drawing canvases, and initiate a game instance.
console.log('before onload');
window.onload = function(){
    console.log('onload');
    //Fetch the viewport
    const viewport = document.getElementById('viewport') as HTMLCanvasElement;
    //Create our game client instance.
    client = new ClientInstance(viewport);
}; //window.onload

