import { ButtonInteraction, CommandInteraction, Emoji, EmojiIdentifierResolvable, Guild, GuildMember, Message, ActionRowBuilder, MessageActionRowComponent, ButtonBuilder, ButtonStyle, MessageComponent, MessageComponentInteraction, SelectMenuBuilder, SelectMenuComponentOptionData, MessageSelectOption, ComponentEmojiResolvable, ComponentType, ChannelType, RestOrArray, AnyComponentBuilder, embedLength, ThreadChannel, italic, StageChannel } from "discord.js";
import { UserProfile } from "./xpmanager";
const { get } = require('./xpmanager')
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
const fs = require('fs')
let can = require('canvas')
let displayValues = [["Red ", "Blue ", "Green ", "Yellow ", "Wild "], ["Draw 2", "Reverse", "Skip"]]
const reso = 0.1
type Player = { "id": string, "hand": (string | undefined)[] }
type Game = { id: string, msg: Message | null, deck: string[], players: Player[], round: number, inLobby: boolean, timeouts: any[], host: string, forceColor?: undefined | string }
const newDeck = ["w", "w", "wz", "wz", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g0", "gs", "gd", "gr", "gs", "gd", "gr", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b0", "bs", "bd", "br", "bs", "bd", "br", "y1", "y2", "y3", "y4", "y5", "y6", "y7", "y8", "y9", "y1", "y2", "y3", "y4", "y5", "y6", "y7", "y8", "y9", "y0", "ys", "yd", "yr", "ys", "yd", "yr", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r0", "rs", "rd", "rr", "rs", "rd", "rr"]
let games: Game[] = []

function res(num: number) {
  return num * reso
}

function getLabel(card: string) {
  let label = ''
  displayValues[0].forEach(color => {
    if (card.startsWith(color.charAt(0).toLowerCase())) {
      label = color
    }
  })
  let success = false
  displayValues[1].forEach(type => {
    if (card.endsWith(type.charAt(0).toLowerCase())) {
      label = label + type
      success = true
    }
  })
  if (!success) {
    if (card.endsWith('z')) {
      label = label + 'Draw 4'
    } else {
      label = label + card.charAt(1)
    }
  }
  return label
}
function reverseCycle(players: Player[], currentID: string) {
  for (let i = 0; i < players.length; i++) {
    let player = players.pop()
    if (player) {
      players.splice(i, 0, player)
    }
  }
  while (players[0].id != currentID) {
    let player = players.pop()
    if (player) {
      players.splice(0, 0, player)
    }
  }
  return players
}
async function rotatedImg(card: string) {
  const canvas = can.createCanvas(450, 700)
  let ctx = canvas.getContext('2d')
  ctx.translate(225, 350)
  ctx.rotate(3.14)
  ctx.translate(-225, -350)
  ctx.drawImage(await can.loadImage(`./cards/${card}.png`, 450, 700), 0, 0)
  return canvas
}

async function dispBoard(hands: (string | undefined)[][], game: Game, hidden: boolean) {
  console.log(hands[0])
  const canvas = can.createCanvas(res(7000), res(7000))
  let ctx = canvas.getContext('2d')
  let logo2 = await can.loadImage(`./cards/logo2.png`)
  //ctx.drawImage(await can.loadImage('./cards/wood.jpg'), 0, 0, res(7000), res(7000))
  ctx.drawImage(await can.loadImage('./cards/logo.png'), res(2500), res(2750), res(900), res(1400))
  ctx.drawImage(await can.loadImage(`./cards/${game.deck[0]}.png`), res(3600), res(2750), res(900), res(1400))
  ctx.translate(res(3500), res(3500))
  ctx.rotate(3.14)
  ctx.translate(-res(3500), -res(3500))
  for (let i = 0; i < hands[0].length; i++) {
    const card = hands[0][i]
    if (i > 9) {
      ctx.drawImage((hidden) ? logo2 : await rotatedImg(card ? card : 'logo'), res(3500) - res(2300) - res(50) * (i - 10), res(50), res(450), res(700))
    } else {
      ctx.drawImage((hidden) ? logo2 : await rotatedImg(card ? card : 'logo'), res(3500) - ((hands[0].length <= 10) ? res(230) * hands[0].length : res(2300)) + res(460) * i, res(50), res(450), res(700))
    }
  }
  ctx.translate(res(3500), res(3500))
  ctx.rotate((hands.length < 3) ? 3.14 : 1.57)
  ctx.translate(-res(3500), -res(3500))
  for (let i = 1; i < hands.length; i++) {
    const hand = hands[i];
    for (let i = 0; i < hand.length; i++) {
      const card = hand[i]
      if (i > 9) {
        ctx.drawImage(logo2, res(3500) - res(2300) - res(50) * (i - 10), res(50), res(450), res(700))
      } else {
        ctx.drawImage(logo2, res(3500) - ((hand.length <= 10) ? res(230) * hand.length : res(2300)) + res(460) * i, res(50), res(450), res(700))
      }
    }
    ctx.translate(res(3500), res(3500))
    ctx.rotate((hands.length < 3) ? 3.14 : 1.57)
    ctx.translate(-res(3500), -res(3500))
  }
  return canvas.toBuffer()
}
function newPlayer(plr: string) {
  return { "id": plr, "hand": [] }
}

function createButtons(rawButtons: { string: string, id: string, style: ButtonStyle, emoji?: ComponentEmojiResolvable | null, disabled?: boolean }[]) { // PRIMARY:Blue DANGER:Red SUCCESS:GREEN
  let buttons: ButtonBuilder[] = []
  rawButtons.forEach(buttonData => {
    let button = new ButtonBuilder()
      .setCustomId(buttonData.id)
      .setLabel(buttonData.string)
      .setStyle(buttonData.style)
      .setDisabled(false)
    if (buttonData.emoji) {
      button.setEmoji(buttonData.emoji)
    }
    buttons.push(button)
  })
  let row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(buttons)
  return row
}
function randomizeArray(array: any[]) {
  let a = array.slice()
  let b = []
  for (let i = 0; i < array.length; i++) {
    const randomElement = a[Math.floor(Math.random() * a.length)]
    a.splice(a.indexOf(randomElement), 1)
    b.push(randomElement)
  }
  return b
}
///////////////////
// Game Creation //
///////////////////
exports.startNewGame = async function startNewGame(interaction: CommandInteraction) {
  let unochan = interaction.guild?.channels.cache.find(chan => chan.name == 'uno-matches')
  let member = interaction.member
  if (unochan && unochan.type == ChannelType.GuildForum && member instanceof GuildMember) {
    let message = undefined
    let game: Game
    let embed = new EmbedBuilder()
      .setTitle(`${member.displayName}'s Uno Match`)
      .setDescription(`Click the join button below to participate in the match, as the host you can start or cancel the match.\n\n1/4 players have joined`)
      .setColor('Gold')
      .setThumbnail(`https://cdn.discordapp.com/attachments/758884272572071944/971648962505351198/logo.png`)
      .addFields([{ name: member.displayName, value: `Level ${require('./userdata.json').users.find((user: UserProfile) => user.id == interaction.user.id).level}` }])
    let gameChan = await unochan.threads.create({ name: `${interaction.user.username}s-uno-match`, message: { embeds: [embed], components: [createButtons([{ string: "🎮 Join Match", id: "join", style: ButtonStyle.Success }, { string: "Start Match", id: "start", style: ButtonStyle.Success, emoji: "814199679704891423" }, { string: "Cancel Match", id: "cancel", style: ButtonStyle.Danger, emoji: "814199666778308638" }])] } })
    interaction.reply(`[InDev] Game starting in <#${gameChan.id}>`)
    const collector = gameChan?.createMessageComponentCollector({ componentType: ComponentType.Button })
    collector?.on('collect', async i => {
      console.log('received')
      if (!game) {
        game = { id: gameChan.id, msg: i.message, deck: newDeck, players: [newPlayer(interaction.user.id)], round: 0, inLobby: true, timeouts: [], host: interaction.user.id }
        games.push(game)
      }
      if (i.customId == 'join') {
        if (game.players.find(plr => plr.id == i.user.id)) {
          await i.reply({ content: 'You are already in this match.', ephemeral: true })
        } else if (i.member instanceof GuildMember) {
          game.players.push(newPlayer(i.user.id))
          let user = require('./userdata.json').users.find((user: UserProfile) => user.id == i.user?.id)
          embed?.addFields({ name: i.member?.displayName, value: `Level ${user ? user.level : '<Unknown>'}`, inline: false })
          embed.setDescription(`Click the join button below to participate in the match, as the host you can start or cancel the match.\n\n${game.players.length}/4 players have joined`)
          await i.update({ embeds: [embed] })
        }
      } else if (i.user?.id == game.host) {
        if (i.customId == 'cancel') {
          if (i.user.id == interaction.user.id) {
            if (game) {
              games.splice(games.indexOf(game), 1)
            }
            gameChan.delete('Game cancelled')
            games.splice(games.indexOf(game), 1)
          } else {
            await i.reply({ content: "Only the host can perform this action", ephemeral: true })
          }
        } else if (i.customId == 'start') {
          if (game.players.length > 1) {
            collector.stop()
            game.deck = randomizeArray(game.deck)
            for (let i = 0; i < game.players.length; i++) {
              const element = game.players[i];
              element.hand = [game.deck.pop(), game.deck.pop(), game.deck.pop(), game.deck.pop(), game.deck.pop(), game.deck.pop(), game.deck.pop()]
            }
            startTurn(i, game)
          } else {
            await i.reply({ content: "There must be more than 1 player for the game to start", ephemeral: true })
          }
        }
      } else {
        await i.reply({ content: 'Command is only available to host', ephemeral: true })
      }
    })
  } else {
    interaction.reply('Could not find uno forum.')
  }
}

// Turn Start

async function startTurn(interaction: MessageComponentInteraction, game: Game) {
  if (game.msg instanceof Message) {
    let player = game.players[game.round % game.players.length]
    let member = interaction.guild?.members.cache.get(player.id) ? interaction.guild?.members.cache.get(player.id) : interaction.member
    let hands: (string | undefined)[][] = []
    hands.push(player.hand)
    for (let i = 0; i < game.players.length; i++) {
      const plr = game.players[(game.round + i) % game.players.length]
      if (plr != player) {
        hands.push(plr.hand)
      }
    }
    const attachment = new AttachmentBuilder(await dispBoard(hands, game, true));
    await game.msg.edit({ content: '<a:loading:1011794755203645460>', embeds: [], components: [] })
    await game.msg.edit({
      content: null,
      embeds: [{ "title": `${member instanceof GuildMember ? member.displayName : '<DATA ERROR>'}'s turn (${game.round + 1})`, "description": `15 Seconds until turn forfeited`, "color": 0xed0606, "thumbnail": { "url": `attachment://board.png`, "height": 700, "width": 450 } }], components: [createButtons([{ string: "Begin Turn", id: "turn", style: ButtonStyle.Primary }])],
      files: [attachment]
    })
    if (interaction.channel instanceof StageChannel) {return}
    let collector = interaction.channel?.createMessageComponentCollector({ componentType: ComponentType.Button, filter: i => i.user.id == player.id, max: 1 })
    collector?.on('collect', async (i:ButtonInteraction) => {
      await i.deferReply({ ephemeral: true })
      const attachment = new AttachmentBuilder(await dispBoard(hands, game, false));
      await game.msg?.edit({ content: '<a:loading:1011794755203645460>', embeds: [], components: [] })
      await game.msg?.edit({
        content: null,
        embeds: [{ "title": `${i.member instanceof GuildMember ? i.member.displayName : i.user.id} has begun round ${game.round + 1}`, "description": `They have 30 seconds to play or draw a card.`, "color": 0xed0606, "thumbnail": { "url": `attachment://board.png`, "height": 700, "width": 450 } }], components: undefined,
        files: Array.from(game.msg.attachments.values())
      })
      let playableCards = [{ label: 'Draw', value: 'draw' }]
      player.hand.forEach(card => {
        if (playableCards.find(card1 => card1.value == card) == undefined && (card?.startsWith(game.forceColor ? game.forceColor : game.deck[0].charAt(0)) || card?.charAt(1) == game.deck[0].charAt(1) || card?.startsWith('w'))) {
          playableCards.push({ label: getLabel(card), value: card })
        }
      })
      let SelectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
        new SelectMenuBuilder()
          .setCustomId('playcard')
          .addOptions(playableCards)
      )
      await i.editReply({
        components: [SelectMenu],
        files: [attachment],
        embeds: [
          new EmbedBuilder()
            .setTitle('Time to make your move')
            .setDescription(`It is now your turn, you have 30 seconds to play or draw a card.`)
            .setColor(0xed0606)
            .setThumbnail(`attachment://board.png`)
        ]
      })
      if (interaction.channel instanceof StageChannel) {return}
      let collector = interaction.channel?.createMessageComponentCollector({ componentType: ComponentType.SelectMenu, max: 1 })
      collector?.on('collect', async interaction => {
        let embed:EmbedBuilder
        if (interaction.values[0] !== 'draw') {
          game.forceColor = undefined
          player.hand.splice(player.hand.findIndex(card => card == interaction.values[0]), 1)
          game.deck.splice(0, 0, interaction.values[0])
          if (player.hand.length == 0&&!(game.msg?.channel instanceof StageChannel)) {
            let embed = new EmbedBuilder()
              .setTitle(`Game Over`)
              .setDescription(`${interaction.user.username} has won the game.`)
            await game.msg?.channel.send({ embeds: [embed] })
            games.splice(games.findIndex(gam => gam == game), 1)
          }
          embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle(`Round ${game.round + 1}`)
          .setDescription(`${interaction.user.username} Played a ${getLabel(interaction.values[0])}`)
          .setThumbnail(`attachment://board.png`)
        } else {
          embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle(`Round ${game.round + 1}`)
          .setDescription(`${interaction.user.username} Drew a card`)
          .setThumbnail(`attachment://board.png`)
        }
        if (interaction.values[0].startsWith('w')) {
          let row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('red')
                .setLabel('Red')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId('blue')
                .setLabel('Blue')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('green')
                .setLabel('Green')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('yellow')
                .setLabel('Yellow')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('1032791232449085590')
            )
          let embed1 = new EmbedBuilder()
            .setTitle(`Round ${game.round + 1}`)
            .setDescription(`Choose a color to switch to.`)
            .setThumbnail(`attachment://board.png`)
          if (interaction.channel instanceof StageChannel) {return}
          let message = await interaction.channel?.send({ components: [row], embeds: [embed1] })
          let collector = interaction.channel?.createMessageComponentCollector({ componentType: ComponentType.Button, filter: i => i.user.id == player.id && ['green', 'red', 'blue', 'yellow'].includes(i.customId), max: 1 })
          collector?.on('collect', async i => {
            embed1.setDescription(`The color is now ${i.customId}.`)
            message?.edit({ embeds: [embed] })
            game.forceColor = i.customId.charAt(0)
            if (interaction.values[0].endsWith('d')) {
              let nextPlr = game.players[(game.round + 1) % game.players.length];
              nextPlr.hand.push(game.deck.pop());
              nextPlr.hand.push(game.deck.pop());
              nextPlr.hand.push(game.deck.pop());
              nextPlr.hand.push(game.deck.pop());
              embed.setDescription(embed.data.description + ` and made @<${nextPlr.id}> draw 4 cards. The color is now ${i.customId}.`);
              game.round++;
            } else {
              embed.setDescription(embed.data.description + ` and changed the color to ${i.customId}`);
            }
            await game.msg?.edit({ embeds: [embed], components: [] })
            if (interaction.channel instanceof StageChannel) {return}
            let msg = await interaction.channel?.send('<a:loading:1011794755203645460>')
            if (msg instanceof Message) {
              game.msg = msg
            }
            game.round++
            startTurn(interaction, game)
          })
        } else {
          if (interaction.values[0].endsWith('s')) {
            game.round++
          } else if (interaction.values[0].endsWith('d')) {
            game.players[(game.round + 1) % game.players.length].hand.push(game.deck.pop())
            game.players[(game.round + 1) % game.players.length].hand.push(game.deck.pop())
            game.round++
          } else if (interaction.values[0].endsWith('r')) {
            reverseCycle(game.players, player.id)
            if (game.players.length == 2) {
              game.round++
            }
          } else if (interaction.values[0] == 'draw') {
            game.players[game.round % game.players.length].hand.push(game.deck.pop())
          }
          await game.msg?.edit({ embeds: [embed], components: [] })
          if (interaction.channel instanceof StageChannel) {return}
          let msg = await interaction.channel?.send('<a:loading:1011794755203645460>')
          if (msg instanceof Message) {
            game.msg = msg
          }
          if (player.hand.length > 0) {
          game.round++
          startTurn(interaction, game)
          }
        }
      })
    })
  } else {
    if (interaction.channel instanceof StageChannel) {return}
    interaction.channel?.send('Fuck.')
  }
}