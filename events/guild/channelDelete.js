const con = require("../../db.js");

module.exports = async (client, deletedChannel) => {
    if(deletedChannel.type === 'GUILD_VOICE'){
        con.query(`SELECT * FROM seraphine_hub_channels WHERE guild='${deletedChannel.guild.id}' AND channel='${deletedChannel.id}'`, function (er, re){
            if(re.length > 0){
                con.query(`DELETE FROM seraphine_hub_channels WHERE guild='${deletedChannel.guild.id}' AND channel='${deletedChannel.id}'`)
            }
        })
    }
}