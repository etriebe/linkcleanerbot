const { Client, Collection, Events, GatewayIntentBits, Intents, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("messageCreate", async message => {
	await FixAllLinkTypes(message);
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

try {
	console.log();
	client.login(token);
} catch (e) {
	console.log('Error:', e.stack);
}


async function FixAllLinkTypes(message) {
	let linkMatches = [...message.content.matchAll(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gm)];

	for (let i = 0; i < linkMatches.length; i++) {
		const currentLinkMatch = linkMatches[i];
		// let newLinkMessage = `Sent by <@${message.userId}>`;
		let newLinkMessage = ``;
		const fullLinkMatch = currentLinkMatch[0];
		if (fullLinkMatch.includes("twitter.com") && !fullLinkMatch.includes("vxtwitter.com")) {
			newLinkMessage = currentLinkMatch[0].replace("twitter.com", "vxtwitter.com");
		}
		if ((fullLinkMatch.includes("https://x.com") || fullLinkMatch.includes("https://www.x.com")) && !fullLinkMatch.includes("fixvx.com")) {
			newLinkMessage = currentLinkMatch[0].replace("x.com", "fixvx.com");
		}
		if (fullLinkMatch.includes("tiktok.com") && !fullLinkMatch.includes("tnktok.com")) {
			newLinkMessage = currentLinkMatch[0].replace("tiktok.com", "tnktok.com");
		}
		// if (fullLinkMatch.includes("tiktok.com") && !fullLinkMatch.includes("vxtiktok.com"))
		// {
		// 	newLinkMessage = currentLinkMatch[0].replace("tiktok.com", "vxtiktok.com");
		// }
		if (fullLinkMatch.includes("reddit.com") && !fullLinkMatch.includes("vxreddit.com")) {
			newLinkMessage = currentLinkMatch[0].replace("reddit.com", "vxreddit.com");
		}

		if (newLinkMessage == "") {
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
					.setStyle(ButtonStyle.Secondary)
			);

		let interaction = await message.reply({ content: 'Do you want to delete your message?', components: [row] , ephemeral: true});

		const filter = i => i.customId === 'yes' || i.customId === 'no';
		const collector = message.channel.createMessageComponentCollector({ filter, time: 15000 });

		collector.on('collect', async i => {
			if (i.customId === 'yes') {
				await message.delete();
				await i.reply({ content: 'Message deleted!', ephemeral: true });
			} else if (i.customId === 'no') {
				await i.reply({ content: 'Message not deleted.', ephemeral: true });
			}
			interaction.delete();
			collector.stop();
		});

		collector.on('end', collected => {
			if (collected.size === 0) {			
				interaction.delete();
				message.reply({ content: 'No response received. Message not deleted.', ephemeral: true });
			}
		});
	}
}