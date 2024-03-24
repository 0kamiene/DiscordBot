require("dotenv").config();
const { Client, IntentsBitField, ActivityType } = require("discord.js");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const http = require("http");
const { channel } = require("diagnostics_channel");
const T = require("tesseract.js");
const axios = require("axios");
const fs = require("fs");

let mainWindow;

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
	],
});

//Console Log For When The Application Is Opened
client.once("ready", () => {
	console.log(`${client.user.username} bot is now online...`);
	client.user.setActivity({
		name: "Night Crows",
		type: ActivityType.Playing,
	});
});

client.login(process.env.TOKEN);

// Create Electron window

app.on("ready", () => {
	mainWindow = new BrowserWindow({
		width: 500,
		height: 700,
		icon: path.join(__dirname, "icon.ico"),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	mainWindow.loadFile("index.html");

	//mainWindow.webContents.openDevTools();
});

// Check Internet Status
async function checkInternetConnectionAndNotify() {
	try {
		const module = await import("is-online");
		const isOnline = module.default;
		const online = await isOnline();
		if (online) {
			return true;
		} else {
			return false;
		}
	} catch (error) {
		console.error("Error checking internet connection:", error);
	}
}

// Function to send internet connection status to renderer process
async function sendInternetStatusToRenderer() {
	try {
		const isConnected = await checkInternetConnectionAndNotify();
		mainWindow.webContents.send("checkInternetStatus", isConnected);
	} catch (error) {
		console.error("Error sending internet connection status:", error);
	}
}

// Call the function to send internet connection status initially and every 5 seconds
sendInternetStatusToRenderer();
setInterval(sendInternetStatusToRenderer, 5000);

// Application Commands
client.on("interactionCreate", (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	if (interaction.commandName === "help") {
		interaction.reply(
			"Available Commands:\n/help : Displays all available commands."
		);
	}
});
client.on("ready", () => {
	const guildIn = client.guilds.cache; // Fetch All the Guild the Bot is Invited

	const guildBotIsIn = guildIn.map((guild) => ({
		id: guild.id,
		name: guild.name,
	}));
	//console.log(guildBotIsIn);
	mainWindow.webContents.send("guildBotIsIn", guildBotIsIn); // use guildBotIsIn in renderer.js
});

// Fetch channels from Discord and send data to renderer process
ipcMain.on("guildIdValue", async (event, data) => {
	try {
		const guildId = data.guildId;
		const guildIdUsed = await client.guilds.fetch(guildId); // Used to get Guild ID/Server ID
		//console.log(guildIdUsed); // Guild ID

		// Fetch channels
		const channels = guildIdUsed.channels.cache;
		//console.log('Fetched channels:', channels.size); // Log the number of channels fetched
		channels.forEach((channel) => {
			if (channel.type === 0) {
				//console.log(`Channel (${channel.id})`);// Logs of all the Text Type Channels
			}
		});

		// Filter channels
		const textChannels = channels.filter((channel) => channel.type === 0); // Filtered Text Channels
		console.log("Text Channels Detected:", textChannels.size); // Log the Number of Text Channels Fetched
		const voiceChannels = channels.filter((channel) => channel.type === 2); // Filtered Voice Channels
		console.log("Voice Channels Detected:", voiceChannels.size); // Log the Number of Voice Channels Fetched

		const textChannelsData = textChannels.map((channel) => ({
			id: channel.id,
			name: channel.name,
		}));
		const voiceChannelsData = voiceChannels.map((channel) => ({
			id: channel.id,
			name: channel.name,
		}));
		//console.log("guildBotIsIn", guildBotIsIn);

		mainWindow.webContents.send("textChannelsData", textChannelsData); // use textChannelsData in renderer.js
		mainWindow.webContents.send("voiceChannelsData", voiceChannelsData); // use voiceChannelsData in renderer.js

		client.on("messageCreate", async (message) => {
			// Check if the message has attachments
			if (message.author.bot) return; // Ignore messages from bots
			console.log(
				`[${new Date().toLocaleString()}] Message from ${message.author.username} in channel ${message.channel.id}`
			);
		});

		client.on("messageCreate", async (message) => {
			// Check if the message has attachments
			if (message.author.bot) return; // Ignore messages from bots
			if (message.attachments.size > 0) {
				// Iterate over each attachment
				message.attachments.forEach(async (attachment) => {
					// Check if the attachment is an image
					if (attachment.contentType.startsWith("image")) {
						console.log("Message contains an image:", attachment.url);
						if (message.guild && message.guild.id === guildId) {
							console.log(message.content);

							const imageAttachmentPrefix =
								"https://cdn.discordapp.com/attachments/";

							// Check if the attachment URL starts with the image prefix
							if (attachment.url.startsWith(imageAttachmentPrefix)) {
								try {
									// Download the image to a temporary file
									const tempImagePath = path.join(__dirname, "temp_image.png");
									await downloadImage(attachment.url, tempImagePath);

									// Perform OCR on the downloaded image
									const result = await T.recognize(tempImagePath, "eng");
									console.log(result.data.text);
									message.channel.send(result.data.text);

									// Remove the temporary file after OCR
									fs.unlinkSync(tempImagePath);
								} catch (error) {
									console.error("Error performing OCR:", error);
								}
							} else {
								// If the attachment is not an image, handle accordingly (optional)
								console.log("Attachment is not an image.");
							}
						}
					}
				});
			}
		});
	} catch (error) {
		console.error("Error fetching channels:", error);
	}
});

// Function to download the image from the URL
async function downloadImage(url, destination) {
	const response = await axios({
		url,
		method: "GET",
		responseType: "stream",
	});
	response.data.pipe(fs.createWriteStream(destination));
	return new Promise((resolve, reject) => {
		response.data.on("end", () => {
			resolve();
		});
		response.data.on("error", (error) => {
			reject(error);
		});
	});
}

// Listen for IPC message from renderer process
ipcMain.on("sendData0", (event, data) => {
	console.log("Submitted data:", data);

	// Access selected channel ID and text format from the data object
	const { selectedChannelId, msg } = data;

	// Retrieve the channel object from the client
	const channel = client.channels.cache.get(selectedChannelId);

	// Check if the channel exists and is a text channel
	if (channel && channel.isTextBased) {
		// Send the text format to the selected channel
		channel.send(msg);
		dialog
			.showMessageBox({
				type: "info",
				message: `Message sent to #${channel.name}.`,
				title: "Message Sent",
				buttons: ["OK"],
			})
			.then(() => console.log("Message sent successfully."))
			.catch((error) => console.error("Error sending message:", error));
	} else {
		console.log("Channel not found or not a text channel.");
	}
});
