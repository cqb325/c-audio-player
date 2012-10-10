/**
 * 
 */

var MC = function(player){
	this._init(player);
}

MC.prototype = {
	container: null,
	scene: null,
	camera: null,
	renderer: null,
	foo: 45,
	width: null,
	height: null,
	bars: 256,
	columns: null,
	player: null,
	_init: function(player){
		this.player = player;
		
		var max = 2048;
        
        var multi = max/this.bars;
        for ( i=0; i<this.bars; i++) {
        	this.player.addWatchers(i*multi, (i+1)*multi-1);
        }
		
		this.initBars();
		this.animate();
	},
	
	initBars: function(){
		this.columns = [];
		this.container = $(".playcanvas")[0];
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( this.foo, this.container.clientWidth / this.container.clientHeight, 1, 1000);
		
		var w = this.width = this.container.clientWidth;
		var h = this.height = this.container.clientHeight;
		
		var tan = Math.tan(this.foo/2*Math.PI/180);
		var aspect = w>h? h/w : w/h;
		
		this.camera.position.set( 0, 0, 150 );
		this.camera.position.z = w/2/tan*aspect;
		
		this.scene.add( this.camera );
		
		var geometry = new THREE.CubeGeometry( 3, this.height, 0 );
		for (var i = 0; i < this.bars; i++) {
			var bar = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
				color: 0xD6B934,
				opacity: 1
			}));
			bar.position.x = i*4-w/2;
			bar.position.y = -h+2;
			this.columns.push(bar);
			
			this.scene.add(bar);
		}
					
		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setSize( w, h );
		this.container.appendChild( this.renderer.domElement );
	},
	
	animate:function() {
		var self = this;
		function _animate(){
			requestAnimationFrame( _animate );
			self.render();
		}
		_animate();
	},

	render: function() {
		if (this.player.isPlaying) {
			this.player.process();
			this.redraw();
		}
		this.renderer.render( this.scene, this.camera );
	},

	redraw: function(){
		var mag, magnitude;
		for(var i in this.columns){
			mag = this.player.getLevels(i);
			magnitude = mag * this.height;
			
			var bar = this.columns[i];
			bar.position.y = -this.height+magnitude+2;
		}
	}
}