const Discord = require("discord.js");

const probabilityOfUpperCase = 75;

exports.run = (client, message, command, args) => {
	const isLetterRegExp = new RegExp("^[a-zA-Z]$");
	let mockArr = args.map((word) => {
		word.toLowerCase();
		let replacementWord = "";
		let prevLetter = "";
		for (var i=0; i<word.length; i++) {
			if (i > 0) {
				prevLetter = replacementWord[i-1];
			}
			const probability = Math.floor(Math.random() * 100) + 1;
			if (isLetterRegExp.test(word[i]) && prevLetter === prevLetter.toLowerCase() && probability <= probabilityOfUpperCase) {
				replacementWord += word[i].toUpperCase();
			} else {
				replacementWord += word[i];
			}
		}
		return replacementWord;
	});
	const mockStr = mockArr.join(" ");
	const embed = new Discord.RichEmbed()
		.setTitle(mockStr)
		.setImage("https://i.imgur.com/khRpdb2.jpg");
	message.channel.send({embed});
};

exports.help = {
	name: "mockify",
	description: "Convert input string to match Spongebob mocking.",
	usage: "!mockify [string]"
}