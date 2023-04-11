const { SlashCommandBuilder } = require('discord.js');
const { ChatGPT } = require('chatgpt-wrapper');

const chat = new ChatGPT({
  API_KEY: process.env.GPTTOKEN,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask question to ChatGPT')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Question to ask')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const msg = interaction.options.getString('question', true);
    const res = await chat.send(msg);
    interaction.reply({ content: res.choices[0].message.content});
  },
};

