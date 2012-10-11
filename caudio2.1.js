/**
 * @author cqb
 */
var CPlayer = function(options){
	this._init(options);
}
CPlayer.prototype = {
	element: null,
	/**
	 * 播放器
	 */
	player: null,
	/**
	 * 播放时间
	 */
	duration: null,
	/**
	 * 当前播放时间
	 */
	currenttime: 0,
	/**
	 * 音频对象
	 */
	audio: null,
	/**
	 * 歌词同步工具
	 */
	clrc: null,
	/**
	 * 上次位置
	 */
	last: null,
	/**
	 * 拖拽最大值
	 */
	max: null,
	
	playlist: null,
	songs: null,
	playlistindex: 0,
	playingsong: null,
	context: null,
	mc: null,
	
	initialized: false,
	/**
	 * 初始化
	 */
	_init: function(options){
		$.extend(this, options);
		this.songs = [];
		
		this.render();
	},
	
	/**
	 * render
	 */
	render: function(){
		this.context = new webkitAudioContext();
		
		//初始化播放列表
		this.initPlayList();
		//初始化播放器
		this.initplayer();
		//播放按钮控制
		this.initPlayerBtlisteners();
		//音量
		this.volumelistener();
		//均衡器
		this.filterControlListeners();
	},
	
	/**
	 * 
	 */
	initPlayList: function(){
		var cont = this.element.find(".play_list").children("ul").empty();

		for(var i in this.playlist){
			var playitem = this.playlist[i];
			var index = parseInt(i)+1;
			index = index < 10 ? "0"+index : index;
			var li = $('<li><span class="list_index">'+index+'</span><span class="list_name">'+playitem.name+'</span><span class="list_time">'+playitem.duration+'</span></li>');
			cont.append(li);
			li.data("index",i);
			
			var song = new Song(playitem.url, playitem.lrc, playitem.albumimg, this.context);
			
			this.songs.push(song);
			var self = this;
			li.dblclick(function(){
				self.playlistindex = $(this).data("index");
				self.__play();
				cont.children(".active").removeClass("active");
				$(this).addClass("active");
				$(".play_pause_bt", self.element).show();
				$(".play_play_bt", self.element).hide();
			});
		}
	},
	
	/**
	 * 初始化播放器
	 */
	initplayer: function(){
		this.player = new AudioKeys(this.context, null);
		//波普
		this.initMC();
	},
	
	/**
	 * 初始化播放按钮
	 */
	initPlayerBtlisteners: function(){
		var self = this;
		$(".play_play_bt", this.element).click(function(){
			if(self.player && !self.player.isPlaying){
				if(self.initialized){
					self.player.play();
					self.progress();
				}else{
					self.__play();
				}
			}
			
			$(".play_pause_bt", this.element).show();
			$(this).hide();
		});
		
		$(".play_pause_bt", this.element).click(function(){
			if(self.player && self.player.isPlaying){
				self.player.pause();
			}
			$(".play_play_bt", this.element).show();
			$(this).hide();
		});
		
		$(".play_prev_bt", this.element).click(function(){
			self.__playprev();
			return false;
		});
		$(".play_next_bt", this.element).click(function(){
			self.__playnext();
			return false;
		});
	},
	
	__play: function(){
		var lis = this.element.find(".play_list").find("li");
		lis.removeClass("active");
		lis.eq(this.playlistindex).addClass("active");
		this.playingsong = this.songs[this.playlistindex];
		if(this.playingsong){
			var self = this;
			//加载歌词
			self.loadLRC();
			//加载专辑图片
			self.loadAlbumImg()
			self.player.create(self.context);
			this.playingsong.load(function(buffer){
				var alltime = self.player.convertTime(self.playingsong.duration);
				$(".timewrap .alltime", self.element).html(alltime);
				self.player.play(buffer);
				self.progress();
				self.initialized = true;
			});
		}
	},
	
	__playnext: function(){
		this.playlistindex ++;
		this.playlistindex = this.playlistindex % this.playlist.length;
		this.__play();
		$(".play_pause_bt", this.element).show();
		$(".play_play_bt", this.element).hide();
	},
	
	__playprev: function(){
		this.playlistindex --;
		this.playlistindex = (this.playlistindex + this.playlist.length)% this.playlist.length;
		this.__play();
		$(".play_pause_bt", this.element).show();
		$(".play_play_bt", this.element).hide();
	},
	
	__ending: function(){
		this.playlistindex ++;
		this.playlistindex = this.playlistindex % this.playlist.length;
		var lis = this.element.find(".play_list").find("li");
		lis.eq(this.playlistindex).dblclick();
	},
	
	/**
	 * 进度
	 */
	progress: function(){
		var self = this;
		
		function _p(){
			if(self.player.isPlaying){
				var current = self.player.getCurrentTime();
				var duration = self.playingsong.duration;
				
				if(current > duration){
					self.player.isPlaying = false;
					self.player.stop();
					self.__ending();
					return false;
				}
				var playtime = self.player.convertTime(current);
				$(".timewrap .playtime", self.element).html(playtime);
				if(self.clrc){
					self.clrc.DoSync(current);
				}
				
				var pw = $(".progress", self.element).width();
				var x = current / duration * pw;
				$(".timeline", self.element).width(x);				
				requestAnimationFrame(_p);
			}
		}
		_p();
	},
	
	/**
	 * 
	 */
	volumelistener: function(){
		var self = this;
		var vwidth = $(".volume_slide", this.element).width();
		$(".play_volume_bt", self.element).data("x", -498);
		$(".volume_slide", this.element).click(function(e){
			var point = $(this).children(".vpoint");
			if(e.target == point[0]){
				return false;
			}
			var x = e.offsetX;
			$(".volume_slide_progress", self.element).animate({width: x}, 500);
			point.animate({left: x}, 500, function(){
				var delta = x/vwidth;
				if(self.player){
					self.player.volume(delta);
				}
				var step = 0;
				if(delta==0){
					$(".play_volume_bt", self.element).css("background-position","0px 50%").data("x",0);
				}else if(delta > 0 && delta <= 0.33){
					$(".play_volume_bt", self.element).css("background-position","-290px 50%").data("x",-290);
				}
				else if(delta > 0.33 && delta <= 0.67){
					$(".play_volume_bt", self.element).css("background-position","-316px 50%").data("x",-316);
				}
				else{
					$(".play_volume_bt", self.element).css("background-position","-498px 50%").data("x",-498);
				}
			});
		});
		
		$(".play_volume_bt", this.element).click(function(){
			var point = $(".volume_slide", self.element).children(".vpoint");
			if($(this).hasClass("disable")){
				$(this).removeClass("disable");
				var x = $(".play_volume_bt", self.element).data("x");
				$(".play_volume_bt", self.element).css("background-position",x+"px 50%")
				var left = point.data("left");
				$(".volume_slide_progress", self.element).animate({width: left}, 500);
				point.animate({left: left}, 500);
				if(self.player){
					self.player.unmute();
				}
			}else{
				$(this).addClass("disable");
				$(".play_volume_bt", self.element).css("background-position","-82px 50%");
				point.data("left", point.css("left"));
				$(".volume_slide_progress", self.element).animate({width: 0}, 500);
				point.animate({left: 0}, 500);
				if(self.player){
					self.player.mute();
				}
			}
		});
	},
	
	/**
	 * 加载歌词
	 */
	loadLRC: function(){
		var self = this;
		var url = this.playingsong.lrc;
		$(".song_lrc_table", this.element).empty();
		if(url && url != ""){
			$.get(url, function(data){
				self.clrc=new LRC({lyric:data,lyricTable:$('.song_lrc_table')[0],lyricWrapper:$('.song_lrc')[0],curRowClassName:'curRow',separator:'\n'});
			    if(self.clrc.IsLyricValid()){
			    	self.clrc.DoSync(0);
			    }
			});
		}else{
			self.clrc = null;
		}
	},
	
	/**
	 * 加载专辑图片
	 */
	loadAlbumImg: function(){
		var albumurl = this.playingsong.albumimg;
		$(".singer_info", this.element).empty();
		if(albumurl != ""){
			$(".singer_info", this.element).append('<img src="'+albumurl+'" width="130px">');
		}
	},
	
	/**
	 * 均衡器
	 */
	filterControlListeners: function(){
		$(".fader", this.element).mousedown(function(){
			$(this).addClass("active");
			last = undefined;
			max = $(this).parent().height() - $(this).height();
			draghandle(this,'y');
			
			return false;
		});
		
		$(document).mouseup(function(){
			$(".fader", this.element).removeClass("active");
		});
		
		function draghandle(ele, dir){
			$(document).mousemove(function(e){
				if($(ele).hasClass("active")){
					var pos = dir == 'y' ? e.pageY : e.pageX;
					var offpos = last ? pos - last : 0;
					last = pos;
					
					var lefttop = dir == 'y' ? $(ele).position().top + offpos : $(ele).position().left + offpos;
					lefttop = lefttop < 0 ? 0 : lefttop > max ? max : lefttop;
					
					var lt = dir == 'y'?"top":"left";				
					$(ele).css(lt, lefttop);
					
					if (dir == 'x') {
						var delta = (lefttop - max / 2) / max / 2;
//						p.panner.setPosition(delta, 0, 0.5);
					}else{
						var delta = 1-lefttop/max;
//						p.volume.gain.value = delta;
					}
				}
				
				return false;
			});
		}
	},
	
	initMC: function(){
		this.mc = new MC(this.player);
	}
}

$(function(){
	var player = new CPlayer({
		element: $("#c-player"),
		playlist: PlayList
	});
});