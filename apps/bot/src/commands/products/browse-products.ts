import { logger, prisma, Product } from '@lukittu/shared';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { Command } from '../../structures/command';

type ExtendedProduct = Product & {
  metadata: { key: string; value: string }[];
  _count: {
    licenses: number;
    releases: number;
  };
  latestRelease?: {
    version: string;
    createdAt: Date;
  } | null;
  releases?: {
    version: string;
    createdAt: Date;
    latest: boolean;
  }[];
};

const PAGE_SIZE = 1;

function createTimestamps(product: ExtendedProduct) {
  return {
    createdAt: Math.floor(new Date(product.createdAt).getTime() / 1000),
    updatedAt: Math.floor(new Date(product.updatedAt).getTime() / 1000),
  };
}

function createActionRows(
  currentPage: number,
  totalPages: number,
  productId: string,
): ActionRowBuilder<ButtonBuilder>[] {
  const paginationRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('first')
      .setEmoji('1029435230668476476')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId('prev')
      .setEmoji('1029435199462834207')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId('next')
      .setEmoji('1029435213157240892')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages),
    new ButtonBuilder()
      .setCustomId('last')
      .setEmoji('1029435238948032582')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === totalPages),
  );

  const dashboardRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel('View in Dashboard')
      .setURL(`${process.env.BASE_URL}/dashboard/products/${productId}`)
      .setStyle(ButtonStyle.Link),
  );

  return [paginationRow, dashboardRow];
}

function createProductEmbed(
  product: ExtendedProduct,
  teamName: string,
  teamImageUrl: string | null,
  currentPage: number,
  totalProducts: number,
  userImageUrl: string | null,
) {
  const timestamps = createTimestamps(product);

  const embed = new EmbedBuilder()
    .setTitle(`Product: ${product.name}`)
    .setColor(Colors.Blue)
    .setDescription(
      product.url
        ? `**Website:** [${product.url}](${product.url})`
        : 'No website provided',
    )
    .addFields({
      name: 'ID',
      value: '```yaml\n' + product.id + '```',
      inline: false,
    });

  embed.addFields(
    {
      name: 'Created',
      value: `<t:${timestamps.createdAt}:f>`,
      inline: true,
    },
    {
      name: 'Last Updated',
      value: `<t:${timestamps.updatedAt}:f>`,
      inline: true,
    },
  );

  embed.addFields(
    {
      name: 'Total Licenses',
      value: `${product._count.licenses} customers`,
      inline: true,
    },
    {
      name: 'Total Releases',
      value: `${product._count.releases}`,
      inline: true,
    },
  );

  if (product.latestRelease) {
    const releaseTimestamp = Math.floor(
      new Date(product.latestRelease.createdAt).getTime() / 1000,
    );
    embed.addFields({
      name: 'Latest Release',
      value: `v${product.latestRelease.version}\nReleased: <t:${releaseTimestamp}:R>`,
      inline: true,
    });
  }

  if (product.metadata.length > 0) {
    embed.addFields({
      name: '\u200B',
      value: `**Metadata (${product.metadata.length} total)**`,
      inline: false,
    });

    const displayMetadata = product.metadata.slice(0, 10);
    const hasMoreMetadata = product.metadata.length > 10;

    const metadataText = displayMetadata
      .map((meta) => `**${meta.key}**: ${meta.value}`)
      .join('\n');

    embed.addFields({
      name: 'Custom Fields',
      value:
        metadataText +
        (hasMoreMetadata
          ? `\n\n*${product.metadata.length - 10} more fields not shown*`
          : ''),
      inline: false,
    });
  }

  embed.setAuthor({
    name: teamName,
    iconURL: teamImageUrl || undefined,
  });

  embed.setFooter({
    text: `Product ${currentPage} of ${totalProducts}`,
    iconURL: userImageUrl || undefined,
  });

  return embed;
}

