const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require('fs');
const path = require("path");
let config = JSON.parse(fs.readFileSync(path.resolve(__dirname + "/../tokens.json"), 'utf-8'));


let queue = []
let isPlaying = false;

let voiceChannel = null;
let dispatcher = null;
let isPausedLocal = false;

exports.run = (client, message, args) => {

	client.logger = require("../modules/Logger");

	const addToQueue = (strID) => {
		queue.push(strID);
	}

	const playMusic = (id, message) => {
		// voiceChannel = message.member.voiceChannel;
		voiceChannel = client.channels.get('521241596914565131');
		queueDispUpdate();

		console.log("vc type", typeof(voiceChannel));
		// console.log(voiceChannel);

			voiceChannel.join().then(function (connection) {
				console.log("idddddddddd", id)
				client.logger.debug("id type" +  typeof(id))
				console.log('video url', "https://www.youtube.com/watch?v="+id);

				let completeUrl = "https://www.youtube.com/watch?v=" + id;
				stream = ytdl(completeUrl, {
					filter: "audioonly"
					// quality: 92
				});

				dispatcher = connection.playStream(stream);
				dispatcher.setVolume(client.volume/10);
				dispatcher.on('end', () => {
					// console.log("queue", queue);
					queue.shift();
					// console.log("queue after", queue);
					queueDispUpdate()
					if (queue.length === 0) {
						queue = [];
						isPlaying = false;
						console.log('buh bye');
					} else {
						console.log(queue);
						console.log('else of disp.end');
						playMusic(queue[0], message)
					}
				});
			});
	}

	const getId = (str, cb) => {
		searchVideo(str, function(id) {
			cb(id);
		});
	}

	//youtube-api
	const searchVideo = (query, callback) => {
		request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + config.yKey.toString(), function(error, response, body) {
			let json = JSON.parse(body);
			console.log(json.items[0].id)
			callback(json.items[0].id.videoId);
		})
	}

	// Update the stats embed
    const queueDispUpdate = async () => {
        const chan = client.channels.get("521239909504253952");
        let stats;

        await chan.fetchMessages({ around: "522871508314357781", limit: 1 })
            .then(messages => {
                const fetchedMsg = messages.first(); // messages is a collection!)

                // do something with it
                const newEmbed = new Discord.RichEmbed()
                    .setTitle("zeroBot Controller")
                    .setDescription(``)
                    .addField(`🎵`, "Pause/Resume Volume", true)
                    .addField(`👻`, "Skip Current Song", true)
                    .addField(`🔉`, "Volume -2", true)
					.addField(`🔊`, "Volume +2", true)
                    .addBlankField()
					.addField(`:loudspeaker: Current Volume:`, `${(client.volume/12)*100}%`, true)
                    .addField(" :musical_note: Songs Queue :musical_note: ", "=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-")

                queue.forEach(rs => {

                    newEmbed.addField(rs[0], `[Songs Queue](${rs[1]})`, true)
                });

                fetchedMsg.edit(newEmbed);


            });
    }

/////////////////////////////////////////////////controls//////////////////////////////////////////////////////////
	if (client.isSkipped) {
		client.isSkipped = false;
		dispatcher.end();
		if (queue.length > 1) {
			console.log('hola');
		} else {
			queue = [];
		}
		return
	}

	if (client.trigger && isPlaying) {
		// ALWAYS PUT VOLUME CONTROLS AT THE BOTTOM OF ELSE-IF
		if (isPausedLocal && client.isPaused) {
			isPausedLocal = false;
			dispatcher.resume();
		} else if (!isPausedLocal && client.isPaused) {
			isPausedLocal = true;
			dispatcher.pause();
		} else if (client.volControl && client.volume<12) {
			client.volume+=2;
			console.log(client.volume);
		} else if (!client.volControl && client.volume>0) {
			client.volume-=2;
			console.log(client.volume);
		}
		queueDispUpdate();
		dispatcher.setVolume(client.volume/10);
		client.trigger = false;
	}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	console.log('hi')

	if (!args[0]) {
		sendMenu(client, message)
		return
	}
    if (args[0] === "leave") {
		if (isPlaying) {
			isPlaying = false;
			queue = [];
			message.channel.send("**DJ {zeroBot}** Signing Off :microphone:");
			message.member.voiceChannel.leave();
		}else {
			message.channel.send(":thinking: i'm not in the voice Channel");
		}
		return
	}

	if (args[0] === "play" && args.length>1) {
		if(!message.member.voiceChannel) return message.reply(":cry: :cry: no one's listening to my music. \n join the voice channel first");
		console.log('music');
		args.shift();
	    args = args.join(" ");
		if (queue.length>0 || isPlaying) {
			getId(args, function(id) {
				addToQueue(id);
				message.reply("added to queue: **"+id+"**");
			});
		} else {
			isPlaying = true;
			getId(args, function(id) {
				queue.push("placeholder");
				playMusic(id, message);
				message.reply(`:musical_note: :musical_note: <${args}> :musical_note: :musical_note:`);
				message.reply("now playing: **"+id+"**");
			})
		}
	} else if (args[0] === "play") {
		console.log('playing -> I ♥ RADIO');
		isPlaying = true;
		voiceChannel = message.member.voiceChannel;

			voiceChannel.join().then(function (connection) {

				stream = "http://stream01.iloveradio.de/iloveradio1.mp3"

				let dispatcher = connection.playStream(stream);

			});
	}

	if (args[0] === "radio") {
	    console.log('playing -> I ♥ MASHUP');
	    isPlaying = true;
	    voiceChannel = message.member.voiceChannel;

	        voiceChannel.join().then(function (connection) {

	            stream = "http://stream01.iloveradio.de/iloveradio5.mp3"

	            let dispatcher = connection.playStream(stream);

	        });
	}

};

const sendMenu = (client, message) => {
    let adventMenu = new Discord.RichEmbed()
        // changing setAuthor to setTitle below
        .setTitle("zeroBot Display")
        .setThumbnail("http://icons.iconarchive.com/icons/stevelianardo/free-christmas-flat/256/christmas-tree-icon.png")
        .setColor("B3000C")
        .setDescription("Settings and queue display")
        .addField(":loudspeaker: Current Volume: ", `${(client.volume/12)*100}%`, true)
        .addBlankField()
    message.channel.send({ embed: adventMenu });
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [],
	permLevel: "User"
};

exports.help = {
	name: 'play'
};
