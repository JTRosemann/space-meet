Space Meet
=============================

Space Meet is a meeting space, where you can walk & talk.
This is work in progress, it's only a proof of concept yet.
you'll need typescript

## Install
* clone it
* install `yarn` & `npm`
* `cd client`
* `yarn init`
* `yarn`
* `cd ../server`
* `yarn init`
* `yarn`
* `cd ..`

## Running
* `./buildall`
* `./run`
Now you can access it at https://localhost:4004 (note the "s" in "https"!)
Optional:
* `ngrok http https://localhost:4004` (only works with (free but signed-up) authtoken from ngrok)
* go to https://localhost:4040 and use the link given there to access it outside of your network

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
