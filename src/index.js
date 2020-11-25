process.on('unhandledRejection', (reason) => {
  console.error(reason);
  process.exit(1);
});

// Check dependency installation
try  {
  var Discord = require("discord.js");
  var opus = require('@discordjs/opus');
  var ffmpeg = require("ffmpeg-static");
} catch (e) {
  console.log(e.stack);
  console.log(process.version);
  console.log("Please run npm install and ensure it passes with no errors!"); // if there is an error, tell to install dependencies.
  process.exit();
}

// load config
const config = require("./config.json");

// Get authentication data
try {
  var authConfig = require("./auth.json");
} catch (e){
  console.log("Please create an auth.json like auth.json.example with a bot token or an email and password.\n"+e.stack); // send message for error - no token
  process.exit();
}

var isMuted = false

const client = new Discord.Client();

client.on("ready", () => {
  console.log("I am ready to mute");
  client.user.setActivity(`Shut up !`, {type: 'LISTENING'});
});

client.on("message", (message) => {
  // do not process bot messages
  if(message.author.bot) return;

  // do not process message without bot prefix
  if(message.content.indexOf(config.prefix) !== 0) return;

  // flag for bot feedback on current message
  sucess = false

  // Split messages
  commands = getCommandsFromMessage(message)
  if (commands.length > 0) {
    // take frist instruction only
    cmd = getCmdFromCommand(commands[0])
  }

  if (config.useMasterRole) {
    // only master is allowed to call the additionnal command
    if(!checkMessageAuthorIsMaster(message, message.author)) {
      message.channel.send('Hey <@' + message.author.id + '>! You re not a Mute Master');
      message.react(config.reactionFeedbackFail);
      return;
    }
  }

  if (commands.length > 0) {
    // take frist instruction only
    cmd = getCmdFromCommand(commands[0])
    args = getArgsFromCommand(commands[0])
    if(cmd == "m") {
      muteAll(args, message)
      sendReactionFeedbackMute(message)
      return
    } else if (cmd == "u"){
      unmuteAll(args, message)
      sendReactionFeedbackUnMute(message)
      return
    }
  }
});

client.on("voiceStateUpdate", (oldState, newState) => {
  if (!newState.serverMute && isMuted && newState.channelID && newState.member.voice && !newState.member.user.bot) {
    // New User in vocal channel
    muteCurrentUser = true;
    if (config.useTeacherMode) {
      // Check is new user is Master before muting
      masterRoleFound = newState.guild.roles.cache.find(role => role.name == config.masterRoleName)
      if (checkUserIsMaster(masterRoleFound, newState.member.user)){
        // do not mute current user
        muteCurrentUser = false;
      }
    }

    // Process user mute
    if (muteCurrentUser) {
      console.log("New Real User Is Muted");
      newState.member.voice.setMute(true);
    }
  }

  if (newState.serverMute && oldState.channelID != null && newState.channelID == null && !newState.member.user.bot) {
    // Currrent user leave the voice channel while muted
    currentUserIsMuted = true;
    if (config.useTeacherMode) {
      // Check is new user is Master before muting
      masterRoleFound = newState.guild.roles.cache.find(role => role.name == config.masterRoleName)
      if (checkUserIsMaster(masterRoleFound, newState.member.user)){
        // do not log current user
        currentUserIsMuted = false;
      }
    }

    // Process user leave
    if (currentUserIsMuted) {
      console.log("User leave voice channel while being muted")
      // TODO unmute user for next voice chat
    }
  }
});

async function muteAll(args, message) {
  if (message.member.voice.channelID) {
    // Mute All real users
    let channel = message.guild.channels.cache.get(message.member.voice.channel.id);

    muteAllmembers = true;

    if (config.useTeacherMode) {
      // Mute all but Master
      masterRoleFound = message.guild.roles.cache.find(role => role.name == config.masterRoleName)
      if (masterRoleFound) {
        muteAllmembers = false
        for (const [memberID, member] of channel.members)
        {
          isUserMaster = checkUserIsMaster(masterRoleFound, member.user)
          if (member.user.bot == false && !isUserMaster) {
            member.voice.setMute(true);
          }
        }
      } else {
        console.log("Cannot find name " + config.masterRoleName + " in roles")
        // => Mute all members
      }
    }

    if (muteAllmembers) {
      // Mute all members
      for (const [memberID, member] of channel.members)
      {
        if (member.user.bot == false) {
          member.voice.setMute(true);
        }
      }
    }

    // Set Flag muted
    isMuted = true

    playMuteAudioMessage(message)

    message.channel.send(config.textMessageMute);

  } else {
    console.log("User Has no Voice Channel");
  }
}

async function unmuteAll(args, message) {
 if (message.member.voice.channelID) {
    playUnMuteAudioMessage(message)

    // Mute all real Users
    let channel = message.guild.channels.cache.get(message.member.voice.channel.id);
    for (const [memberID, member] of channel.members)
    {
      if (member.user.bot == false) {
        member.voice.setMute(false);
      }
    }

    // Set Flag muted
    isMuted = false

    message.channel.send(config.textMessageUnMute);

  } else {
    console.log("User Has no Voice Channel");
  }
}

async function playMuteAudioMessage(message) {
  if (config.playVoiceWhenMute) {
    // Join Channel
    const connection = await message.member.voice.channel.join();

    // Speak on channel
    const dispatcherMute = connection.play('audio/message_mute.mp3');

    dispatcherMute.on('finish', async () => {
      dispatcherMute.destroy(); // end the stream

      // Leave Channel
      await message.member.voice.channel.leave()
    });
  }
}

async function playUnMuteAudioMessage(message) {
  if (config.playVoiceWhenUnMute) {
    // Join Channel
    const connection = await message.member.voice.channel.join();

    // Speak on channel
    const dispatcherUnMute = connection.play('audio/message_unmute.mp3');

    dispatcherUnMute.on('finish', async () => {
      dispatcherUnMute.destroy(); // end the stream

      // Leave Channel
      await message.member.voice.channel.leave()
    });
  }
}


function sendReactionFeedbackMute(message) {
  message.react(config.reactionFeedbackMute);
}

function sendReactionFeedbackUnMute(message) {
  message.react(config.reactionFeedbackUnMute);
}

function checkUserIsMaster(masterRole, user)  {
  userfound = masterRole.members.find(guildmember  => guildmember.user.id == user.id)
  isUserMaster = (userfound) ? (true) : (false)
  return isUserMaster
}

function checkMessageAuthorIsMaster(message, user)  {
  masterRoleFound = message.guild.roles.cache.find(role => role.name == config.masterRoleName)
  if (masterRoleFound) {
    userfound = masterRoleFound.members.find(guildmember  => guildmember.user.id == user.id)
    isAuthorMaster = (userfound) ? (true) : (false)
  } else {
    console.log("Cannot find name " + config.masterRoleName + " in roles")
    isAuthorMaster = false
  }
  return isAuthorMaster
};

function getCmdFromCommand(command) {
  split = command.split(/ +/g);
  // if command start with spaces remove them
  cmd = (split[0].trim() == '' && split.length > 1) ? (split[1] ) : (split[0])
  return cmd.trim()
}
function getArgsFromCommand(command) {
  split = command.split(/ +/g);
  args = (split[0].trim() == '') ? (split.slice(2) ) : (split.slice(1))
  return args
}
function getCommandsFromMessage(message) {
  withoutPrefix = message.content.slice(config.prefix.length);
  commands = withoutPrefix.split(',');
  return commands
};

client.login(authConfig.token);
