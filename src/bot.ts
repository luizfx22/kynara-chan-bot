import { Client } from "discord.js";
import { config as DotenvBoostrap } from "dotenv";

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
		"DirectMessageTyping"
	],
});

client.on("ready", (bot) => {
	console.log(bot.user.username + " is ready!")
});

client.on("messageCreate", (message) => {
	if (message.mentions.everyone) {
		message.reply(
			"https://tenor.com/view/who-pinged-me-everyone-here-discord-gif-18804728"
		);
	}
})

client.login(process.env.BOT_TOKEN);

