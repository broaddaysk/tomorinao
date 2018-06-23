//version check
if (process.version.slice(1).split(".")[0] < 9) {
	console.error("Node.js 9.0.0 or higher required.");
	process.exit(1);
}

const config = require("./config.json");

const Discord = require("discord.js");
const client = new Discord.Client();

/*
const Snoowrap = require("snoowrap");
const reddit = new Snoowrap({
	userAgent: config.snoo_useragent, // unique string identifying the app
	clientId: config.snoo_clientid,
	clientSecret: config.snoo_clientsecret,
	username: config.snoo_username,
	password: config.snoo_password
});
*/

const PlugAPI = require("plugapi");
const botPlug = new PlugAPI({email: config.plug_email, password: config.plug_password});
const botPlugUserName = config.plug_username;
const plugRoom = config.plug_room;

const ytdl = require("ytdl-core");
//const giphy = require("giphy-api")();
const getVideoId = require("get-video-id");
//const isLetterRegExp = new RegExp("^[a-zA-Z]$");
//const topPostCount = 8;

//const fs = require("fs");
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");

var currentChannel = undefined;     // Discord channel where the bot will broadcast plug.dj-related messages
var currentPlugData = undefined;    // Plug.dj data for the currently playing song. Also contains DJ info and last song played.
var firstSongID = 0;        // ID of the first song played. Used to place songs before it when building a playlist while listening to it.
var reconnecting = false; // Flag to show if you should send a message once we've reconnected.

client.aliasMap = new Enmap(); //map that stores command names as keys and their alias functions as vals
client.commandMap = new Enmap(); //map that stores command names as keys and their respective modules as vals

//loads all commands from ./commands/
//returns error string if error encountered, false otherwise
client.loadCommands = async () => {
	//get list of command modules
	const commandFiles = await readdir("./commands/");
	console.log(`Loading a total of ${commandFiles.length} command(s)`);
	let numErrors = 0;

	//fill client.aliasMap and client.commandMap
	commandFiles.forEach(commandFilename => {
		if (!commandFilename.endsWith(".js")) return;
	    try {
			const props = require(`./commands/${commandFilename}`); //load module
			console.log(`Loading Command: ${commandFilename}`);
			const command = commandFilename.slice(0,commandFilename.length-3);
			
			//fill client.aliasMap if it is a variable command
			if (props.isAliasValid) {
				client.aliasMap.set(command, props.isAliasValid);
			}
			client.commandMap.set(command, props);
		} catch (err) {
			console.error(`Unable to load command ${command}: ${err}`);
			numErrors++;
		}
	});
	if (numErrors > 0) {
		return "loadCommands failed";
	}
	return false;
};

//unload all commands from ./commands/
//returns error string if error encountered, false otherwise
client.unloadCommands = async () => {
	let numErrors = 0;

	//remove each loaded module from cache
	client.commandMap.keyArray().forEach(command => {
		try {
			delete require.cache[require.resolve(`./commands/${command}.js`)];
		} catch (err) {
			console.error(`Unable to unload command ${command}: ${err}`);
			numErrors++;
		}
	});

	//clear client.aliasMap
	if (client.aliasMap.keyArray().length > 0) {
		try {
			client.aliasMap.deleteAll();
			console.log("Succesfully cleared aliasMap");
		} catch (err) {
			console.error(`Unable to clear client.aliasMap: ${err}`);
			numErrors++;
		}
	}

	//clear client.commandMap
	if (client.commandMap.keyArray().length > 0) {
		try {
			client.commandMap.deleteAll();
			console.log("Successfully cleared commandMap");
		} catch (err) {
			console.error(`Unable to clear client.commandMap: ${err}`);
			numErrors++;
		}
	}
	if (numErrors > 0) {
		return `Unable to unload commands: ${err}`;
	}
	return false;
};

