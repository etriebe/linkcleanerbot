const { SlashCommandBuilder, codeBlock } = require('discord.js');
const fs = require('node:fs');
const { arbemPath, arbemDirectory } = require('../../config.json');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const execFile = promisify(require('child_process').execFile);
const execFileSync = promisify(require('child_process').execFileSync);

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
						.setRequired(false))
				.addStringOption(option =>
					option.setName('querysort')
						.setDescription('Which column to sort query results by.')
						.setRequired(false)
						.addChoices(
							{ name: 'FullName', value: 'FullName' },
							{ name: 'GameCount', value: 'GameCount' },
							{ name: 'PicksWon', value: 'PicksWon' },
							{ name: 'TotalPoints', value: 'TotalPoints' },
							{ name: 'PickPercentage', value: 'PickPercentage' },
							{ name: 'SpreadDifferential', value: 'SpreadDifferential' },
						))
				.addStringOption(option =>
					option.setName('picktype')
						.setDescription('Whether you want the query to choose games in which you picked for, against, or any pick.')
						.setRequired(false)
						.addChoices(
							{ name: 'For', value: 'For' },
							{ name: 'Against', value: 'Against' },
							{ name: 'Any', value: 'Any' },
						))
				.addStringOption(option =>
					option.setName('queryresulttype')
						.setDescription('Whether you want the query to return a summary of all the picks or a list of all the picks.')
						.setRequired(false)
						.addChoices(
							{ name: 'Summary', value: 'Summary' },
							{ name: 'GameList', value: 'GameList' },
						))
		),
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
			const querySort = interaction.options.getString('querysort');
			const pickType = interaction.options.getString('picktype');
			const queryResultType = interaction.options.getString('queryresulttype');

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
				args.push(`"${person}"`);
			}
			if (dayofweek)
			{
				args.push('--dayofweek');
				args.push(`"${dayofweek}"`);
			}
			if (teams)
			{
				args.push('--teams');
				args.push(`"${teams}"`);
			}
			if (querySort)
			{
				args.push('--querysort');
				args.push(`${querySort}`);
			}
			if (pickType)
			{
				args.push('--picktype');
				args.push(`${pickType}`);
			}
			if (queryResultType)
			{
				args.push('--queryresulttype');
				args.push(`${queryResultType}`);
			}

			await interaction.deferReply();
			const result = await RunArbem(args);
			await interaction.editReply(codeBlock(result));
		}
	},
};

async function RunArbem(args)
{
	const fullCommand = `${arbemPath} ${args.join(' ')}`;
	console.log(`Running: ${fullCommand}`);
	const arbemOutput = await execFile(arbemPath, args, { cwd: arbemDirectory });
	if (arbemOutput)
	{
		return arbemOutput.stdout.trim();
	}
	return 'Ran arbem but no output';
}

async function RunArbemExecFile(args)
{
	const child = execFile(arbemPath, args, (error, stdout, stderr) =>
	{
		if (error)
		{
			console.error('stderr', stderr);
			throw error;
		}
		console.log('stdout', stdout);
	});
}
