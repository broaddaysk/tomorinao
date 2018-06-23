exports.run = (client, message, command, args) => {
	const iCount = command.length - 2;
	if (iCount > 43) {
		message.channel.send("snek 2 long");
	} else {
		let snekStr = "<:miia1:297947746969583617>";
		for (var i=0; i<iCount; i++) {
			snekStr += "<:miia2:297947755987337216>";
		}
		snekStr += "<:miia3:297947762463473675>" + "<:miia4:297947768973033475>";
		message.channel.send(snekStr);
	}
};

exports.isAliasValid = (command) => {
	const isMiia = new RegExp('^mi{2,}a$');
	if (isMiia.test(command)) {
		return true;
	}
	return false;
}

exports.help = {
	name: "miia",
	description: "Displays a specified length of everyone's favorite lamia.",
	usage: "+m[between 2 and 43 i's]a"
}
