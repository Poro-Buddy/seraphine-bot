//Import Modules
const ee = require(`../../botconfig/embed.json`);
const settings = require(`../../botconfig/settings.json`);
const { onCoolDown, replacemsg } = require("../../handlers/functions");
const Discord = require("discord.js");
var con = require("../../db.js");
const emojis = require("../../botconfig/emojis.json");
module.exports = (client, interaction) => {
	const CategoryName = interaction.commandName;
	let command = false;
  let button = false;
	try{
    	    if (client.slashCommands.has(CategoryName + interaction.options.getSubcommand())) {
      		command = client.slashCommands.get(CategoryName + interaction.options.getSubcommand());
    	    }
  	}catch{
    	    if (client.slashCommands.has("normal" + CategoryName)) {
      		command = client.slashCommands.get("normal" + CategoryName);
   	    }
	}
  try{
    if(interaction.isButton()){
      button = true;
    } else {
      button = false;
    }
  }catch (e) {
    console.log(String(e.stack).bgRed)
  }
	if(command) {
		if (onCoolDown(interaction, command)) {
			  return interaction.reply({ephemeral: true,
				embeds: [new Discord.MessageEmbed()
				  .setColor(ee.wrongcolor)
				  .setFooter(ee.footertext, ee.footericon)
				  .setTitle(replacemsg(settings.messages.cooldown, {
					prefix: prefix,
					command: command,
					timeLeft: onCoolDown(interaction, command)
				  }))]
			  });
			}
		//if Command has specific permission return error
        if (command.memberpermissions && command.memberpermissions.length > 0 && !interaction.member.permissions.has(command.memberpermissions)) {
          return interaction.reply({ ephemeral: true, embeds: [new Discord.MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(replacemsg(settings.messages.notallowed_to_exec_cmd.title))
              .setDescription(replacemsg(settings.messages.notallowed_to_exec_cmd.description.memberpermissions, {
                command: command,
                prefix: prefix
              }))]
          });
        }
        //if Command has specific needed roles return error
        if (command.requiredroles && command.requiredroles.length > 0 && interaction.member.roles.cache.size > 0 && !interaction.member.roles.cache.some(r => command.requiredroles.includes(r.id))) {
          return interaction.reply({ ephemeral: true, embeds: [new Discord.MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(replacemsg(settings.messages.notallowed_to_exec_cmd.title))
            .setDescription(replacemsg(settings.messages.notallowed_to_exec_cmd.description.requiredroles, {
              command: command,
              prefix: prefix
			}))]
          })
        }
        //if Command has specific users return error
        if (command.alloweduserids && command.alloweduserids.length > 0 && !command.alloweduserids.includes(interaction.member.id)) {
          return interaction.reply({ ephemeral: true, embeds: [new Discord.MessageEmbed()
            .setColor(ee.wrongcolor)
            .setFooter(ee.footertext, ee.footericon)
            .setTitle(replacemsg(settings.messages.notallowed_to_exec_cmd.title))
            .setDescription(replacemsg(settings.messages.notallowed_to_exec_cmd.description.alloweduserids, {
              command: command,
              prefix: prefix
            }))]
          });
        }
		//execute the Command
		command.run(client, interaction, interaction.member, interaction.guild)
	}
  // DOING BUTTON STUFF!
  /*
  if(button){
    //console.log(interaction);
    if(interaction.customId == 'lfg-approve'){
      let msgUser = interaction.message.embeds[0].footer.text;
      let oldEmbed = interaction.message.embeds[0];
      oldEmbed.setFooter(`HANDLED BY ${interaction.member.user.tag}`).setColor("GREEN").setTitle(`LFG REVIEW APPROVED!`)
      con.query(`UPDATE lfg_messages SET approved='1' WHERE user_id='${msgUser}' AND queue_message='${interaction.message.id}'`);
      interaction.message.edit({embeds: [oldEmbed], components: []});
      interaction.reply({content: `${emojis.heart} You have **approved** LFG request successfully!`, ephemeral: true})

      con.query(`SELECT * FROM lfg_messages WHERE user_id='${msgUser}' AND queue_message='${interaction.message.id}'`, function (infoerr, infores){
        const lfgmsg = new Discord.MessageEmbed()
          .setTitle(`LOOKING FOR ${infores[0].gamemode}`)
          .setColor("RANDOM")
          .setDescription(infores[0].message)
          .setTimestamp(infores[0].date)
          .setFooter(ee.footertext)
          .setThumbnail(oldEmbed.thumbnail.url)
          .addFields(
            {name: `Summoner`, value: `${oldEmbed.fields[3].value}`, inline: true},
            {name: `Discord username`, value: `${infores[0].user_name}`, inline: true}
          )

        //SENDING TO ALL CHANNELS!
        con.query(`SELECT * FROM lfg_channels`, function(err, res){
          for (i = 0; i < res.length; i++){
            let lfgChannel = client.channels.cache.get(res[i].channel)
            lfgChannel.send({embeds: [lfgmsg]});
          }
        })
      })
    }
    if(interaction.customId == 'lfg-deny'){
      let msgUser = interaction.message.embeds[0].footer.text;
      let oldEmbed = interaction.message.embeds[0];
      oldEmbed.setFooter(`HANDLED BY ${interaction.member.user.tag}`).setColor("RED").setTitle(`LFG REVIEW DENIED!`)
      con.query(`DELETE FROM lfg_messages WHERE user_id='${msgUser}' AND queue_message='${interaction.message.id}'`);
      interaction.message.edit({embeds: [oldEmbed], components: []});
      interaction.reply({content: `${emojis.no} You have **denied** LFG request successfully!`, ephemeral: true})
    }
  }*/
}
