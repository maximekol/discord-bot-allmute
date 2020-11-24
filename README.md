# discord-bot-allmute

A bot for Discord servers to mute/unmute voice channels, self-hosted

Can be very usefull when playing Among Us !

---

## How do I use this?

**You must first have...**

* A `discord token` for your bot
* A computer that has working internet
* The ability to follow instructions

### Configuration Discord
1. Create a new application on your discord developer account https://discord.com/developers/applications
2. Generate an OAuth2 URL with the scope: bot and permissions to mute members
3. Invote the bot to your Discord server
4. On Bot, copy the token

### Configuration Local
1. Copy and rename file auth_example.json to auth.json
2. Replace DISCORD_TOKEN with the token you just created from discord

### Installation

1. Install Node js

```bash
brew install node
```

2. Install requirements
```bash
node install
```

3. Launch discord bot mute
```bash
node src/index.js
```

### Usage
1. Mute all members
Join a voice channel and then type the following command on discord channel

```bash
.m
```

2. Unmute all members
Join a voice channel and then type the following command on discord channel

```bash
.u
```

### Parameter
Change config.json to change some default parameters before launching the bot

1. Use Master Role

Join a voice channel and then type the following command on discord channel
With useMasterRole set to true, only the member with this role can mute/unmute the voice channel

```bash
"useMasterRole" : true,
"masterRoleName" : "Mute Master",
```

2. Play audio when mute/unmute
Possibility to play a specific audio message when mute/unmute command is received 

```bash
"playVoiceWhenMute" : true,
"playVoiceWhenUnMute" : false
```

---
## License

This project is licensed under GNU GPLv3

```
Copyright (C) 2020 Maxime Kolly

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
```
