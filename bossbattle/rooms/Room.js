function Room(){
	this.SCREEN_WIDTH = GAME_WIDTH;
	this.SCREEN_HEIGHT = GAME_HEIGHT;
	
	this.MAP_WIDTH = ~~(GAME_WIDTH / Tile.WIDTH);
	this.MAP_HEIGHT = ~~(GAME_HEIGHT / Tile.HEIGHT);
	
	this.spoken_text = "";
	this.speech_timer = 0;
	this.speech_time_limit = 0;
	
	this.critter_time = 0;
	this.critter_time_limit = 100;
	
	this.tilesheet_name = "tile_sheet";
	this.camera = new Camera();
	this.CreateEntities();
	this.InitializeTiles();
	this.hard_on_bottom = false;
}

Room.prototype.CreateEntities = function(){
	this.player = new Player(64, 320);
	this.boss = new Boss(205, 320);
	this.entities = [];
	this.entity_queue = [];
}

Room.prototype.InitializeTiles = function(){
	this.tiles = [];
	for (var i = 0; i < this.MAP_HEIGHT; i++){
		this.tiles[i] = [];
		for (var j = 0; j < this.MAP_WIDTH; j++){
			this.tiles[i].push(new Tile(j * Tile.WIDTH, i * Tile.HEIGHT));
		}
	}
	
	//make the top and bottom row solid
	for (var j = 0; j < this.MAP_WIDTH; j++){
		this.tiles[0][j].collision = Tile.SOLID;
		this.tiles[0][j].tileset_y = 1;
		
		this.tiles[this.MAP_HEIGHT-1][j].collision = Tile.SOLID;
		this.tiles[this.MAP_HEIGHT-1][j].tileset_y = 1;
	}
	
	//make left and right rows solid
	for (var i = 0; i < this.MAP_HEIGHT; i++){
		this.tiles[i][0].collision = Tile.SOLID;
		this.tiles[i][0].tileset_y = 1;
		
		this.tiles[i][this.MAP_WIDTH-1].collision = Tile.SOLID;
		this.tiles[i][this.MAP_WIDTH-1].tileset_y = 1;
	}
}

Room.prototype.isValidTile = function(i, j){
	return !(i < 0 || i >= this.MAP_HEIGHT || j < 0 || j >= this.MAP_WIDTH);
}

Room.prototype.Update = function(input, delta){
	this.SpawnCritters();

	input.Update(this.player);
	this.player.Update(delta, this);
	this.boss.Update(delta, this);
	this.TryUpdateRoomIfPlayerOffscreen();
	this.camera.Update(delta, this);
	
	for (var i = this.entities.length-1; i >= 0; i--){
		this.entities[i].Update(delta, this);
	}
	
	for (var i = this.entities.length-1; i >= 0; i--){
		if (this.entities[i].delete_me) this.entities.splice(i, 1);
	}
	
	for (var i = 0; i < this.entity_queue.length; i++){
		this.entities.push(this.entity_queue[i]);
	}
	this.entity_queue = [];
}

Room.prototype.SpawnCritters = function(){
	this.critter_time++;
	if (this.critter_time < this.critter_time_limit/(this.boss.boss_form+1))
		return;
	this.critter_time = 0;

	var critter_count = 0;
	for (var i = 0; i < this.entities.length; i++){
		if (this.entities[i].type === "Critter")
			critter_count++;
	}
	var total_critter_count = critter_count;
	total_critter_count += room_manager.critter_queue.length;
	
	if (total_critter_count < room_manager.critter_capacity && critter_count < room_manager.room_critter_capacity){
		var x = Math.floor((Math.random()*(this.MAP_WIDTH-16)*Tile.WIDTH)) + (7 * Tile.WIDTH);
		if (this.boss.boss_form < 4 || this.boss.boss_form === 99)
			this.entities.push(new Critter(x, 64, 0, false));
		else{
			var y = Math.floor(Math.random()*128);
			this.entities.push(new Critter(x, y, 0, true));
		}
	}
}

