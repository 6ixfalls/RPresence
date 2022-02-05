# RPresence

RPresence is a heavily modified fork of [rblxRP by theLMGN](https://github.com/theLMGN/rblxRP).

This fork adds presence updating instantly through process events, instant game join links with RoGold, and a few QOL changes.

![](https://user-images.githubusercontent.com/23470032/150919773-e28fdbc2-5b05-4810-a030-1d05e6802b85.png)

## Instructions

### Windows

1. Go to the [releases page](https://github.com/6ixfalls/RPresence/releases)
2. Download the `rpresence-win32-x64.zip` file and unzip it
3. Open `rpresence.exe`

### macOS

MacOS Support is not currently implemented, and likely will not be.

### Roblox Studio Support

Roblox Studio is supported (not well!) through the use of a plugin found [here](https://www.roblox.com/library/7219012005/RPresence-Companion).
Source code of this plugin is in `RPresence.lua`.

## Troubleshooting

**Failed to connect**

Restart Discord.

## Development Instructions

Clone the repository, and run `npm i` (With NodeJS installed)

### Windows

#### Running

`npm run test`

#### Building

`npm run package-win`

## Footer Notes

Only this specific commit works with this; not sure why.

`github:xan105/node-processMonitor#ed58a15212366626e5e49daa3bf51fccc900f324`

If you find anything, please create an issue!