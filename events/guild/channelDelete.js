const con = require("../../db.js");

module.exports = async (client, deletedChannel) => {
    if(deletedChannel.type === 'GUILD_VOICE'){
        con.query(`SELECT * FROM seraphine_hub_channels WHERE guild='${deletedChannel.guild.id}' AND channel='${deletedChannel.id}'`, function (er, re){
            if(re.length > 0){
                con.query(`DELETE FROM seraphine_hub_channels WHERE guild='${deletedChannel.guild.id}' AND channel='${deletedChannel.id}'`)
            }
        })
        con.query(`SELECT * FROM seraphine_channels WHERE guild='${deletedChannel.guild.id}' AND channel='${deletedChannel.id}'`, function (er, re2){
            if(re2.length > 0){
                if(re2[0].text_channel != null){
                    let txtChannel = deletedChannel.guild.channels.cache.get(re2[0].text_channel);
                    if(txtChannel){
                        txtChannel.delete().catch(err => console.log(err));
                    }
                }
                con.query(`DELETE FROM seraphine_channels WHERE guild='${deletedChannel.guild.id}' AND channel='${deletedChannel.id}'`)
            }
        });
    }
}