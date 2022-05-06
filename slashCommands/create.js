const { MessageEmbed, Message, ClientVoiceManager } = require("discord.js");
const config = require("../botconfig/config.json");
const emb = require("../botconfig/embed.json");
const settings = require("../botconfig/settings.json");
const IC = require('../botconfig/internalChannels.json');
const emojis = require('../botconfig/emojis.json');
const con = require("../db.js");
module.exports = {
  name: "create", //the command name for the Slash Command
  description: "Create new voice HUB channel", //the command description for Slash Command Overview
  cooldown: 1,
  memberpermissions: ['MANAGE_CHANNELS'], //Only allow members with specific Permissions to execute a Commmand [OPTIONAL]
  requiredroles: [], //Only allow specific Users with a Role to execute a Command [OPTIONAL]
  alloweduserids: [], //Only allow specific Users to execute a Command [OPTIONAL]
  options: [ //OPTIONAL OPTIONS, make the array empty / dont add this option if you don't need options!	
		{"String": {name: "channel_name", description: "What should the channel be called when it is created? {USER} will be replaced with users name", required: true}},
		{"Integer": {name: "user_limit", description: "How many users should be allowed to join created channel? If unlimited set to 0", required: true}},
		{"StringChoices": {name: "text_channel", description: "Should text channel be created and linked with voice channel?", required: true, choices: [["yes", "yes"], ["no", "no"]]}}
	//INFORMATIONS! You can add Options, but mind that the NAME MUST BE LOWERCASED! AND NO SPACES!!!, for the CHOCIES you need to add a array of arrays; [ ["",""] , ["",""] ] 
		//{"Integer": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getInteger("ping_amount")
		//{"String": { name: "ping_amount", description: "How many times do you want to ping?", required: true }}, //to use in the code: interacton.getString("ping_amount")
		//{"User": { name: "ping_a_user", description: "To Ping a user lol", required: false }}, //to use in the code: interacton.getUser("ping_a_user")
		//{"Channel": { name: "what_channel", description: "To Ping a Channel lol", required: false }}, //to use in the code: interacton.getChannel("what_channel")
		//{"Role": { name: "what_role", description: "To Ping a Role lol", required: false }}, //to use in the code: interacton.getRole("what_role")
		//{"IntChoices": { name: "type", description: "What Ping do you want to get?", required: true, choices: [["Bot", 1], ["Discord Api", 2]] }, //here the second array input MUST BE A NUMBER // TO USE IN THE CODE: interacton.getInteger("type")
		//{"StringChoices": { name: "type", description: "What Ping do you want to get?", required: true, choices: [["Bot", "botping"], ["API", "api"]] }}, //here the second array input MUST BE A STRING // TO USE IN THE CODE: interacton.getString("type")
  ],
  run: async (client, interaction) => {
    try{
	    //console.log(interaction, StringOption)
		
		//things u can directly access in an interaction!
		const { member, channelId, guildId, applicationId, 
		        commandName, deferred, replied, ephemeral, 
				options, id, createdTimestamp 
		} = interaction; 
		const { guild } = member;

		let channelName = options.getString("channel_name");
		let channelLimit = options.getInteger("user_limit");
		let textChannel = options.getString("text_channel") == "yes" ? 1 : 0;
		let logchannel;

		if(channelLimit > 99) channelLimit = 99;
		if(channelLimit < 0) channelLimit = 0;

		function premiumCheck(){
			con.query(`SELECT * FROM seraphine_hub_channels WHERE guild='${guild.id}'`, function(errCheck, resCheck){
				if(resCheck.length >= 4){
					const nopremium = new MessageEmbed()
					.setTitle(`PREMIUM REQUIRED`)
					.setDescription(`It would seem like you have already ${resCheck.length} hub channels, and this is maximum amount of hubs you can create with free Seraphine. Please consider buying premium in order to create **limitless** amount of hub channels!`)
					.setTimestamp()
					.setFooter({text: emb.footertext, iconURL: client.user.displayAvatarURL()});
		
					return interaction.reply({embeds: [nopremium], ephemeral: true});
				} else {
					createChannels()
				}
			})
		}

		if(guild.me.permissions.has("MANAGE_CHANNELS")){
			con.query(`SELECT * FROM seraphine_guilds WHERE guild='${guild.id}'`, function(err, res){
				if(res.length === 0){
					premiumCheck()
					guild.channels.create('voicelog', {
						type: 'GUILD_TEXT',
						parent: interaction.channel.parent
					}).then(ch => {
						logchannel = ch.id;
						con.query(`INSERT INTO seraphine_guilds VALUES ('${guild.id}', '${ch.id}')`)
						const dbupdate = new MessageEmbed()
						.setTitle(`SERAPHINE GUILD UPDATE`)
						.setThumbnail(guild.iconURL())
						.setTimestamp()
						.addFields(
							{name: `GUILD`, value: `${guild.name}\n\`${guild.id}\``},
							{name: `CHANNEL`, value: `${ch.name}\n\`${ch.id}\``}
						);
						client.channels.cache.get(IC.database).send({embeds: [dbupdate]});
						createChannels();
					})
				} else {
					logchannel = res[0].logchannel;
					if(!res[0].premium){
						premiumCheck();
					}
				}
			})
		}
		function createChannels(){
			guild.channels.create('Join To Create Channel', {
				type: 'GUILD_VOICE',
				parent: interaction.channel.parent
			}).then(vch => {
				con.query(`INSERT INTO seraphine_hub_channels (guild, channel, name, userlimit, text) VALUES ('${guild.id}', '${vch.id}', "${channelName}", '${channelLimit}', '${textChannel}')`, function (insertErr, insertRes, fields){
					const hubcreated = new MessageEmbed()
					.setTitle(`NEW HUB CHANNEL CREATED`)
					.setTimestamp()
					.setThumbnail(member.displayAvatarURL())
					.addFields(
						{name: `Created by`, value: `${member}\n\`${member.id}\``},
						{name: `Channel`, value: `${vch}`, inline:true},
						{name: `User limit`, value: `${channelLimit}`, inline: true},
						{name: `Text channel`, value: `${options.getString("text_channel").toUpperCase()}`, inline:true}
					)
					.setFooter({text: `HUB ID: ${insertRes.insertId}`, iconURL: client.user.displayAvatarURL()})
					try {
						if(guild.channels.cache.find(c => c.id === logchannel)){
							client.channels.cache.get(logchannel).send({embeds: [hubcreated]});
						} else {
							guild.channels.create('voicelog', {
								type: 'GUILD_TEXT',
								parent: interaction.channel.parent
							}).then(newch => {
								newch.send({embeds: [hubcreated]});
								con.query(`UPDATE seraphine_guilds SET logchannel='${newch.id}'`)
								const dbupdate = new MessageEmbed()
								.setTitle(`SERAPHINE GUILD UPDATE`)
								.setThumbnail(guild.iconURL())
								.setTimestamp()
								.addFields(
									{name: `GUILD`, value: `${guild.name}\n\`${guild.id}\``},
									{name: `CHANNEL`, value: `${ch.name}\n\`${ch.id}\``}
								);
								client.channels.cache.get(IC.database).send({embeds: [dbupdate]});
							})
						}
					} catch(e){
						console.log(String(e.stack).bgRed)
					}
					interaction.reply({embeds: [hubcreated], ephemeral: true});
				});
			})
		}
  	} catch (e) {
        console.log(String(e.stack).bgRed)
    }
}
}