Space Meet
=============================

Space Meet is a meeting space, where you can walk & talk.
This is work in progress, it's only a proof of concept yet.

## Getting started (Using npm package.json)
* Get node.js
* run `npm install` inside the cloned folder
* run `node app.js` inside the cloned folder
* Visit https://beta.meet.jit.si/mau8goo6gaenguw7o and enable microphone & camera
* Visit http://127.0.0.1:4004/?debug
* you should now see yourself and hear yourself differently as you walk through the room

## Getting started (Manual install)

* Get node.js
* Install socket.io `npm install socket.io`
* Install node-udid `npm install node-uuid`
* Install express `npm install express`
* Run `node app.js` inside the cloned folder
* Visit https://beta.meet.jit.si/mau8goo6gaenguw7o and enable microphone & camera
* Visit http://127.0.0.1:4004/?debug
* you should now see yourself and hear yourself differently as you walk through the room

## Roadmap

* Switch to TypeScript
* Create lobby with options for creating rooms & make server more secure on the way
* Invent game config data structure
* Implement smooth transition between rooms in a brickwork like tiling (minimises number of touching rooms to three while being very simple)

## License

MIT Licensed.
See LICENSE if required.

## Disclaimer

This project is built up on [this tutorial](http://buildnewgames.com/real-time-multiplayer/) on multiplayer games in JavaScript and greatly influenced by [this one](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics) about spatial sound on the web.
It makes major use of [jitsi](https://jitsi.org), in particular [lib-jitsi-meet](https://github.com/jitsi/lib-jitsi-meet) and at least for now the videocalls are hosted on [https://meet.jit.si/](https://meet.jit.si/).
