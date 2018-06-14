const Discord = require("discord.js");
const bot = new Discord.Client();
const config = require("./config.json");
const malApi = require('mal-api');

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


  let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  console.log(args); //prints all of the data collected
  let command = args.shift().toLowerCase();
  if(command === 'ping') { //just a test case
    message.channel.send('pong');
  }

})

bot.on("message", (message, reaction) =>{

});

bot.on('messageReaction', (message, user)) => {
  let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  console.log(args); //prints all of the data collected
  let command = args.shift().toLowerCase();
  if(command === 'react') {
    message.channel.send(`${message.author.username}, how are you feeling`)
    .then(function (message)) {
      message.react(thumbsUp);
      message.react(thumbsDown);
    }).catch(function() {
      console.log("REACTION ERROR");
    });
  }
}

function getRandomInt(min, max) { //gets a random number between min and max
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}



bot.login(config.token);
