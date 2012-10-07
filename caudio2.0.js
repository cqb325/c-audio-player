/**
 * @author sony
 */
var palyer = null;
var duration = null;
var clrc = null;
var currenttime = 0;
var audio = null;
var camera, scene, renderer, audio, container;
var bars = 256;
var columns = [];
var foo = 75;

$(function(){
	//播放按钮控制
	initPlayerBtlisteners();
	//音量
	volumelistener();
	
	initplayer();
	
	init();
	animate();
	
	//加载歌词
	loadLRC();
})

function initPlayerBtlisteners(){
	$(".play_play_bt").click(function(){
		palyer.play();
		progress();
		
		$(".play_pause_bt").show();
		$(this).hide();
	});
	
	$(".play_pause_bt").click(function(){
		palyer.pause();
		$(".play_play_bt").show();
		$(this).hide();
	});
}

function progress(){
	if(palyer.isPlaying){
		requestAnimationFrame(progress);
		
		var current = palyer.getCurrentTime();
		var duration = palyer.duration;
		if(current >= duration){
			palyer.isPlaying = false;
			return false;
		}
		var playtime = palyer.convertTime(current);
		$(".timewrap .playtime").html(playtime);
		clrc.DoSync(current);
		
		var pw = $(".progress").width();
		var x = current / duration * pw;
		$(".timeline").width(x);
		
	}
}

function volumelistener(){
	var vwidth = $(".volume_slide").width();
	$(".volume_slide").click(function(e){
		var point = $(this).children(".vpoint");
		if(e.target == point[0]){
			return false;
		}
		var x = e.offsetX;
		$(".volume_slide_progress").animate({width: x}, 500);
		point.animate({left: x}, 500, function(){
			var delta = x/vwidth;
			palyer.volume(delta);
			var step = 0;
			if(delta==0){
				$(".play_volume_bt").css("background-position","0px 50%");
			}else if(delta > 0 && delta <= 0.33){
				$(".play_volume_bt").css("background-position","-290px 50%");
			}
			else if(delta > 0.33 && delta <= 0.67){
				$(".play_volume_bt").css("background-position","-316px 50%");
			}
			else{
				$(".play_volume_bt").css("background-position","-498px 50%");
			}
		});
	});
	
	$(".play_volume_bt").click(function(){
		var point = $(".volume_slide").children(".vpoint");
		if($(this).hasClass("disable")){
			$(this).removeClass("disable");
			var left = point.data("left");
			$(".volume_slide_progress").animate({width: left}, 500);
			point.animate({left: left}, 500);
			palyer.unmute();
		}else{
			$(this).addClass("disable");
			point.data("left", point.css("left"));
			$(".volume_slide_progress").animate({width: 0}, 500);
			point.animate({left: 0}, 500);
			palyer.mute();
		}
	});
}

function initplayer(){
	palyer = new AudioKeys('cunzai.ogg');
	palyer.load(function() {
        var max = 2048;
        
        var multi = max/bars;
        for ( i=0; i<bars; i++) {
            palyer.addWatchers(i*multi, (i+1)*multi-1);
        }
		
		var alltime = palyer.formatDuration();
		$(".timewrap .alltime").html(alltime);
    });
}

function loadLRC(){
	$.get("cunzai.lrc", function(data){
		clrc=new LRC({lyric:data,lyricTable:$('.song_lrc_table')[0],lyricWrapper:$('.song_lrc')[0],curRowClassName:'curRow',separator:'\n'});
	    if(clrc.IsLyricValid()){
			clrc.DoSync(0);
	    }
	});
}

function init(){
	container = $(".playcanvas")[0];
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( foo, container.clientWidth / container.clientHeight, 1, 1000);
	
	var w = container.clientWidth;
	var h = container.clientHeight;
	
	var tan = Math.tan(foo/2*Math.PI/180);
	var aspect = w>h? h/w : w/h;

	camera.position.set( 0, 0, 150 );
	camera.position.z = w/2/tan*aspect;
	
	scene.add( camera );
	
	var geometry = new THREE.CubeGeometry( 3, container.clientHeight, 0 );
	for (var i = 0; i < bars; i++) {
		var bar = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
			color: 0xD6B934,
			opacity: 1
		}));
		bar.position.x = i*4-w/2;
		bar.position.y = -h+2;
		columns.push(bar);
		
		scene.add(bar);
	}
				
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( w, h );
	container.appendChild( renderer.domElement );
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function render() {
	if (palyer.isPlaying) {
		palyer.process();
		redraw();
	}
	renderer.render( scene, camera );
}

function redraw(){
	var mag, magnitude;
	for(var i in columns){
		mag = palyer.getLevels(i);
		magnitude = mag * container.offsetHeight;
		
		var bar = columns[i];
		bar.position.y = -container.offsetHeight+magnitude;
	}
}