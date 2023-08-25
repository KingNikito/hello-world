const Discord = require('discord.js');
const { Intents } = require('discord.js');

const client = new Discord.Client({
  intents: [
    Intents.GUILDS,
    Intents.GUILD_MESSAGES,
    Intents.GUILD_MESSAGE_REACTIONS,
    // Add more intents as needed
  ]
});

const prefix = '!';
const cooldownTime = 180000;
const inactivityThreshold = 30 * 60 * 60 * 1000;
const wordsToRPXP = {
  10: 1,
  25: 2,
  40: 3,
  55: 4,
  70: 5
};

const roleplaySessions = {};

client.once('ready', () => {
  console.log('Bot is online!');
});

client.on('message', async message => {
  if (message.content.startsWith(prefix + 'roleplay start')) {
    if (!roleplaySessions[message.author.id]) {
      roleplaySessions[message.author.id] = {
        startTime: Date.now(),
        messagesSent: 0,
        lastMessageTime: Date.now() - cooldownTime - 1,
        channelId: message.channel.id,
        pinnedMessageId: null
      };

      const roleplayMessage = await message.channel.send(
        `${message.author.username}'s Roleplay Session:
        Roleplay Experience: 0 rpxp
        Stamps Earned: 0 stamps`
      );
      roleplaySessions[message.author.id].pinnedMessageId = roleplayMessage.id;
      roleplayMessage.pin();

      message.reply('Roleplay session started! Remember the cooldown and word thresholds.');
    } else {
      message.reply("You've already started a roleplay session.");
    }
  } else if (message.content.startsWith(prefix + 'roleplay end')) {
    if (roleplaySessions[message.author.id]) {
      const sessionData = roleplaySessions[message.author.id];
      const sessionDuration = Date.now() - sessionData.startTime;

      const roleplayExperience = calculateExperience(
        sessionData.messagesSent,
        sessionDuration
      );

      const roleplayMessage = await message.channel.messages.fetch(sessionData.pinnedMessageId);

      roleplayMessage.unpin();
      roleplayMessage.edit(
        `${message.author.username}'s Roleplay Session (Ended):
        Roleplay Experience: ${roleplayExperience} rpxp
        Stamps Earned: ${Math.floor(roleplayExperience / 100)} stamps`
      );

      message.reply(
        `Roleplay session ended! Earned ${roleplayExperience} rpxp. You earned ${Math.floor(roleplayExperience / 100)} stamps from this scene.`
      );

      delete roleplaySessions[message.author.id];
    } else {
      message.reply("You haven't started a roleplay session.");
    }
  } else {
    if (roleplaySessions[message.author.id]) {
      const sessionData = roleplaySessions[message.author.id];
      if (
        Date.now() - sessionData.lastMessageTime > cooldownTime &&
        sessionData.channelId === message.channel.id
      ) {
        sessionData.messagesSent++;
        sessionData.lastMessageTime = Date.now();
        checkForInactivity();
      }
    }
  }
});

function calculateExperience(messagesSent, sessionDuration) {
  let rpxp = 0;
  for (const wordThreshold in wordsToRPXP) {
    if (messagesSent <= wordThreshold) {
      rpxp = wordsToRPXP[wordThreshold];
      break;
    }
  }
  return rpxp;
}

function checkForInactivity() {
  for (const userId in roleplaySessions) {
    const sessionData = roleplaySessions[userId];
    if (Date.now() - sessionData.lastMessageTime > inactivityThreshold) {
      delete roleplaySessions[userId];
    }
  }
}

client.login('BOT_TOKEN'); // Replace with your bot token
