import { logger, prisma, regex } from '@lukittu/shared';
import { ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../structures/command';

export default Command({
  data: {
    name: 'choose-team',
    description: 'Choose a team to use with this bot',
    ephemeral: true,
    options: [
      {
        name: 'team',
        description: 'The team to select',
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
    ],
  },
  autocomplete: async (interaction, discordAccount) => {
    try {
      const teams = discordAccount.user.teams;

      const focusedValue = interaction.options.getFocused().toLowerCase();
      const filtered = teams.filter((team) =>
        team.name.toLowerCase().includes(focusedValue),
      );

      await interaction.respond(
        filtered.map((team) => ({
          name: team.name,
          value: team.id,
        })),
      );
    } catch (error) {
      logger.error('Error in choose-team autocomplete:', error);
      await interaction.respond([]);
    }
  },
  execute: async (interaction, discordAccount) => {
    try {
      const teamId = interaction.options.getString('team', true);

      if (!regex.uuidV4.test(teamId)) {
        await interaction.editReply({
          content: 'Invalid team ID format.',
        });
        return;
      }

      if (!discordAccount) {
        await interaction.editReply({
          content: 'You need to link your Discord account first.',
        });
        return;
      }

      // Check if the user is a member of the specified team
      const team = discordAccount.user.teams.find((team) => team.id === teamId);

      if (!team) {
        await interaction.editReply({
          content:
            'You are not a member of this team or the team does not exist.',
        });
        return;
      }

      if (!team.discordIntegration?.active) {
        await interaction.editReply({
          content:
            'The selected team does not have the Discord integration enabled.',
        });
        return;
      }

      await prisma.discordAccount.update({
        where: {
          id: discordAccount.id,
        },
        data: {
          selectedTeamId: teamId,
        },
      });

      await interaction.editReply({
        content: `You have selected the team: ${team.name}`,
      });
    } catch (error) {
      logger.error('Error in choose-team command:', error);
      await interaction.editReply({
        content: 'An error occurred while selecting the team.',
      });
    }
  },
});
