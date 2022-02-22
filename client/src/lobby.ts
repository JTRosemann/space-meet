import * as sio from 'socket.io-client';
import { ClientInstance } from './ClientInstance';

console.log('lobby: before onload');
window.onload = function (){
    console.log('lobby: onload');
    const selector = document.getElementById('selector') as HTMLFormElement;
    const client = new ClientInstance();
};