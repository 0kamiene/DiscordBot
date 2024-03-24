require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

// Registered Commands Here >>
const commands = [
    {
        name: 'help',
        description: 'Shows all the commands',
    },
    {
        name: 'makeformat',
        description: 'Make specific text format',
        options: [
            {
                name: 'channel',
                description: 'Provide channel',
                type: ApplicationCommandOptionType.Channel,
                required: true,
            },
            {
                name: 'text-format',
                description: 'Provide text',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log('Commands were registered successfully...');
        
        // Wait for user input before ending the script
        await new Promise((resolve) => {
            process.stdin.once('data', () => {
                console.log('Script ended.');
                resolve();
            });
        });
    } catch (error) {
        console.log(error);
    }
})();