Room.prototype.TryUpdateRoomIfPlayerOffscreen = function(){
	//OFFSCREEN TOP
	/*if (this.player.y + this.player.bb <= 0){
		room_manager.room_index_y--;
		if (room_manager.room_index_y < 0) room_manager.room_index_y = room_manager.house_height - 1;
		
		room_manager.ChangeRoom();
		
		room.player.x = (this.player.x / (this.MAP_WIDTH * Tile.WIDTH)) * room.MAP_WIDTH * Tile.WIDTH;
		room.player.y = room.MAP_HEIGHT * Tile.HEIGHT - Tile.HEIGHT - room.player.bb;
	}
	//OFFSCREEN BOTTOM
	else if (this.player.y + this.player.tb >= (this.MAP_HEIGHT * Tile.HEIGHT)){
		room_manager.room_index_y++;
		if (room_manager.room_index_y >= room_manager.house_height) room_manager.room_index_y = 0;
		
		room_manager.ChangeRoom();
		
		room.player.x = (this.player.x / (this.MAP_WIDTH * Tile.WIDTH)) * room.MAP_WIDTH * Tile.WIDTH;
		room.player.y = 0 + Tile.HEIGHT/2 + room.player.tb;
	}*/
	
	//OFFSCREEN LEFT
	if (this.player.x <= 14){
		room.player.x = 14 + Tile.WIDTH/2 - room.player.lb;
	}
	//OFFSCREEN RIGHT
	else if (this.player.x + 16 + Tile.WIDTH >= (this.MAP_WIDTH * Tile.WIDTH)){
		room.player.x = -24 + room.MAP_WIDTH * Tile.WIDTH - Tile.WIDTH/2 - room.player.rb;
	}
	
	if (level_edit) $("house_coordinates").innerHTML = room_manager.room_index_x + " " + room_manager.room_index_y;
}

Room.prototype.Speak = function(text, speech_time, hard_on_bottom){
	hard_on_bottom = defaultValue(hard_on_bottom, false);
	this.spoken_text = text;
	this.speech_time = 0;
	this.speech_time_limit = speech_time || 240;
	this.hard_on_bottom = hard_on_bottom;
}

Room.prototype.RenderSpeech = function(ctx, on_bottom, hard_on_bottom){
	on_bottom = defaultValue(on_bottom, false);
	hard_on_bottom = defaultValue(hard_on_bottom, false);
	
	var speech_height = 32;

	if (this.spoken_text != null && this.spoken_text.length > 0){
		this.speech_timer+=(delta/DNUM);
		if (this.speech_timer > this.speech_time_limit && this.boss.boss_form !== 5){
			this.speech_timer = 0;
			this.Speak(null);
			return;
		}
		
		var h = 0; 
		if (!hard_on_bottom && !on_bottom && this.player.y+(this.player.bb/2) >= GAME_HEIGHT/2)
			h = (-1)*(GAME_HEIGHT/1.5)+Tile.HEIGHT + 8;
		
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(Tile.WIDTH, h + GAME_HEIGHT-(Tile.HEIGHT)-speech_height, GAME_WIDTH-(Tile.WIDTH*2), speech_height);
		ctx.fillStyle = "#000000";
		ctx.fillRect(Tile.WIDTH+2, h + GAME_HEIGHT-(Tile.HEIGHT)-speech_height+2, GAME_WIDTH-(Tile.WIDTH*2)-4, speech_height-4);
	
		var fs = 8;
		ctx.font = fs + "px pixelFont";
		ctx.fillStyle = "#ffffff";
		ctx.strokeStyle = "#ffffff";
		var texts = this.spoken_text.split("\n");
		for (var i = 0; i < texts.length; i++){
			if (!(/^((?!chrome).)*safari/i.test(navigator.userAgent))){
				ctx.fillText(texts[i], Tile.WIDTH*2, h + (fs*i)+GAME_HEIGHT+(Tile.HEIGHT/2)-speech_height, GAME_WIDTH-(Tile.WIDTH*2), fs);
			}else if (check_textRenderContext(ctx)){
				ctx.strokeText(texts[i], Tile.WIDTH*2, h + (fs*i)+GAME_HEIGHT+(Tile.HEIGHT/2)-speech_height - 8, fs-2);
			}
		}
	}
}

Room.prototype.Render = function(ctx, level_edit){
	//SORT ENTITIES BY Z INDEX (descending)
	var entities = this.entities.slice(0);
	entities.push(this.player);
	//entities.push(this.boss);
	entities.sort(GameObject.ZIndexSort);
	var index = 0;

	//DRAW ENTITIES WITH Z INDEX GREATER THAN 10 UNDER TILES
	while (entities[index].z_index > 10){
		entities[index].Render(ctx, this.camera);
		index++;
	}

	//DRAW THE TILES OF THE ROOM
	var left_tile = Math.floor((this.camera.x - 1) / Tile.WIDTH);
	var right_tile = Math.ceil((this.camera.x + this.camera.width + 1) / Tile.WIDTH);
	var top_tile = Math.floor((this.camera.y - 1) / Tile.HEIGHT);
	var bottom_tile = Math.ceil((this.camera.y + this.camera.height + 1) / Tile.HEIGHT);
	
	var tile_img = resource_manager[this.tilesheet_name];
	for (var i = top_tile; i < bottom_tile; i++){ 
		for (var j = left_tile; j < right_tile; j++){
			if (!this.isValidTile(i, j)) continue;
			var tile = this.tiles[i][j];
			tile.Render(ctx, this.camera, tile_img);
	} }
	if (level_edit) DrawLevelEditGrid(ctx, this);
	
	room.boss.Render(ctx, this.camera);
	this.RenderSpeech(ctx, false, this.hard_on_bottom);
	
	//DRAW THE REMAINING ENTITIES
	for (var i = index; i < entities.length; i++){
		entities[i].Render(ctx, this.camera);
	}
}

