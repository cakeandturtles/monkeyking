var level_edit = false;
var click_to_start = false;
var cts_time = 0;
var cts_time_limit = 32;
var cts_display = true;
var master_volume = 0.2;
var delta = 18; //this is a little hacky.
var DNUM = 18;
var sky_color = "#88bbff";
var text_color = "#000000";
var paused = false;
var pause_text = "GAME IS PAUSED";
var dead = false;
var dead_timer = 0;
var dead_time_limit = 120;

var mem_deaths = 0;
var mem_shot = 0;
var mem_time = 0;



var boss_form = 0;
var old_boss_form = 0;
var is_new_game_plus = false;
var prev_new_game_plus = false;
var can_continue = false;
var is_new_game_plus_unlocked = false;

var select_index = -1;
var combo_time = 0;
var combo_time_limit = 30;

var bg_music = null;
var bg_name = null;
var tryToPlay = null;

var GAME_WIDTH=160; //CHANGE TO /2
var GAME_HEIGHT=120; //CHANGE TO /2
var VIEW_SCALE = 4; //CHANGE TO *2

/*VIEW_SCALE = 2;
GAME_WIDTH = 320;
GAME_HEIGHT = 240;*/

var canvas;
var ctx;

//primitive variables
var game_started = false;
var then;
var fontColor = "rgb(0,0,0)"

//managers
var room_manager;
var key_manager;
var input_manager;
var resource_manager;

var room;

var init = function(){
	if (level_edit) InitLevelEdit();
	console.log("init");
	
	canvas = $("game_canvas");
	canvas.tabIndex = 1;
	canvas.width = GAME_WIDTH;
	canvas.height = GAME_HEIGHT;
	ctx = canvas.getContext("2d");
	set_textRenderContext(ctx);
	
	//Handle keyboard controls
	key_manager = new KeyManager();
	window.onkeydown = key_manager.KeyDown.bind(key_manager);
	window.onkeyup = key_manager.KeyUp.bind(key_manager);
	if (level_edit){
		canvas.onmousedown = function(e){LevelEditMouseDown(e); SoundMouseDown(e)}
		canvas.onmousemove = LevelEditMouseMove;
		canvas.onmouseup = function(e){ LevelEditMouseUp(e); SoundMouseUp(e); click_to_start = false;}
		$("tileset_canvas").onmousedown = TileSetMouseDown;
	}else{
		canvas.onmousedown = SoundMouseDown;
		canvas.onmouseup = function(e){
			SoundMouseUp(e);
			if (click_to_start) ClickToStart(e);
		}
		canvas.onmousemove = function(e){
			if (click_to_start) HoverToStart(e);
		}
	}
	
	input_manager = new InputManager(key_manager);
	
	//When load resources is finished, it will trigger startGame
	setTimeout(function(){
		resource_manager = new ResourceManager();
		resource_manager.LoadResources(ctx);
	}, 1);
};

var startGame = function(){
	if (game_started) return;
	game_started = true;

	room_manager = new Dungeon(function(){
		room = room_manager.GetRoom();
		console.log("start");
		
		var memory = Utils.readCookie('monkeykingmemory');
		if (memory){
			//Format of memory::
				//boss_form,is_new_game_plus,is_new_game_plus_unlocked;
			console.log(memory);
			memory = memory.split(',');
			boss_form = defaultValue(eval(memory[0]), 0);
			is_new_game_plus = defaultValue(eval(memory[1]), false);
			prev_new_game_plus = is_new_game_plus;
			if (boss_form >= 1){
				can_continue = true;
			}
			is_new_game_plus_unlocked = defaultValue(eval(memory[2]), false);
			
			mem_deaths = eval(memory[3]);
			mem_shot = eval(memory[4]);
			mem_time = eval(memory[5]);
		}
		click_to_start = true;
	
		//Let's play the game!
		then = Date.now();
		setInterval(main, 17);
	}.bind(this));
};

var stopSound = function(){
	resource_manager.play_sound = false;
}

var startSound = function(){
	if (!resource_manager.can_play_sound) return;
	resource_manager.play_sound = true;
}

var stopMusic = function(){
	resource_manager.play_music = false;
	window.clearInterval(tryToPlay);
	tryToPlay = null;
	if (bg_music !== null && bg_music !== undefined){
		bg_music.stop();
		bg_music = null;
	}
}

var startMusic = function(){
	if (!resource_manager.can_play_sound) return;
	resource_manager.play_music = true;

	if (bg_name !== null && bg_name !== undefined){
		bg_music = Utils.playSound(bg_name, master_volume+0.3, 0, true);
	}
}

var SoundMouseDown = function(){
}

var SoundMouseUp = function(e){
	var box = canvas.getBoundingClientRect();
	
	var x = (e.clientX - box.left) / 2;
	var y = (e.clientY - box.top) / 2;
	
	if (x >= 4 && x <= 20){
		if (y >= 4 && y <= 20){
			if (resource_manager.play_music){
				stopMusic();
				stopSound();
			}else if (resource_manager.can_play_sound){
				startSound();
				startMusic();
			}
		}
	}
}

