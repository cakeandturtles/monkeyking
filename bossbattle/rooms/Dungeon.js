function Dungeon(callback){
	this.path = main_dir + "/rooms/rooms/room_";
	this.num_deaths = 0;
	this.spells_cast = 0;
	this.then = Date.now();
	this.time = 0;
	this.num_critters_released = 0;
	this.biggest_combo = 0;
	this.beat_game = false;
	this.submitted = false;
	this.new_game_plus = 0;
	this.unlock_new_game_plus = false;
	this.old_time = 0;
	this.anna_cheat_code = false;
	
	this.releasing_critters = false;
	this.num_hit = 0;
	this.critter_queue = [];
	this.timeout_queue = [];
	this.lost_queue = [];
	this.critter_time = 0;
	this.critter_time_limit = 5;
	this.critter_capacity = 10;
	this.room_critter_capacity = 3;

	this.room_index_x = 0;
	this.room_index_y = 0;
	this.old_room_index_x = 0;
	this.old_room_index_y = 0;
	
	this.house_width = 1;
	this.house_height = 1;
	this.rooms_loaded = 0;
	this.room_load_queue = [];
	
	this.rooms = [];
	this.SetUpRooms();
	
	this.checkpoint = null;
	this.checkpoint_index = 0;
	
	setTimeout(function(){this.LoadNextRoom(callback);}.bind(this), 0);
}

Dungeon.EVENT_INDEX = 0;

Dungeon.prototype.LoadNextRoom = function(callback){	
	var room_q = this.room_load_queue.splice(0, 1)[0];
	var i = room_q[0];
	var j = room_q[1];
	var filename = this.path + j + "_" + i;
	filename += ".txt";
	
	self = this;
	
	Room.ImportAsync(filename, function(room){
		self.rooms[i][j] = room;
		self.rooms_loaded++;
		
		if (self.rooms_loaded >= self.house_height * self.house_width){
			console.log("done loading");
			self.FinishedLoading(callback);
		}
		
		if (self.room_load_queue.length > 0){
			setTimeout(function(){
				self.LoadNextRoom(callback);
			}.bind(self), 0);
		}
	});
}

Dungeon.prototype.StartReleasingCritters = function(){
	if (this.critter_queue.length === 0 || (room.player.facing === Facing.LEFT && room.player.x <= 64) ||
			(room.player.facing === Facing.RIGHT && room.player.x >= room.MAP_WIDTH*Tile.WIDTH - 64 - room.player.rb))
		Utils.playSound("error", master_volume, 0);
	else{
		room.player.frozen = true;
		this.num_hit = 0;
		this.releasing_critters = true;
		this.critter_time = this.critter_time_limit;
	}
}

Dungeon.prototype.ReleaseCritters = function(){
	if (!this.releasing_critters) return;

	this.critter_time++;
	if (this.critter_time >= this.critter_time_limit){
		if (this.critter_queue.length === 0){
			//this.StopReleasingCritters();
		}else{
			this.critter_time = 0;
			//should this be pop?
			var obj = this.critter_queue.shift();
			var critter = new Critter(room.player.x, room.player.y, obj[0], obj[1]);
			critter.critter_id = obj[0];
			critter.beserking = true;
			critter.move_state = MoveState.RUNNING;
			if (room.player.facing == Facing.LEFT){
				critter.facing = Facing.LEFT;
				critter.x -= 8;
				critter.vel.x = -critter.max_run_vel;
			}
			else{
				critter.x += 8;
				critter.vel.x = critter.max_run_vel;
			}
			Utils.playSound("switchglitch", master_volume, 0);
			room.entity_queue.push(critter);
			
			this.num_critters_released++;
		}
	}
	
	if (room.player.hurt && room.player.hurt_time < room.player.hurt_time_limit/2)
		this.StopReleasingCritters();
}

Dungeon.prototype.StopReleasingCritters = function(){
	this.critter_time = 0;
	this.releasing_critters = false;
	room.player.frozen = false;
}

Dungeon.prototype.SetUpRooms = function(){
	this.rooms = [];
	for (var i = 0; i < this.house_height; i++){
		var row = [];
		for (var j = 0; j < this.house_width; j++){
			row.push([]);
		}
		this.rooms.push(row);
	}
	
	for (var i = 0; i < this.house_height; i++){
		for (var j = 0; j < this.house_width; j++){
			this.room_load_queue.push([i, j]);
		}
	}
}

Dungeon.prototype.FinishedLoading = function(callback){
	var room = this.rooms[this.room_index_y][this.room_index_x];
	this.ResetCheckpoint(room);
	callback();
}

Dungeon.prototype.ResetCheckpoint = function(room){
	this.checkpoint = {
		x: room.player.x, y: room.player.y, 
		room_x: this.room_index_x,
		room_y: this.room_index_y,
		facing: room.player.facing,
	};
	this.checkpoint_queue = [];
}

Dungeon.prototype.Stats = function(){
	this.time = Math.round(((((Date.now() - this.then) / 1000) / 60) + 0.00001) * 100) / 100 + this.old_time;
	return this.num_deaths + ", " + this.num_critters_released + ", " + this.time.toFixed(2);
}

