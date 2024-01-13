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
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName("query")
				.setDescription("Run a query on all the picks for the season")
				.addIntegerOption(option =>
					option.setName('minimumspread')
						.setDescription('Minimum spread amount (absolute value) for picks')
						.setRequired(false))
				.addIntegerOption(option =>
					option.setName('maximumspread')
						.setDescription('Maximum spread amount (absolute value) for picks')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('person')
						.setDescription('Person picking games: CSV use full name or username')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('teams')
						.setDescription('Teams to get game results for: CSV use team acronyms. e.g. CHI, BUF, LAC, LAR')
						.setRequired(false))
				.addStringOption(option =>
					option.setName('dayofweek')
						.setDescription('Day of week get game results for: CSV use full day name')
						.setRequired(false))),
	async execute(interaction)
	{
		if (interaction.options.getSubcommand() === 'simulate')
		{
			const weekNumber = interaction.options.getInteger('weeknumber');
			let args = ['--simstandings'];
			if (weekNumber)
			{
				args.push('--weeknumber');
				args.push(weekNumber);
			}
			const result = await RunArbem(args);
			await interaction.reply(result);
		}
		else if (interaction.options.getSubcommand() === "picks")
		{
			// TODO:
			await interaction.reply('Testing');
		}
		else if (interaction.options.getSubcommand() === "query")
		{
			const minimumSpread = interaction.options.getInteger('minimumspread');
			const maximumSpread = interaction.options.getInteger('maximumspread');
			const person = interaction.options.getString('person');
			const teams = interaction.options.getString('teams');
			const dayofweek = interaction.options.getString('dayofweek');

			let args = ['--query'];
			if (minimumSpread)
			{
				args.push('--minimumspread');
				args.push(minimumSpread);
			}
			if (maximumSpread)
			{
				args.push('--maximumspread');
				args.push(maximumSpread);
			}
			if (person)
			{
				args.push('--person');
				args.push(person);
			}
			if (dayofweek)
			{
				args.push('--dayofweek');
				args.push(dayofweek);
			}
			if (teams)
			{
				args.push('--teams');
				args.push(teams);
			}
			const result = await RunArbem(args);
		}
	},
};

async function RunArbem(args)
{
	let output = '';
	const fullCommand = `${arbemPath} ${args.join(' ')}`;
	const arbemOutput = await exec(fullCommand);
	if (arbemOutput)
	{
		return arbemOutput.stdout.trim();
	}
	return 'Ran arbem';
}