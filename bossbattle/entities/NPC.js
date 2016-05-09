function NPC(x, y, npc_id, speech){
	GameMover.call(this, x, y, 2, 2, 14, 16, "npc_sheet");
	this.type = "NPC";
	this.speech = defaultValue(speech, null);
	this.npc_id = defaultValue(npc_id, null);
	if (this.npc_id === null || this.npc_id === undefined){
		this.speech = this.CleanSpeech(this.speech);
	}
	this.animation.frame_delay = 30;
}
NPC.prototype.Import = function(obj){
	GameMover.prototype.Import.call(this, obj);
	this.npc_id = obj.npc_id;
	this.speech = obj.speech;
	if (this.npc_id === null || this.npc_id === undefined){
		this.speech = this.CleanSpeech(this.speech);
	}
}

NPC.prototype.Export = function(){
	var obj = GameMover.prototype.Export.call(this);
	if (this.npc_id === null || this.npc_id === undefined){
		this.speech = this.CleanSpeech(this.speech);
	}
	obj.npc_id = this.npc_id;
	obj.speech = this.speech;
	return obj;
}
extend(GameMover, NPC);

NPC.prototype.CleanSpeech = function(speech){
	if (speech === undefined || speech === null) speech = "";
	var bad = ["\r\n", "\r", "'", '"', ';', ':', '[', ']', '\n', '\t','!','@','#','%','^', '&', '*','`', "\\"];
	for (var i = 0; i < bad.length; i++){
		speech = speech.replace(bad[i], '');
	}
	return speech;
}

NPC.prototype.Update = function(delta, map){
	GameMover.prototype.Update.call(this, delta, map);
	
	var d = 16;
	var dy = 8;
	var px = map.player.x + (map.player.rb/2);
	if (map.player.y + map.player.bb > this.y - dy && map.player.y < this.y + this.bb + dy){
		if (px < this.x + this.lb && px > this.x + this.lb - d){
			this.facing = Facing.LEFT;
		}
		if (px > this.x + this.rb && px < this.x + this.rb + d){
			this.facing = Facing.RIGHT;
		}
	}
	
	
	//TALK TO PLAYER AND SUCH
	if (this.IsRectColliding(map.player, this.x+this.lb-Tile.WIDTH, this.y+this.tb, this.x+this.rb+Tile.WIDTH, this.y+this.bb)){
		this.talking = true;
		if (this.npc_id != 19)
			room.Speak("NPC: "+this.GetText());
		else room.Speak(this.GetText());
	}
	else if (this.talking){
		this.talking = false;
		room.Speak(null);
	}
}

NPC.prototype.UpdateAnimationFromState = function(){
	var ani_x = 0;//this.npc_id / 2;
	var ani_y = 0;//this.npc_id % 2;
	this.animation.Change(ani_x, ani_y, 2);
	
	if (this.facing === Facing.LEFT){
		this.animation.abs_ani_y = 2 * this.animation.frame_height;
	}else if (this.facing === Facing.RIGHT){
		this.animation.abs_ani_y = 0;
	}
	this.prev_move_state = this.move_state;
}

//TEXT BABY
NPC.prototype.GetText = function(){
	if (this.speech !== null && this.speech !== undefined && this.speech !== "")
		return this.speech;

	switch (this.npc_id){
		case -1:
			return "hold up or Z to jump higher\n\nthere is no escape";
		case 0:
			return "you must escape\n the labyrinth\nuse arrow keys";
		case 1:
			return "press down to fall\n and to enter doors";
		case 2:
			return "when red, you can\nwalk off cliffs\nwithout falling";
		case 3:
			return "press space bar or numbers\n to cast a spell";
		case 4:
			return "press down to\nplace a memory";
		case 5:
			return "are we free now?";
		case 6:
			return "dying revives you to\nlast checkpoint\ni'm sorry";
		case 7:
			return "remember your wits\n\ndeath is inevitable";
		case 8:
			return "don't afraid of\nfailure\nits all there is";
		case 9:
			return "magick controls\nthe dungeon";
		case 10:
			return "GET\nwitch/rooms/rooms/room_4_5.txt\n404 (File not found)";
		case 11:
			return "patience is a virtue\n\nthat means nothing here";
		case 12:
			return "give up your hope\nbefore you lose it";
		case 13:
			return "there is no real escape";
		case 14:
			return "i believe in you";
		case 15:
			return "nice of you to stop by\nthis is the wrong way";
		case 16:
			return "you escaped!\ncongratulations!";
		case 17:
			return "we knew you could do it!\nwell i did at least";
		case 18:
			return "hip hip hooray!\nyay!!\nyou're the best!";
		case 19:
			return 	"deaths: " + room_manager.num_deaths + "\n" +
					"spells cast: " + room_manager.spells_cast + "\n" +
					"time: " + room_manager.time + " min";
		case 20:
			return "thanks for playing :)!\n\npress shift+r to restart";
		case 21:
			return "IT'S A SECRET\nTO EVERYBODY.";
		case 99:
			return "go back to the beginning";
		default:
			return "";
	}
}