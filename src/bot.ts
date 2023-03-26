import { ChannelType, Client, EmbedType } from "discord.js";
import { config as DotenvBoostrap } from "dotenv";
import messageHandler from "./events/message/messageHandler";
import recordsHandler from "./events/records/recordsHandler";

// Load .env file
DotenvBoostrap();

console.log("Bot is starting...");

const client = new Client({
	intents: [
		"GuildPresences",
		"GuildMessages",
		"GuildMessageReactions",
		"GuildMembers",
		"GuildMessageTyping",
		"GuildVoiceStates",
		"Guilds",
		"DirectMessageReactions",
		"DirectMessages",
		"DirectMessageTyping",
	],
});

client.on("ready", (bot) => {
	console.log(bot.user.username + " is ready!");
});

client.on("messageCreate", messageHandler.messageCreated);
client.on("messageUpdate", messageHandler.messageUpdated);
client.on("presenceUpdate", recordsHandler.presenceUpdated);

const AFK_CHANNEL_ID = "826165731481485334";

const userLastVC = new Map<string, string>();
const userTogglingTiming = new Map<string, number>();

client.on("voiceStateUpdate", async (oldUserVS, newUserVS) => {
	// Check if user is joining a voice channel
	if (oldUserVS.channelId === null && newUserVS.channelId !== null) {
		if (!newUserVS.member?.id) return;
		userLastVC.set(newUserVS.member?.id, newUserVS.channelId);
	}

	// Check if user is leaving a voice channel
	if (oldUserVS.channelId !== null && newUserVS.channelId === null) {
		if (!newUserVS.member?.id) return;
		userLastVC.delete(newUserVS.member.id);
	}

	// Check if user is self muting
	if (oldUserVS.selfMute === false && newUserVS.selfMute === true) {
		if (!newUserVS.member?.id) return;
		if (!newUserVS.channelId) return;
		userLastVC.set(newUserVS.member.id, newUserVS.channelId);

		userTogglingTiming.set(newUserVS.member.id, Date.now());

		// Move user to another specific channel
		const channel = await client.channels.fetch(AFK_CHANNEL_ID);
		if (!channel) return;

		if (channel.type === ChannelType.GuildVoice) {
			await newUserVS.member.voice.setChannel(channel);

			newUserVS.member.send({
				embeds: [
					{
						type: EmbedType.Rich,
						title: `Aviso PH Club`,
						description: "",
						color: 0xf34601,
						fields: [
							{
								name: `Você mutou e foi movido para o canal de AFK 😠`,
								value: "",
							},
							{
								name: `Desmute para voltar ao canal que você estava 😌`,
								value: "",
							},
						],
					},
				],
			});

			return;
		}
	}

	// Check if user is self unmuting
	if (oldUserVS.selfMute === true && newUserVS.selfMute === false) {
		if (!newUserVS.member?.id) return;
		if (!newUserVS.channelId) return;

		const lastVC = userLastVC.get(newUserVS.member.id);
		if (!lastVC) return;

		const lastTogglingTime = userTogglingTiming.get(newUserVS.member.id);

		if (Date.now() - lastTogglingTime! <= 1700) return;

		const channel = await client.channels.fetch(lastVC);
		if (!channel) return;

		if (channel.type === ChannelType.GuildVoice) {
			await newUserVS.member.voice.setChannel(channel);

			userLastVC.delete(newUserVS.member.id);

			console.log(`${newUserVS.member.user.username} was moved to ${channel.name}`);

			return;
		}
	}
});

client.login(process.env.BOT_TOKEN);
