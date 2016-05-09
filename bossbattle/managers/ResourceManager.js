var img_path = main_dir+"/assets/images/";
var snd_path = main_dir+"/assets/sounds/";

//Display the loading screen while everything else is loading...
function ResourceManager(){
	//IMAGE VARIABLE DECLARATION
	this.images_loaded = 0;
	this.image_names = [
		"soundButtons",
		"player_sheet",
		"critter_sheet",
		"tile_sheet",
		"hat_sheet",
		"boss_zero_sheet",
		"boss_one_sheet",
		"boss_two_sheet",
		"boss_three_sheet",
		"fire_sheet",
		"baby_one_sheet",
		"boss_four_sheet",
		"collection_sheet",
		"player_wing_sheet",
		"critter_wing_sheet",
		"baby_fire_sheet",
		"player_magnet_sheet"
	];
	this.necessary_images = 8;
	this.num_images = this.image_names.length;
	
	//SOUND VARIABLE DECLARATION
	this.play_sound = true;
	this.play_music = true;
	this.can_play_sound = true;
	this.audio_context;
	try{
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		this.audio_context = new AudioContext();
	}catch(e){
		console.log(e);
		this.audio_context = null;
		this.play_sound = false;
		this.play_music = false;
		this.can_play_sound = false;
	}
	this.sounds_loaded = 0;
	this.sound_names = [
		"jump"
		,"land"
		,"catch"
		,"die"
		,"awaken"
		,"button"
		,"LOZ_Get_Heart"
		,"kill"
		,"regrow"
		,"gold"
		,"gainPower"
		,"locked"
		,"checkpoint"
		,"hurt"
		,"pickup"
		,"LA_Chest_Open"
		,"frenzyStart"
		,"specialGoblin"
		,"switchglitch"
		,"error"
		,"LOZ_Boss_Scream1"
		,"LOZ_Boomerang"
		,"dashcharge"
		,"dash2"
		,"minithud"
		,"thud"
		,"awaken"
		,"regrow"
		,"And_Start_Havok"
	];
	this.necessary_sounds = 0;
	this.num_sounds = this.sound_names.length;
}

ResourceManager.prototype.DisplayLoadScreen = function(){
	ctx.canvas.width = GAME_WIDTH*VIEW_SCALE;
	ctx.canvas.height = GAME_HEIGHT*VIEW_SCALE;
	ctx.scale(2,2);
	
	//Display the LOADING... screen
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	ctx.fillStyle = "rgb(255,255,255)";
	//ctx.font = "24px pixelFont";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("LOADING GAME...", 134, GAME_HEIGHT/2+25);
	ctx.fillText("PLEASE WAIT :)", 134, GAME_HEIGHT/2+80);
}

ResourceManager.prototype.ImageLoad = function(){ 
	this.images_loaded++;
	this.CheckLoadedResources(); 
}
ResourceManager.prototype.SoundLoad = function(){ 
	this.sounds_loaded++; 
	this.CheckLoadedResources(); 
}

//LOAD ALL THE RESOURCES
ResourceManager.prototype.LoadResources = function(ctx){
	this.DisplayLoadScreen(ctx);

	//Load Images
	for (var i = 0; i < this.image_names.length; i++){
		var img = this.image_names[i];
		this[img] = new Image();
		this[img].onload = this.ImageLoad.bind(this);
		this[img].src = img_path + img + ".png";
	}
	
	if (this.audio_context === null || !this.can_play_sound){ 
		this.sounds_loaded = this.sound_names.length;
		return;
	}
	this.LoadNextSound();
	//Load Sounds
/*	for (var i = 0; i < this.sound_names.length; i++){
		var snd = this.sound_names[i];
		this.loadBuffer(snd_path + snd + ".mp3", snd);
	}*/
}

ResourceManager.prototype.LoadNextSound = function(){
	if (this.sounds_loaded >= this.sound_names.length) return;

	var snd = this.sound_names[this.sounds_loaded];
	this.loadBuffer(snd_path + snd + ".mp3", snd);
}

ResourceManager.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
  
    // Asynchronously decode the audio file data in request.response
    loader.audio_context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader[index] = buffer;
		loader.SoundLoad();
		//Force sequential sound loading
		loader.LoadNextSound();
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    console.log('BufferLoader: XHR error');
  }

  request.send();
}

ResourceManager.prototype.CheckLoadedResources = function(){
	if (this.images_loaded >= this.necessary_images 
		&& this.sounds_loaded >= this.necessary_sounds){
		if (!game_started) startGame();
	}
}