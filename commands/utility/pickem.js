const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const { arbemPath } = require('../../config.json');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pickem')
		.setDescription('Commands for pickem')
		.addSubcommand(subcommand =>
			subcommand
				.setName("simulate")
				.setDescription("Show the current standings update as if the games ended as is")
				.addIntegerOption(option =>
					option.setName('weeknumber')
						.setDescription('The week get get results for.')
						.setMinValue(1)
						.setMaxValue(23)
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName("picks")
				.setDescription("Show the picks from active games")
				.addIntegerOption(option =>
					option.setName('weeknumber')
						.setDescription('The week get get results for.')
						.setMinValue(1)
						.setMaxValue(23)

						.setRequired(false))),
	async execute(interaction)
	{
		if (interaction.options.getSubcommand() === 'simulate')
		{
			const weekNumber = interaction.options.getInteger('weeknumber');
			const result = await RunArbem(weekNumber);
			await interaction.reply(result);
		}
		else if (interaction.options.getSubcommand() === "picks")
		{
			const weekNumber = interaction.options.getInteger('weeknumber');
			const result = await RunArbem(weekNumber);
			await interaction.reply(result);
		}
	},
};

async function RunArbem(weekNumber)
{
	let args = ['--simstandings'];

	if (weekNumber)
	{
		args.push('--weeknumber');
		args.push(weekNumber);
	}

	let output = '';
	const fullCommand = `${arbemPath} ${args.join(' ')}`;
	const arbemOutput = await exec(fullCommand);
	if (arbemOutput)
	{
		return arbemOutput.stdout.trim();
	}
	return 'Ran arbem';
}