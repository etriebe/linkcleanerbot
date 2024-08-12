const { SlashCommandBuilder } = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
const dataFolder = "./data";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Resets Link Cleaner Bot always/never sticky setting.'),
    async execute(interaction)
    {

        await interaction.reply('Setting reset.');
    },
};