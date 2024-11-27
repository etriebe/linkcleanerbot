const { Client, Collection, Events, GatewayIntentBits, Intents, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
	partials: [Partials.Channel, Partials.Message]
});

const ConfigUtils = require('./lib/ConfigUtils.js');
const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const dataFolder = "./data";

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders)
{
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles)
	{
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command)
		{
			client.commands.set(command.data.name, command);
		} else
		{
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient =>
{
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

	if (!fs.existsSync(dataFolder))
	{
		console.log(`Creating data folder: ${dataFolder}`);
		fs.mkdirSync(dataFolder);
	}
});

client.on("messageCreate", async message =>
{
	let guildConfig = ConfigUtils.getGuildConfig(message.guildId);
	let authorSettings = guildConfig.find(c => c.authorId == message.author.id);
	if (authorSettings && authorSettings.cleanSetting == "never")
	{
		console.log(`Clean setting for author: ${authorSettings.cleanSetting}`);
		return;
	}
	await FixAllLinkTypes(message, authorSettings);
});

client.on(Events.InteractionCreate, async interaction =>
{
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command)
	{
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try
	{
		await command.execute(interaction);
	} catch (error)
	{
		console.error(error);
		if (interaction.replied || interaction.deferred)
		{
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else
		{
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

try
{
	console.log();
	client.login(token);
} catch (e)
{
	console.log('Error:', e.stack);
}


async function FixAllLinkTypes(message, authorSettings)
{

	const botAuthorIds = [
		"1197601555512316064",
		"1197604264881705140"
	];

	if (botAuthorIds.includes(message.author.id))
	{
		// Skip messages from our list of bots
		return;
	}

	let linkMatches = [...message.content.matchAll(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm)];
	const domainMapping = [
		["twitter.com", "vxtwitter.com"],
		["x.com", "fixvx.com"],
		["tiktok.com", "vxtiktok.com"],
		["reddit.com", "vxreddit.com"],
		["bsky.app", "vxbsky.app"],
		["instagram.com", "ddinstagram.com"],
	];

	for (let i = 0; i < linkMatches.length; i++)
	{
		const currentLinkMatch = linkMatches[i];
		let newLinkMessage = ``;
		const fullLinkMatch = currentLinkMatch[0];

		for (const domainMap of domainMapping)
		{
			const normalDomain = domainMap[0];
			const fixedDomain = domainMap[1];

			if (fullLinkMatch.includes(normalDomain) && !fullLinkMatch.includes(fixedDomain))
			{
				newLinkMessage = currentLinkMatch[0].replace(normalDomain, fixedDomain);
				newLinkMessage = `${newLinkMessage} | <${currentLinkMatch[0]}>`;
			}
		}

		if (newLinkMessage == "")
		{
			continue;
		}

		const fullMessage = message.content.replace(currentLinkMatch[0], newLinkMessage);

		const azarIsms = [
			`What I *think* ${message.author} is trying to say is...`,
			`🤔 Interesting, ${message.author}, but what about...`,
		];

		const randomIndex = Math.floor(Math.random() * azarIsms.length);
		const randomMessage = azarIsms[randomIndex];

		await message.channel.send(`${randomMessage}\n\n${fullMessage}`);
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('yes')
					.setLabel('Yes')
					.setStyle(ButtonStyle.Danger),
				new ButtonBuilder()
					.setCustomId('no')
					.setLabel('No')
					.setStyle(ButtonStyle.Secondary),
				new ButtonBuilder()
					.setCustomId('always')
					.setLabel('Always')
					.setStyle(ButtonStyle.Success),
				new ButtonBuilder()
					.setCustomId('never')
					.setLabel('Never')
					.setStyle(ButtonStyle.Primary)
			);

		if (authorSettings && authorSettings.cleanSetting == "always")
		{
			await message.delete();
			return;
		}

		let interaction = await message.reply({ content: 'Do you want to delete your message?', components: [row], ephemeral: true });

		const filter = i => i.customId === 'yes' || i.customId === 'no' || i.customId === "always" || i.customId === "never";
		const collector = message.channel.createMessageComponentCollector({ filter, time: 15000 });

		collector.on('collect', async i =>
		{
			if (i.customId === 'yes')
			{
				await message.delete();
				await i.reply({ content: 'Message deleted!', ephemeral: true });
			}
			else if (i.customId === 'always')
			{
				await message.delete();
				await i.reply({ content: 'Messages will always be deleted.', ephemeral: true });
				let guildConfig = ConfigUtils.getGuildConfig(message.guildId);
				guildConfig.push({
					authorId: message.author.id,
					cleanSetting: "always"
				});
				ConfigUtils.saveGuildConfig(guildConfig, message.guildId);
			}
			else if (i.customId === 'no')
			{
				await i.reply({ content: 'Message not deleted.', ephemeral: true });
			}
			else if (i.customId === 'never')
			{
				await i.reply({ content: 'Message will never be deleted.', ephemeral: true });
				let guildConfig = ConfigUtils.getGuildConfig(message.guildId);
				guildConfig.push({
					authorId: message.author.id,
					cleanSetting: "never"
				});
				ConfigUtils.saveGuildConfig(guildConfig, message.guildId);
			}
			interaction.delete();
			collector.stop();
		});

		collector.on('end', collected =>
		{
			if (collected.size === 0)
			{
				interaction.delete();
				// message.reply({ content: 'No response received. Message not deleted.', ephemeral: true });
			}
		});
	}
}