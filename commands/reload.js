exports.run = async (client, message, args) => {
	let unloadResponse = await client.unloadCommands();
	if (unloadResponse) console.error(unloadResponse);

	let loadResponse = await client.loadCommands();
	if (loadResponse) console.error(loadResponse);

	if (!unloadResponse && !loadResponse) {
		message.channel.send("Reload successfull!");
	} else {
		message.channel.send("Reload failed")
	}
};

exports.help = {
	name: "reload",
	description: "Reloads all commands",
	usage: "!reload"
}