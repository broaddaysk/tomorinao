const Discord = require("discord.js");
const giphy = require("giphy-api")();

exports.run = (client, message, args) => {
	giphy.random("bird", (err, res) => {
        if (err) {
            message.channel.sendMessage("Giphy error.");
            console.log(err);
        }
        else {
			const embed = new Discord.RichEmbed()
				.setImage(res.data.image_url);
			message.channel.send({embed});
        }
	});
};

exports.help = {
    name: "birb.js",
    description: "Displays a random GIPHY bird gif.",
    usage: "!birb"
}