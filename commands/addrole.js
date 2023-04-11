const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Client = require("@replit/database")
const db = new Client()

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a ChatGPT Role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Role name')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName('prompt')
        .setDescription('Role prompt')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    const roleName = interaction.options.getString('name');
    const prompt = interaction.options.getString('prompt');
    const guild = interaction.guild;
    let role = guild.roles.cache.find(role => role.name === roleName);
    let action = "updated";
    if (!role) {
      role = await guild.roles.create({
        name: roleName,
        color: '#0000FF',
      });
      action = "added";
    }
    await interaction.member.roles.add(role);
    const botmember = await interaction.guild.members.fetch(interaction.client.user.id);
    botmember.roles.add(role);

    // Updates database
    let roles = await db.get("roles") || [];
    if (roles.indexOf(roleName) === -1) {
      roles.push(roleName);
    }
    await db.set("GPTBot-roles", roles);
    await db.set(roleName, prompt);

    interaction.reply({ content: `Role ${action}: ${roleName}`, ephemeral: true });
  },
};