export default Command({
  data: {
    name: 'browse-products',
    description: 'Browse products for your selected team',
    ephemeral: true,
    options: [
      {
        name: 'page',
        description: 'Page number (defaults to 1)',
        type: ApplicationCommandOptionType.Integer,
        required: false,
        min_value: 1,
      },
      {
        name: 'search',
        description: 'Search by product name',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  execute: async (interaction, discordAccount) => {
    try {
      const page = interaction.options.getInteger('page') || 1;
      const search = interaction.options.getString('search') || '';

      const selectedTeam = discordAccount?.selectedTeam;
      if (!selectedTeam) {
        await interaction.editReply({
          content: 'Please select a team first using `/choose-team`.',
        });
        return;
      }

      const teamId = selectedTeam.id;
      const teamName = selectedTeam.name || 'Unknown Team';
      const teamImageUrl = selectedTeam.imageUrl;
      const userImageUrl = discordAccount.user.imageUrl;

      const totalProducts = await prisma.product.count({
        where: {
          ...(search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {}),
          teamId,
        },
      });
      const totalPages = Math.max(1, totalProducts);

      const validPage = page > totalPages ? 1 : page;
      const skip = (validPage - 1) * PAGE_SIZE;

      const products = await prisma.product.findMany({
        where: {
          ...(search
            ? { name: { contains: search, mode: 'insensitive' } }
            : {}),
          teamId,
        },
        skip,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        include: {
          metadata: true,
          _count: {
            select: {
              licenses: true,
              releases: true,
            },
          },
          releases: {
            where: {
              latest: true,
              branchId: null,
            },
            take: 1,
          },
        },
      });

      if (products.length === 0) {
        await interaction.editReply({
          content: 'No products found matching your criteria.',
        });
        return;
      }

      const currentProduct = products[0];
      const latestRelease =
        currentProduct.releases.length > 0 ? currentProduct.releases[0] : null;

      const enhancedProduct: ExtendedProduct = {
        ...currentProduct,
        latestRelease: latestRelease,
        releases: undefined,
      };

      const embed = createProductEmbed(
        enhancedProduct,
        teamName,
        teamImageUrl || null,
        validPage,
        totalProducts,
        userImageUrl,
      );

      const actionRows = createActionRows(
        validPage,
        totalPages,
        currentProduct.id,
      );

      const response = await interaction.editReply({
        embeds: [embed],
        components: actionRows,
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000, // 5 minutes timeout
      });

      let currentPage = validPage;

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: 'You cannot use these buttons.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        switch (i.customId) {
          case 'first':
            currentPage = 1;
            break;
          case 'prev':
            currentPage = Math.max(1, currentPage - 1);
            break;
          case 'next':
            currentPage = Math.min(totalPages, currentPage + 1);
            break;
          case 'last':
            currentPage = totalPages;
            break;
        }

        await i.deferUpdate();

        try {
          const skip = (currentPage - 1) * PAGE_SIZE;

          const newPageProducts = await prisma.product.findMany({
            where: {
              ...(search
                ? { name: { contains: search, mode: 'insensitive' } }
                : {}),
              teamId,
            },
            skip,
            take: PAGE_SIZE,
            orderBy: { createdAt: 'desc' },
            include: {
              metadata: true,
              _count: {
                select: {
                  licenses: true,
                  releases: true,
                },
              },
              releases: {
                where: {
                  latest: true,
                  branchId: null,
                },
                select: {
                  version: true,
                  createdAt: true,
                },
                take: 1,
              },
            },
          });

          if (newPageProducts.length === 0) {
            await i.editReply({
              content: 'No products found for this page.',
              embeds: [],
              components: [],
            });
            return;
          }

          const newProduct = newPageProducts[0];
          const newLatestRelease =
            newProduct.releases.length > 0 ? newProduct.releases[0] : null;

          const enhancedNewProduct: ExtendedProduct = {
            ...newProduct,
            latestRelease: newLatestRelease,
            releases: undefined,
          };

          const newEmbed = createProductEmbed(
            enhancedNewProduct,
            teamName,
            teamImageUrl || null,
            currentPage,
            totalProducts,
            userImageUrl,
          );

          const newActionRows = createActionRows(
            currentPage,
            totalPages,
            newProduct.id,
          );

          await i.editReply({
            embeds: [newEmbed],
            components: newActionRows,
          });
        } catch (error) {
          logger.error('Error handling pagination:', error);
          await i.editReply({
            content:
              'An error occurred while fetching products. Please try again later.',
            components: [],
            embeds: [],
          });
        }
      });

      collector.on('end', async () => {
        try {
          const finalActionRow =
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('View in Dashboard')
                .setURL(
                  `${process.env.BASE_URL}/dashboard/products/${currentProduct.id}`,
                )
                .setStyle(ButtonStyle.Link),
            );

          await interaction.editReply({
            embeds: [embed],
            components: [finalActionRow],
          });
        } catch (error) {
          logger.error('Error removing buttons:', error);
        }
      });
    } catch (error) {
      logger.error('Error in browse-products command:', error);
      await interaction.editReply({
        content:
          'An error occurred while fetching products. Please try again later.',
      });
    }
  },
});
