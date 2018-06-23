const config = require("../config.json");
const Snoowrap = require("snoowrap");
const reddit = new Snoowrap({
	userAgent: config.snoo_useragent, // unique string identifying the app
	clientId: config.snoo_clientid,
	clientSecret: config.snoo_clientsecret,
	username: config.snoo_username,
	password: config.snoo_password
});
const topPostCount = 8;
const Discord = require("discord.js");

exports.run = (client, message, command, args) => {
	reddit.getHot("im14andthisisdeep").map(post => post.url).then(post => {
		let randIdx;
		do {
			randIdx = Math.floor(Math.random() * topPostCount) + 1;
		} while (post[randIdx].split(".").pop()!=="jpg" && post[randIdx].split(".").pop()!=="png")
		const embed = new Discord.RichEmbed()
			.setImage(post[randIdx]);
		message.channel.send({embed});
	});
};

exports.help = {
	name: "thenking",
	description: "Posts a random hot submission from r/im14andthisisdeep.",
	usage: "!<:thenking:298165178955071489>"
}