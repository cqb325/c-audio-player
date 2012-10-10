/**
 * 
 */

var Song = function(url, lrc, albumimg, context){
	this.url = url;
	this.lrc = lrc;
	this.albumimg = albumimg;
	this.context = context;
}

Song.prototype = {
	buffer: null,
	duration: null,
	load: function(callback){
		var request = new XMLHttpRequest();
		var audio = this;
		request.open("GET", this.url, true);
		request.responseType = "arraybuffer";
		request.onload = function() {
			audio.context.decodeAudioData(
				request.response,
				function(buffer) {
					audio.buffer = buffer;
					if(buffer.duration){
						audio.duration = buffer.duration;
					}
					if (callback) callback(buffer);
				}
			);
		}

		request.send();
	}
}