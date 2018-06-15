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

  let args = message.content.slice(config.prefix.length).trim().split(/ +/g); //collects all of the data
  console.log(args); //prints all of the data collected
  let command = args.shift().toLowerCase();
  if(command === 'ping') { //just a test case
    message.channel.send('pong');
  }
  if(command === 'react') { //takes in the user's question followed by a question
                            //ie. !react how was your day?

    var words = "";
    //ERROR: doesn't get arguments
    for(var i = 1; i < (args.length-2); i++) { //everything after the command becomes the question
      words.concat(args[i]);
      words.concat(" ");
    }
    console.log(`words = ${words}`); //TEST: delete after bug is fixed

    const embed = new Discord.RichEmbed() //creating a Rich Embed
      .setTitle(`${message.author.username}'s Poll`)
      .setImage(`${message.author.displayAvatarURL}`)
      .setDescription({words});

    message.channel.send({embed}) //sending the embed as a message,
    .then(function (message) { //and reacting to the Rich Embed for the Poll
      message.react(thumbsUp);
      message.react(thumbsDown);
    }).catch(function() { //error
      console.log("REACTION ERROR");
    });
  }
})

function getRandomInt(min, max) { //gets a random number between min and max
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


bot.login(config.token);
