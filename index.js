const { Client, Collection, Events, GatewayIntentBits, Intents, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
	partials: [Partials.Channel, Partials.Message]
});
const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const dataFolder = "./data";
let guildConfigs = {};

function getGuildConfigFilePath(guildId)
{
	const guildFilePathFormat = `${dataFolder}/##GUILDID##.json`;
	return guildFilePathFormat.replace('##GUILDID##', guildId);
}

function getGuildConfig(guildId)
{
	const guildConfigFromCache = guildConfigs[guildId];
	if (guildConfigFromCache)
	{
		console.log(`Found cached guild config for guild id ${guildId}`);
		return guildConfigFromCache;
	}
	const guildConfigFile = getGuildConfigFilePath(guildId);
	if (fs.existsSync(guildConfigFile))
	{
		console.log(`Found guild config on disk for guild id ${guildId}`);
		return JSON.parse(fs.readFileSync(guildConfigFile));
	}
	else
	{
		console.log(`Creating empty guild config for guild id ${guildId}`);
		return [];
	}
}

function saveGuildConfig(guildConfig, guildId)
{
	cacheGuildConfig(guildConfig, guildId);
	try
	{
		const configFilePath = getGuildConfigFilePath(guildId);
		console.log(`Writing file for guildId: ${configFilePath}`);
		fs.writeFileSync(configFilePath, JSON.stringify(guildConfig));
	}
	catch (e)
	{
		console.log(`Error: ${e}`);
	}
	return;
}

function cacheGuildConfig(guildConfig, guildId)
{
	guildConfigs[guildId] = guildConfig;
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
	let guildConfig = getGuildConfig(message.guildId);
	let authorSettings = guildConfig.find(c => c.authorId == message.author.id);
	if (authorSettings && authorSettings.cleanSetting == "never")
	{
		console.log(`Clean setting for author: ${authorSettings.cleanSetting}`);
		return;
	}
	await FixAllLinkTypes(message, authorSettings);
});

// client.on('interactionCreate', async interaction => {
// 	if (!interaction.isButton()) return;

// 	if (interaction.customId === 'yes') {
// 		await interaction.message.delete();
// 		// await interaction.reply({ content: 'Message deleted!', ephemeral: true });
// 	} else if (interaction.customId === 'no') {
// 		await interaction.message.delete();
// 	}
// });

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
		if (fullLinkMatch.includes("tiktok.com") && !fullLinkMatch.includes("tnktok.com"))
		{
			newLinkMessage = currentLinkMatch[0].replace("tiktok.com", "tnktok.com");
		}
		// if (fullLinkMatch.includes("tiktok.com") && !fullLinkMatch.includes("vxtiktok.com"))
		// {
		// 	newLinkMessage = currentLinkMatch[0].replace("tiktok.com", "vxtiktok.com");
		// }
		if (fullLinkMatch.includes("reddit.com") && !fullLinkMatch.includes("vxreddit.com"))
		{
			newLinkMessage = currentLinkMatch[0].replace("reddit.com", "vxreddit.com");
		}

		if (newLinkMessage == "")
		{
			continue;
		}

		await message.channel.send(`From ${message.author}\n\n${newLinkMessage}`);
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
				let guildConfig = getGuildConfig(message.guildId);
				guildConfig.push({
					authorId: message.author.id,
					cleanSetting: "always"
				});
				saveGuildConfig(guildConfig, message.guildId);
			}
			else if (i.customId === 'no')
			{
				await i.reply({ content: 'Message not deleted.', ephemeral: true });
			}
			else if (i.customId === 'never')
			{
				await i.reply({ content: 'Message will never be deleted.', ephemeral: true });
				let guildConfig = getGuildConfig(message.guildId);
				guildConfig.push({
					authorId: message.author.id,
					cleanSetting: "never"
				});
				saveGuildConfig(guildConfig, message.guildId);
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