/********************OTHER LEVEL EDITING FUNCTIONS********************/
Room.prototype.ChangeSize = function(width, height){
	var old_width = this.MAP_WIDTH;
	var old_height = this.MAP_HEIGHT;
	this.MAP_WIDTH = ~~(width / Tile.WIDTH);
	this.MAP_HEIGHT = ~~(height / Tile.HEIGHT);
	
	if (this.MAP_WIDTH * Tile.WIDTH < this.SCREEN_WIDTH)
		this.camera.screen_offset_x = (this.SCREEN_WIDTH - (this.MAP_WIDTH * Tile.WIDTH))/2;
	else this.camera.screen_offset_x = 0;
	if (this.MAP_HEIGHT * Tile.HEIGHT < this.SCREEN_HEIGHT)
		this.camera.screen_offset_y = (this.SCREEN_HEIGHT-(this.MAP_HEIGHT*Tile.HEIGHT))/2;
	else this.camera.screen_offset_y = 0;

	var temp_tiles = this.tiles;
	this.InitializeTiles();
	
	for (var i = 0; i < this.MAP_HEIGHT; i++){
		if (i >= old_height) this.tiles[i] = [];
		for (var j = 0; j < this.MAP_WIDTH; j++){
			if (i >= old_height) 
				this.tiles[i].push(new Tile(j * Tile.WIDTH, i * Tile.HEIGHT));
			else if (j >= old_width)
				this.tiles[i].push(new Tile(j * Tile.WIDTH, i * Tile.HEIGHT));
			else this.tiles[i][j] = temp_tiles[i][j];
		}
	}
}

Room.prototype.GetDoor = function(door_id, door){
	for (var i = 0; i < this.entities.length; i++){
		if (this.entities[i].type === "Door"){
			if (this.entities[i].door_id == door_id && this.entities[i] !== door)
				return this.entities[i];
		}
	}
	return null;
}

/************************EXPORTING AND IMPORTING FUNCTIONS************/
Room.prototype.Export = function(){
	var entities = [], tiles = [];
	for (var i = 0; i < this.entities.length; i++){
		if (this.entities[i].export_me){
			entities.push({type: this.entities[i].type, obj: this.entities[i].Export()});
		}
	}
	for (var i = 0; i < this.tiles.length; i++){
		var row = [];
		for (var j = 0; j < this.tiles[i].length; j++){
			row.push(this.tiles[i][j].Export());
		}
		tiles.push(row);
	}

	return {
		width: this.MAP_WIDTH*Tile.WIDTH
		,height: this.MAP_HEIGHT*Tile.HEIGHT
		,player: {type: "Player", obj: this.player.Export()}
		,entities: entities
		,tiles: tiles
	};
}

Room.ImportAsync = function(file_name, callback){
	Utils.readTextFileAsync(file_name, function(obj_str){
		var room = new Room();
		if (obj_str !== null && obj_str !== ""){
			room.Import(JSON.parse(obj_str));
		}
		callback(room);
	});
}

Room.prototype.Import = function(room){
	this.ChangeSize(room.width, room.height);
	this.player = new Player(); this.player.Import(room.player.obj);
	
	//import entities
	this.entities = [];
	if (room.entities){
		for (var i = 0; i < room.entities.length; i++){
			var entity = eval("new " + room.entities[i].type + "();");
			entity.Import(room.entities[i].obj);
			this.entities.push(entity);
		}
	}
	
	//Import tiles!!!
	this.tiles = [];
	this.MAP_WIDTH = room.tiles[0].length;
	this.MAP_HEIGHT = room.tiles.length;
	for (var i = 0; i < room.tiles.length; i++){
		var row = [];
		for (var j = 0; j < room.tiles[i].length; j++){
			var tile = new Tile(j*Tile.WIDTH, i*Tile.HEIGHT); tile.Import(room.tiles[i][j]);
			row.push(tile);
		}
		this.tiles.push(row);
	}
}
