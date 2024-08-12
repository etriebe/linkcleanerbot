const { SlashCommandBuilder } = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
const dataFolder = "./data";
const ConfigUtils = require('../../lib/ConfigUtils.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Resets Link Cleaner Bot always/never sticky setting.'),
    async execute(interaction)
    {
        let guildConfig = ConfigUtils.getGuildConfig(interaction.guildId);
        let currentUser = guildConfig.find(c => c.authorId === interaction.member.id);
        if (!currentUser)
        {
            await interaction.reply('No setting currently set.');
            return;
        }
        guildConfig = guildConfig.filter(c => c.authorId != currentUser.authorId);
        ConfigUtils.saveGuildConfig(guildConfig, interaction.guildId);
        await interaction.reply('Setting reset.');
    },
};