//Discord/Plug.dj bot initialization
const init = async () => {
	//check user-specified prefix lengths
	if (config.discord_regcmd_prefix.length !== 1 || config.discord_varcmd_prefix.length !== 1) {
		console.error("Command prefixes in config required to be single character");
		process.exit(1);
	}

	//load commands
	const response = await client.loadCommands();
	if (response) console.error(response);

	//initialize Discord/Plug.dj bots
	client.login(config.discord_token);
	botPlug.connect(plugRoom);
};

init();

//Discord initialization confirmation
client.on("ready", () => {
	console.log("Joined Discord server!");
});

//Plug.dj (re-)initialization confirmation
botPlug.on('roomJoin', (room) => {
    console.log(`Joined ${room} on Plug.dj!`);
    if (reconnecting) {
        currentChannel.sendMessage(`Reconnected and joined ${room}`);
        reconnecting = false;
    }
});

/*
botPlug.on('advance', function (data) {
    console.log(data);
    if (data && data.media) {
        var currentlyPlaying = "";
        if (data.currentDJ.username == botPlugUserName) {
            currentlyPlaying = "Playing: ";
            client.user.setPresence({game: {name: data.media.author + " - " + data.media.title, type: 0}});
            //console.log("Setting playing title.");
        }
        else {
            currentlyPlaying = data.currentDJ.username + " is playing: ";
           	client.user.setPresence({game: {name: data.currentDJ.username + ": " + data.media.author + " - " + data.media.title, type: 0}});
            //console.log("Setting status online.");
        }
    }
    currentPlugData = data;
});
*/

//Discord message handler
client.on("message", (message) => {
	const regcmd_prefix = config.discord_regcmd_prefix;
	const varcmd_prefix = config.discord_varcmd_prefix;

	//split raw message into command and args
	if (!(message.content.trim().startsWith(regcmd_prefix) || message.content.trim().startsWith(varcmd_prefix)) || message.author.bot) return;
	const args = message.content.slice(1).trim().split(/ +/g);
	const alias = args.shift().toLowerCase();

	//convert variable command alias to its corresponding command name
	let command;
	if (message.content.trim().startsWith(varcmd_prefix)) {
		let commandArr;
		try {
			//create array of command names for aliases that pass their respective validity checks, using client.aliasMap
			commandArr = client.aliasMap.keyArray().filter((key) => {
				const isAliasValid = client.aliasMap.get(key);
				return isAliasValid(alias);
			});
		} catch (err) {
			console.error("Unable to filter keys in client.aliasMap");
		}

		if (commandArr.length === 0) {
			message.channel.send("Invalid command!"); //call help function, which will use reaction UI********************************************
			return;
		} else if (commandArr.length > 1) {
			console.error("Alias resolves to multiple commands");
			return;
		} else {
			command = commandArr.shift();
		}
	} else {
		command = alias;
	}

	//run loaded commands from client.commandMap
	const commandFile = client.commandMap.get(command);
	if (!commandFile) {
		message.channel.send("Invalid command!"); //call help function, which will use reaction UI*******************************************************
	} else {
		try {
			commandFile.run(client, message, alias, args); //alias is passed because each command already stores its primary name
		} catch (err) {
			console.error(`Unable to run command ${command}: ${err}`);
		}
	}
});



	/*
	if (cmd === "set") {
		var data;
		for(var i=0; i<args.length; i++) {
			data += args[i] + " ";
		}
		var writeStream = fs.createWriteStream("test.txt");
		writeStream.write(data,"ascii");
		writeStream.end();
		writeStream.on("finish", function() {
			message.channel.send("message recorded!");
		});
		writeStream.on("error", function(err) {
			console.log(err.stack);
		});
	}
	if (cmd === "get") {
		var data = "";
		var readStream = fs.createReadStream("test.txt");
		readStream.setEncoding("ascii");
		readStream.on("data", function(chunk) {
			data += chunk.toString();
		});
		readStream.on("end", function() {
			message.channel.send(data);
		});
		readStream.on("error", function(err) {
			console.log(err.stack);
		});
	}

});
*/




