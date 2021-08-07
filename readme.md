# RPresence V1.0

RPresence is a fork of [rblxRP by theLMGN](https://github.com/theLMGN/rblxRP).

This fork adds presence updating instantly through process events, and a few QOL changes.

![preview](https://i.imgur.com/T3hEpBi.png)

## Instructions

### Windows

1. Go to the [releases page](https://github.com/6ixfalls/RPresence/releases)
2. Download the `rpresence-win32-x64.zip` file and unzip it
3. Open `rpresence.exe`

### macOS

MacOS support for this fork is not being worked on due to missing API features.

### Roblox Studio Support

Roblox Studio is supported through the use of a plugin found [here](https://www.roblox.com/library/7219012005/RPresence-Companion).
Source code of this plugin is in `RPresence.lua`.

## Troubleshooting

**Failed to connect**

Restart Discord.

## Development Instructions

Clone the repository, and run `npm i` (With NodeJS installed)

### Windows

#### Running

`electron index.js`

#### Building

`npm run build-windows`
