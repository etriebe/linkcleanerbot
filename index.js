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
	let linkMatches = [...message.content.matchAll(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm)];

	for (let i = 0; i < linkMatches.length; i++)
	{
		const currentLinkMatch = linkMatches[i];
		// let newLinkMessage = `Sent by <@${message.userId}>`;
		let newLinkMessage = ``;
		const fullLinkMatch = currentLinkMatch[0];
		if (fullLinkMatch.includes("twitter.com") && !fullLinkMatch.includes("vxtwitter.com"))
		{
			newLinkMessage = currentLinkMatch[0].replace("twitter.com", "vxtwitter.com");
		}
		if ((fullLinkMatch.includes("https://x.com") || fullLinkMatch.includes("https://www.x.com")) && !fullLinkMatch.includes("fixvx.com"))
		{
			newLinkMessage = currentLinkMatch[0].replace("x.com", "fixvx.com");
		}
		// if (fullLinkMatch.includes("tiktok.com") && !fullLinkMatch.includes("tnktok.com"))
		// {
		// 	newLinkMessage = currentLinkMatch[0].replace("tiktok.com", "tnktok.com");
		// }
		if (fullLinkMatch.includes("tiktok.com") && !fullLinkMatch.includes("vxtiktok.com"))
		{
			newLinkMessage = currentLinkMatch[0].replace("tiktok.com", "vxtiktok.com");
		}
		if (fullLinkMatch.includes("reddit.com") && !fullLinkMatch.includes("vxreddit.com"))
		{
			newLinkMessage = currentLinkMatch[0].replace("reddit.com", "vxreddit.com");
		}

		if (newLinkMessage == "")
		{
			continue;
		}

		const fullMessage = message.content.replace(currentLinkMatch[0], newLinkMessage);

		await message.channel.send(`From ${message.author}\n\n"${fullMessage}"`);
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