/*
	//use modular command handler from displug, separate commands into their own files
	if (cmd === "plug") {
		message.channel.send("open https://plug.dj/" + plugRoom + " in a separate tab");
	}
	if (cmd === "skip") {
		botPlug.selfSkip();
		message.channel.send("skipped");
	}
	if (cmd === "users") {
		const roomUsers = botPlug.getUsers();
		var msg = "";
		for (const user of roomUsers) {
			msg += "\n" + user.username;
		}
		message.channel.send(msg);
	}
	if (cmd === "reconnect") {
		botPlug.close();
		message.channel.send("reconnecting");
		setTimeout(connectPlug, 1000);
		reconnecting = true;
		currentChannel = message.channel;
	}
	if (cmd === "play") {
*/
/*
		var roomMeta = botPlug.getRoomMeta();
        //console.log("Room meta: \n", roomMeta);
        if (roomMeta.population <= 1) {
            message.channel.send("All alone in the plug.dj room, not playing music for myself.");
            return;
		}
*/

/*
		botPlug.getActivePlaylist((playlist) => {
            if (playlist) {
                console.log('Found active playlist: ' + playlist.name + ', # of tracks: ' + playlist.count);
                if (playlist.count > 0) {
                    botPlug.joinBooth();
                    //message.channel.sendMessage('Starting music...');
                }
                else {
                    message.channel.sendMessage('Active playlist is empty.');
                }
            }
            else {
                message.channel.sendMessage('No active playlist.');
            }
		});
	}
	if (cmd === "createplaylist") {
		var string = "";
		for (var arg of args) {
			string += arg + " ";
		}
		string = string.slice(0, -1);

        botPlug.createPlaylist(string, (err, data) => {
            if (err) {
                console.log(err);
                message.channel.send('Error creating playlist.');
            }
            else {
                message.channel.send('Playlist **' + string + '** created.');
            }
		});
	}
	if (cmd === "deleteplaylist") {
		var string = "";
		for (var arg of args) {
			string += arg + " ";
		}
		string = string.slice(0, -1);

		botPlug.getPlaylists((playlists) => {
            var found = false;
            for (var i = 0; i < playlists.length; i++) {
                if(playlists[i].name.toLowerCase() == string.toLowerCase()) {
                    var playlistName = playlists[i].name;
                    botPlug.deletePlaylist(playlists[i].id, (err, data) => {
                        if (err) {
                            console.log(err);
                            message.channel.send('Error deleting playlist.');
                        }
                        else {
                            message.channel.send("Playlist **" + playlistName + "** deleted.");
                        }
                    });
                    found = true;
                    break;
                }
            }
            if(!found)
                message.channel.send("Unable to find playlist named **" + string + "**.");
		});
	}
	if (cmd === "showplaylists") {
	    botPlug.getPlaylists((playlists) => {
            var response = "Available playlists:";
            console.log('Num playlists: ' + playlists.length);
            for (var i = 0; i < playlists.length; i++) {
                console.log(playlists[i].name);
                response += "\n**" + playlists[i].name + "** (" + playlists[i].count + " songs)";
                if (playlists[i].active) {
                    response += " **(Active)**";
                }
            }
            message.channel.send(response);
		});
	}
	if (cmd === "pickplaylist") {
		var string = "";
		for (var arg of args) {
			string += arg + " ";
		}
		string = string.slice(0, -1);

        botPlug.getPlaylists((playlists) => {
            console.log('Num playlists: ' + playlists.length);
            for (var i = 0; i < playlists.length; i++) {
                if (playlists[i].name.toLowerCase() == string.toLowerCase()) {
                    if (playlists[i].count === 0) {
                    	message.channel.send('cannot pick empty playlist, add song first');
                    }
                    else {
                    	botPlug.activatePlaylist(playlists[i].id, (err, data) => {
	                        if (err) {
	                            console.log(err);
	                            message.channel.send('Error activating playlist.');
	                        }
	                        else {
	                            message.channel.send('Playlist **' + playlists[i].name + '** activated.');
	                        }
                    	});
                    	break;
                    }
                }
            }
		});
	}
	if (cmd === "addsong") {
        botPlug.getActivePlaylist((playlist) => {
            if (playlist) {
                //console.log('Found active playlist: ' + playlist.name + ', count: ' + playlist.count + ', ID: ' + playlist.id);
                //console.log('Author: ' + video.author + ', CID: ' + vid + ', Duration: ' + video.lengthSeconds + ', Title: ', video.title);
                //console.log(video.prettyPrint());
                if (playlist.count >= 200) {
                    message.channel.sendMessage("Playlist **" + playlist.name + "** is full.");
                    return;
                }
                //console.log(args[0]);
                ytdl.getInfo(args[0], (err, info) => {
                	var vid = getVideoId(args[0]).id;
                	var options = {
	                    author: info.author.name,
	                    cid: vid,
	                    duration: +info.lengthSeconds || +info.length_seconds,
	                    format: 1,
	                    image: 'https://i.ytimg.com/vi/' + vid + '/default.jpg',
	                    title: info.title
	                };
	                //console.log('addSongToPlaylist options: \n', options);
	                botPlug.addSongToPlaylist(playlist.id, [options], (err, data) => {
	                    if (data) {
	                    	console.log("data");
	                        console.log(data);
	                    }
	                    if (err) {
	                        message.channel.send('Couldn\'t add song, unexpected error.');
	                        console.log(err);
	                    }
	                    else {
	                        message.channel.send('**' + info.title + '** (' + ') added to active playlist **' + playlist.name + '**.\n' + 'https://i.ytimg.com/vi/' + vid + '/default.jpg');
	                        // Plug.dj placed the song as the next song... move it if needed.
	                        // We'll try to place it before the first song that was played this session.
	                        //console.log("next: " + next);
	                    }
	                });
	                
                });
            }
            else {
                message.channel.send('No active playlist.');
            }
        });
	}
	if (cmd === "deletesong") {
		if (currentPlugData) {
	        //console.log(params);
	        if (currentPlugData.media == undefined && params.length == 0) {
	            message.channel.sendMessage("Nothing is currently playing.");
	            return;
	        }

	        if (currentPlugData.currentDJ != undefined && currentPlugData.currentDJ.username != botPlugUserName && params.length == 0) {
	            message.channel.sendMessage("I'm not currently the DJ.");
	            return;
	        }

	        botPlug.getActivePlaylist((playlist) => {
	            if (playlist) {
                    // Skip the song first
                    var songID = currentPlugData.media.id;
                    botPlug.selfSkip(() => {
                        //console.log(songID);
                        botPlug.removeSongFromPlaylist(playlist.id, songID, (err, data) => {
                            if (data) {
                                //console.log(data);
                            }
                            if (err) {
                                message.channel.sendMessage("Unexpected error.");
                                console.log(err);
                            }
                            else {
                                message.channel.sendMessage("Song ID " + songID + " deleted from playlist **" + playlist.name + "**.");
                            }
                        });
                    });
	            }
	            else {
	                message.channel.send('No active playlist.');
	            }
	        });
	    }
	    else {
	        console.log('Couldn\'t find data for command delete.');
		}
	}
	if (cmd === "shuffle") {
		botPlug.getActivePlaylist((playlist) => {
            if (playlist) {
                botPlug.shufflePlaylist(playlist.id, (err, data) => {
                    if (err) {
                        message.channel.sendMessage("Unexpected error.");
                        console.log(err);
                    }
                    else {
                        message.channel.sendMessage("Playlist **" + playlist.name + "** shuffled.");
                    }
                });
            }
            else {
                message.channel.sendMessage('No active playlist.');
            }
		});
	}
	if (cmd === "help") {
		//use commandMap keys
	}
	if (cmd === "stop") {
		botPlug.leaveBooth();
        client.user.setPresence({game: {}});
		message.channel.send("stopped");
	}
*/