var ClickToStart = function(e){
	switch(select_index){
		case 0:
			click_to_start = false;
			is_new_game_plus = false;
			room_manager.Restart();
			room = room_manager.rooms[0][0];
			break;
		case 1:
			is_new_game_plus = prev_new_game_plus;
			click_to_start = false;
			room_manager.Restart();
			room = room_manager.rooms[0][0];
			resource_manager.play_sound = false;
			var bf = boss_form;
			for (var i = 1; i < bf; i++){
				room.player.maxHP++;
				room.boss.ForceTransform(room);
			}
			room.boss.HP = 0;
			room.Speak(null);
			room.player.HP = room.player.maxHP;
			room.camera.x = room.boss.x - room.camera.x_lim*2;
			room.camera.y = room.boss.y - room.camera.y_lim*3.5;
			resource_manager.play_sound = resource_manager.can_play_sound;
			if (bf === 4){
				room.boss.ForceTransform(room);
				bg_name = "And_Start_Havok";
				if (resource_manager.play_music){
					stopMusic();
					startMusic();
				}
			}
			room_manager.num_deaths = mem_deaths;
			room_manager.old_time = mem_time;
			room_manager.num_released = mem_shot;
			room.Speak(null);
			break;
		case 2:
			click_to_start = false;
			is_new_game_plus = true;
			room_manager.Restart();
			room = room_manager.rooms[0][0];
			break;
		case 3:
			click_to_start = false;
			room_manager.Restart();
			room = room_manager.rooms[0][0];
			room.player.zen = true;
			room.boss.zen = true;
			old_boss_form = boss_form;
			
			var bf = 5;
			for (var i = 1; i < bf; i++){
				room.player.maxHP++;
				room.boss.ForceTransform(room);
			}
			room.boss.HP = 0;
			room.Speak(null);
			room.player.HP = room.player.maxHP;
			room.player.WingMe();
			room.player.magnet = true;
			
			room.camera.x = room.boss.x - room.camera.x_lim*2;
			room.camera.y = room.boss.y - room.camera.y_lim*3.5;
			resource_manager.play_sound = resource_manager.can_play_sound;
			
			break;
	}
}

var HoverToStart = function(e){
	var box = canvas.getBoundingClientRect();
	
	var x = (e.clientX - box.left) / 2;
	var y = (e.clientY - box.top) / 2;
	
	var q = (VIEW_SCALE/4);
	select_index = -1;
	if (y >= 52 && y <= 67){
		select_index = 0;
	}else if (y >= 67 && y <= 82){
		if (can_continue)
			select_index = 1;
	}else if (y >= 82 && y <= 97){
		if (is_new_game_plus_unlocked)
			select_index = 2;
	}else if (y >= 97 && y <= 112){
		if (is_new_game_plus_unlocked)
			select_index = 3;
	}
}

//main game loop
var main = function(){
	var now = Date.now();
	//time variable so we can make the speed right no matter how fast the script
    //delta = now - then;
	
	if (!paused && !click_to_start){
		update(delta);
	}
	else{
		if (input_manager.key_manager.keys_pressed[InputManager.PAUSE]){
			input_manager.key_manager.keys_pressed[InputManager.PAUSE] = false;
			paused = false;
		}
		if (input_manager.key_manager.keys_pressed[KeyManager.ESCAPE]){
			input_manager.key_manager.keys_pressed[KeyManager.ESCAPE] = false;
			VIEW_SCALE = 4;
			GAME_WIDTH = 160;
			GAME_HEIGHT = 120;
			click_to_start = true;
			paused = false;
			select_index = -1;
		}
	}
	render();
	then = now;
}

var update = function(delta){
    room.Update(input_manager, delta);
	key_manager.ForgetKeysPressed();
	
	if (dead || click_to_start){
		dead_timer++;
		if (dead_timer >= dead_time_limit){
			dead_timer = 0;
			dead = false;
			room_manager.RevivePlayer();
		}
	}
};

