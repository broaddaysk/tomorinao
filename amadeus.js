const Discord = require("discord.js");
const bot = new Discord.Client();
const config = require("./config.json");

bot.on('ready', function() {
  bot.user.setUsername("Amadeus-ß");
});

const thumbsUp = '👍';
const thumbsDown = '👎';



bot.on("ready", () => {
  console.log('Bot is ready!');
});

bot.on("message", (message) => {
  if(message.author.bot) return; //if the user who wrote the command is a bot, ignore it
  if(message.content.indexOf(config.prefix) !== 0) return; //doesn't start with an !, therefore not a command

  let args = message.content.slice(config.prefix.length).trim().split(/ +/g); //collects all of the user inputted data (except for the first character)
  console.log(args); //prints all of the data collected
  let command = args.shift().toLowerCase(); //command is the first argument

  if(command === 'ping') { //just a test case
    message.channel.send('pong');
  }

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

  if(command === 'newchannel') { //Format is !newchannel <channel_type> <channel_name>
      let server = message.guild;
      let type = args.shift(); //type of channel is either text or voice
      let name = args.shift(); //name of new channel
      server.createChannel(name, type);
      console.log("new "+type+" channel \'"+name+"\' created.");
  }

  if(command === 'delchannel') {
    message.channel.delete() //deletes the channel where the command was sent
    .then(console.log('Deleted a channel'))
    .catch(console.error);
  }

})

function getRandomInt(min, max) { //gets a random number between min and max
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


bot.login(config.token);