Dungeon.prototype.Restart = function(){
	VIEW_SCALE = 4;
	GAME_WIDTH = 160;
	GAME_HEIGHT = 120;

	this.num_deaths = 0;
	this.spells_cast = 0;
	this.then = Date.now();
	this.time = 0;
	this.num_critters_released = 0;
	this.biggest_combo = 0;
	
	Critter.unique_caught = 0;
	var room = this.rooms[this.room_index_y][this.room_index_x];
	room.CreateEntities();
	room.hard_on_bottom = false;
	
	if (is_new_game_plus){
		room.boss.maxHP *= 2;
		room.boss.HP = room.boss.maxHP;
	
		Utils.playSound("gainPower", master_volume, 0);
		room.player.WingMe();
	}
	sky_color = "#88bbff";
	text_color = "#000000";
	this.critter_queue = [];
	stopMusic();
	bg_name = null;
	resource_manager.play_music = true;
	room.hard_on_bottom = false;
	
	this.ResetCheckpoint(room);
	
	this.submitted = false;
	room.Speak("arrow keys and Z to jump\ncollect tiny monkeys\nhold X to shoot them at boss!", 9999);
	room.camera = new Camera(room.camera.x, room.camera.y);
	if (is_new_game_plus)
		room.camera.y_lim = 50;
}

Dungeon.prototype.Clear = function(){
	this.room_index_x = 0;
	this.room_index_y = 0;
	this.rooms = [];
	for (var i = 0; i < this.house_height; i++){
		var row = [];
		for (var j = 0; j < this.house_width; j++){
			row.push(new Room());
		}
		this.rooms.push(row);
	}
	this.old_rooms = [];
	
	var room = this.rooms[this.room_index_y][this.room_index_x];
	this.SetCheckpoint(room);
	room = this.rooms[0][0];
}

Dungeon.prototype.GetRoom = function(){
	return this.rooms[this.room_index_y][this.room_index_x];
}

Dungeon.prototype.ChangeRoom = function(){
	var clone = {};
	clone.vel = {x: room.player.vel.x, y: room.player.vel.y};
	clone.on_ground = room.player.on_ground;
	clone.facing = room.player.facing;
	
	room.player.pressing_down = false;
	room.player.pressed_down = false;
		
	if (this.old_room_index_x != this.room_index_x || this.old_room_index_y != this.room_index_y){
		room = this.GetRoom();		
		
		for (var i = 0; i < room.entities.length; i++){
			room.entities[i].ResetPosition();
		}
	}		
	this.old_room_index_x = this.room_index_x;
	this.old_room_index_y = this.room_index_y;
	
	room.Speak(null);
		
	room.player.facing = clone.facing;
	room.player.vel.x = clone.vel.x;
	room.player.vel.y = clone.vel.y;
	room.player.on_ground = clone.on_ground;
}

Dungeon.prototype.RevivePlayer = function(){
	VIEW_SCALE = 4;
	GAME_WIDTH = 160;
	GAME_HEIGHT = 120;

	this.num_deaths++;
	this.num_hit = 0;

	this.room_index_x = this.checkpoint.room_x;
	this.room_index_y = this.checkpoint.room_y;
	this.old_room_index_x = this.room_index_x;
	this.old_room_index_y = this.room_index_y;
	var maxHP = room.player.maxHP - 1;
	if (maxHP < 3) maxHP = 3;
	room.player = new Player();
	room.player.x = this.checkpoint.x;
	room.player.y = this.checkpoint.y;
	room.player.facing = this.checkpoint.facing;
	room.player.die_to_suffocation = true;
	room.player.maxHP = maxHP;
	room.player.HP = room.player.maxHP;
	console.log("num deaths: " + this.num_deaths);
	room.Speak(null);
	if (is_new_game_plus){
		room.player.WingMe();
		room.camera.y_lim = 50;
	}
	
	this.critter_queue = [];
	room.entities = [];
	for (var i = 0; i < this.timeout_queue.length; i++){
		window.clearInterval(this.timeout_queue[i]);
	}
	this.timeout_queue = [];
	
	var boss = room.boss;
	boss.x = 205 - (boss.rb - 32);
	boss.y = 304 - (boss.bb - 16);
	if (boss.boss_form !== 0){
		boss.boss_form--;
		boss.Transform(delta, room);
	}else{
		room.Speak("arrow keys and Z to jump\ncollect tiny monkeys\nhold X to shoot them at boss!", 9999);
	}
	boss.healing = true;
	
	paused = true;
	pause_text = "YOU HAVE DIED";
}

//CHECKPOINT MANAGEMENT
Dungeon.prototype.ActivateCheckpoint = function(cp){
	this.DeactivateCheckpoints();
	this.checkpoint = {
		id: cp.checkpoint_id,
		x: cp.x, y: cp.y, 
		room_x: this.room_index_x,
		room_y: this.room_index_y,
		facing: room.player.facing
	}
	
	for (var i = 0; i < this.checkpoint_queue.length; i++){
		if (this.checkpoint_queue[i].id === cp.checkpoint_id){
			this.checkpoint_index = i;
			return;
		}
	}
	this.checkpoint_index = this.checkpoint_queue.length;
	this.checkpoint_queue.push({
		id: cp.checkpoint_id,
		x: cp.x, y: cp.y, 
		room_x: this.room_index_x,
		room_y: this.room_index_y,
		facing: room.player.facing
	});
}

Dungeon.prototype.DeactivateCheckpoints = function(){
	for (var i = 0; i < this.house_height; i++){
		for (var j = 0; j < this.house_width; j++){
			var room = this.rooms[i][j];
			for (var k = 0; k < room.entities.length; k++){
				if (room.entities[k].type === "Checkpoint"){
					room.entities[k].Deactivate();
				}
			}
		}
	}
}
