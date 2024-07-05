const { Client, Collection, Events, GatewayIntentBits, Intents, Partials } = require('discord.js');
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
	partials: [Partials.Channel, Partials.Message]
});
const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient =>
{
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("messageCreate", async message =>
{
	await FixTwitterLink(message);
	await FixXLink(message);
	await FixTikTokLink(message);
});

try
{
	console.log();
	client.login(token);
} catch (e)
{
	console.log('Error:', e.stack);
}

async function FixTwitterLink(message)
{
	let linkMatches = [...message.content.matchAll(/https:\/\/(www\.)?twitter\.com\/(?<username>.+)\/status\/(?<messageid>\d+)/gm)];

	for (let i = 0; i < linkMatches.length; i++)
	{
		const currentLinkMatch = linkMatches[i];
		const newLinkMessage = `https://fxtwitter.com/${currentLinkMatch.groups.username}/status/${currentLinkMatch.groups.messageid}`;
		await message.channel.send(newLinkMessage);
	}
}

async function FixXLink(message)
{
	let linkMatches = [...message.content.matchAll(/https:\/\/(www\.)?x\.com\/(?<username>.+)\/status\/(?<messageid>\d+)/gm)];

	for (let i = 0; i < linkMatches.length; i++)
	{
		const currentLinkMatch = linkMatches[i];
		const newLinkMessage = `https://fixupx.com/${currentLinkMatch.groups.username}/status/${currentLinkMatch.groups.messageid}`;
		await message.channel.send(newLinkMessage);
	}
}

async function FixTikTokLink(message)
{
	let linkMatches = [...message.content.matchAll(/https:\/\/(www\.)?twitter\.com\/t\/(?<messageid>.+)/gm)];

	for (let i = 0; i < linkMatches.length; i++)
	{
		const currentLinkMatch = linkMatches[i];
		const newLinkMessage = `https://www.vxtiktok.com/t/${currentLinkMatch.groups.messageid}`;
		await message.channel.send(newLinkMessage);
	}
}