const { client } = require('discord.js');
const { guildId } = require('./config.json');
const guild = client.guilds.cache.get(guildId);

// This updates immediately
guild.commands.set([]);