var render = function(){
	ctx.canvas.width = GAME_WIDTH*VIEW_SCALE;
	ctx.canvas.height = GAME_HEIGHT*VIEW_SCALE;
	ctx.scale(VIEW_SCALE,VIEW_SCALE);
	
	//Erase screen
	ctx.fillStyle = sky_color;
	ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
	
	var q = (4/VIEW_SCALE);
	var size = 8*q;
	ctx.font = size + "px pixelFont";
	if (paused){				
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
	
		ctx.fillStyle = "#ffffff";
		ctx.fillText(pause_text, 50*q, 16*q);
		ctx.fillText("PRESS ENTER TO CONTINUE", 30*q,32*q);
		ctx.fillText("PRESS ESC TO MAIN MENU", 30*q, 40*q);
		return;
	}if (click_to_start){
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
	
		cts_time++;
		if (cts_time >= cts_time_limit){
			cts_display = !cts_display;
			cts_time = 0;
		}
		if (select_index >= 0){
			ctx.fillStyle = "#666666";
			ctx.fillRect(0, 24*q+8*q*(select_index), GAME_WIDTH, 8*q);
		}
		
		ctx.fillStyle = "#ffffff";
		if (cts_display)
			ctx.fillText("CLICK TO START", 50*q,16*q);
		ctx.fillStyle = "#ffffff";
		ctx.fillText("NEW GAME", 20*q,32*q);
		if (can_continue)
			ctx.fillStyle = "#ffffff";
		else ctx.fillStyle = "#888888"; 
		ctx.fillText("CONTINUE", 20*q,40*q);
		if (is_new_game_plus_unlocked)
			ctx.fillStyle = "#ffffff";
		else ctx.fillStyle = "#888888";
		ctx.fillText("NEW GAME +", 20*q,48*q);
		ctx.fillText("ZEN MODE", 20*q, 56*q);
		
		return;
	}
	
	//draw the game
	sharpen(ctx);
	room.Render(ctx, level_edit);

	if (room.boss.boss_form !== 5){
		combo_time++;
		if (combo_time >= combo_time_limit){
			combo_time = 0;
		}
		//draw the number of critters...
		if (room_manager.critter_queue.length < room_manager.critter_capacity)
			ctx.fillStyle = text_color;
		else{
			if (combo_time < combo_time_limit / 3)
				ctx.fillStyle = "#ff0000";
			else if (combo_time < 2 * (combo_time_limit / 3))
				ctx.fillStyle = "#00ff00";
			else ctx.fillStyle = "#0000ff";
		}
		var size = room_manager.critter_queue.length;
		ctx.fillText(size, 150*q - ((size.toString().length)*4), 8*q);

		if (room_manager.num_hit > 0){
			if (combo_time < combo_time_limit / 3)
				ctx.fillStyle = "#ffff00";
			else if (combo_time < 2 * (combo_time_limit / 3))
				ctx.fillStyle = "#00ffff";
			else ctx.fillStyle = "#ff00ff";
			
			ctx.fillText("+"+room_manager.num_hit, 144*q, 114*q);
		}
	}
	
	//draw dead
	ctx.globalAlpha = (dead_timer / dead_time_limit);
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
	ctx.globalAlpha = 1;
	
	//draw sound buttons
	var ani_x = 0;
	if (!resource_manager.play_music) ani_x = 16;
	var w = 4 / VIEW_SCALE;
	
	ctx.scale(0.5, 0.5);
	ctx.drawImage(resource_manager.soundButtons, 
		//SOURCE RECTANGLE
		ani_x, 16, 16, 16,
		//DESTINATION RECTANGLE
		4*w, 4*w, 16*w, 16*w
	);
	
	/*ani_x = 0;
	if (!resource_manager.play_sound) ani_x = 16;
	ctx.drawImage(resource_manager.soundButtons, 
		//SOURCE RECTANGLE
		ani_x, 16, 16, 16,
		//DESTINATION RECTANGLE
		4*w, 24*w, 16*w, 16*w
	);*/
};

window.onload= function(){setTimeout(init, 0);}

//SECRET TROPHIES!!!
var Trophy = function(){};
Trophy.MONKEY_KING = 9757;
Trophy.TRUE_MONKEY_KING = 9758;
Trophy.TRUE_TRUE_MONKEY_KING = 9786;
Trophy.GiveTrophy = function(trophy){
	var username = Utils.gup("gjapi_username");
	var user_token = Utils.gup("gjapi_token");
	if (username === null || username === '')
		return;
	console.log(username + ", " + user_token);
	
	//This stuff is contextual to my game jolt game, so 
	//if you're making a game in game jolt, the achievement token
	//for your game should be able to be used here
	var game_id = GJAPI.game_id;

	var url = "http://gamejolt.com/api/game/v1/trophies/add-achieved/?game_id="+game_id+"&username="+username+
				"&user_token="+user_token;
	url += "&trophy_id="+trophy;
	
	//TODO:: BEFORE COMMITTING TO GIT, ADD THIS SOMEWHERE ELSE AND HIDE IT!!!
	var signature = url + GJAPI.private_token;
	signature = md5(signature);
	
	var xmlhttp = new XMLHttpRequest();
	var url = url + "&signature=" + signature;
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}

Trophy.AddScore = function(score, sort, table_id){
	var username = Utils.gup("gjapi_username");
	var user_token = Utils.gup("gjapi_token");
	if (username === null || username === '')
		return;
	console.log(username + ", " + user_token);
	
	//This stuff is contextual to my game jolt game, so 
	//if you're making a game in game jolt, the achievement token
	//for your game should be able to be used here
	var game_id = GJAPI.game_id;
	
	var url = "http://gamejolt.com/api/game/v1/scores/add/?game_id="+game_id+"&username="+username+"&user_token="+user_token+"&score="+score+"&sort="+sort+"&table_id="+table_id;
	
	//TODO:: BEFORE COMMITTING TO GIT, ADD THIS SOMEWHERE ELSE AND HIDE IT!!!
	var signature = url + GJAPI.private_token;
	signature = md5(signature);
	
	var xmlhttp = new XMLHttpRequest();
	var url = url + "&signature=" + signature;
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}