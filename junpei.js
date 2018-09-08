const Discord = require("discord.js");
const bot = new Discord.Client();
const config = require("./config.json");

bot.on('ready', function() {
  bot.user.setUsername("Junpei");
  bot.user.setPresence({game: {name: 'Nonary Game', type: 0}});
});

const thumbsUp = '👍';
const thumbsDown = '👎';
const react_options = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

bot.on("ready", () => {
  console.log('Bot is ready!');
});

bot.on("message", (message) => {
  if(message.author.bot) return; //if the user who wrote the command is a bot, ignore it
  if(message.content.indexOf(config.prefix) !== 0) return; //doesn't start with an !, therefore not a command

  let args = message.content.slice(config.prefix.length).trim().split(/ +/g); //collects all of the user inputted data (except for the first character)
  console.log(args); //prints all of the data collected
  let command = args.shift().toLowerCase(); //command is the first argument

  //TEST COMMANDS
  if(command === 'ping') { //just a test case
    message.channel.send('pong');
  }

  //REACTION POLL COMMANDS
  if(command === 'react') { //takes in the user's question followed by a question
                            //ie. !react how was your day?
    var words = "";

    while(args && args.length) { //runs as long as the array 'args' is not empty
      words = words + args.shift() + " ";
    }

    const embed = new Discord.RichEmbed() //creating a Rich Embed
      .setTitle(`${message.author.username}'s Poll`)
      .setImage(`${message.author.displayAvatarURL}`)
      .setDescription(words);

    message.channel.send({embed}) //sending the embed as a message,
    .then(function (message) { //and reacting to the Rich Embed for the Poll
      message.react(thumbsUp);
      message.react(thumbsDown);
    }).catch(function() { //error check
      console.error;
    });
  }

  else if(command === 'poll') { //format for creating a POLL
    //!poll time option_a option_b option_c ...
    //let poll_time = args.shift();
    let num_options = args.length;
    let poll_options = [];
    for(let i = 0; i < num_options; i++) {
      let option = args.shift();
      let option_arr = option.split("_");
      option = ""; //clearing option
      for(let j = 0; j < option_arr.length-1; j++) {
        option = option + option_arr[j]; //adding elements to the array
      }
      poll_options.push(option);
    }

      const embed = new Discord.RichEmbed() //creating a Rich Embed
        .setTitle(`${message.author.username}'s Poll`)
        .setDescription(poll_options);

      message.channel.send({embed}) //sending the embed as a message,
      .then(function (message) { //and reacting to the Rich Embed for the Poll
        for(let k = 0; k < num_options; k++) {
          message.react(thumbsUp);
        }
      }).catch(function() { //error check
        console.error;
      });

    }

  //SERVER COMMANDS
  if(command === 'newrole') { //format is !createRole <name> <color>
    let roleColor = args.shift();
    let roleName = args.shift();
    while(args && args.length) { //since the role's name can be multiple words, I'm adding everything after this to it
      roleName = roleName + args.shift();
    }
    message.guild.createRole({
      name : roleName.toString(),
      color : roleColor.toString().toUpperCase(),
    })
    .then(console.log("new role created:" + roleName))
    .catch(console.error);
  }

 //CHANNEL COMMANDS
  if(command === 'newchannel') { //Format is !newchannel <channel_type> <channel_name>
      let server = message.guild;
      let type = args.shift(); //type of channel is either text or voice
      let name = args.shift(); //name of new channel
      server.createChannel(name, type);
      console.log("new "+type+" channel \'"+name+"\' created.");
  }

  else if(command === 'delchannel') {
    message.channel.delete() //deletes the channel where the command was sent
    .then(console.log('Deleted channel'))
    .catch(console.error);
  }


  //SASANK'S OTHER USELESS COMMANDS
  if(command === 'sigh') {
    message.channel.send("You guys are hopeless. I'm with "+message.author.username+" on this one.");
  }
  else if(command === 'timestamp') {
    const embed = new Discord.RichEmbed()
    .setTitle("What's the time Mr. Fox?");
    message.channel.send(embed);
    message.channel.send("The time is "+embed.timestamp);
  }
  else if(command === 'temp'){
    console.log("temporary command");
  }


})

function getRandomInt(min, max) { //gets a random number between min and max
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


bot.login(config.token);
