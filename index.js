const { Client, REST, GatewayIntentBits, Routes, Events, Collection, ChannelType, PermissionsBitField } = require('discord.js');
const { ChatGPT } = require('chatgpt-wrapper');
const fs = require('node:fs');
const path = require('node:path');
const DB = require("@replit/database");
const db = new DB();
const chat = new ChatGPT({
  API_KEY: process.env.GPTTOKEN,
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);
const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

client.commands = new Collection();
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  var command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
  }
}

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands with the current set
    const data = await rest.put(
      Routes.applicationCommands(process.env.BOTCLIENTID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.on(Events.MessageCreate, async message => {
  // Check if the message mentions any roles
  if (message.mentions.roles.size > 0) {
    const mentionedRoles = message.mentions.roles;
    let roles = await db.get('GPTBot-roles');
    for (let i = 0; i < roles.length; i++) {
      const role = message.guild.roles.cache.find(role => role.name === roles[i]);
      if (mentionedRoles.some(el => Object.is(el.name, roles[i]))) {
        const prompt = await db.get(roles[i]);
        console.log(prompt);
        console.log(message.content);
        const res = await chat.send({
          model: 'gpt-3.5-turbo-0301',
          messages: [{
            role: 'system',
            content: prompt,
          }, {
            role: 'user',
            content: message.content,
          }],
          max_tokens: 200,
        });
        await message.reply(`**${roles[i]}**: ${res.choices[0].message.content}`);
      }
    }
  }
});

client.login(process.env.BOTTOKEN);