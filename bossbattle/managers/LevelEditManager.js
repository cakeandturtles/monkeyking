var level_edit_mouse_down = false;
var level_edit_object;
var level_edit_object_is_tile = false;
var level_edit_tileset_ctx;
var level_edit_tile_glitch_type = -1;

var level_edit_tile_img_x = 0;
var level_edit_tile_img_y = 0;

function InitLevelEdit(){
	if ($("level_edit_objects") === null) return;
	
	$("level_edit_objects").style.visibility="visible";
	$("etc_options").style.visibility="visible";
	
	level_edit_tileset_ctx = $("tileset_canvas").getContext("2d");
	level_edit = true;
	
	ledit_options("tile");
	ledit_select($("tile_solid"), Tile.SOLID);
}

function DisableLevelEdit(){
	$("level_edit_objects").style.visibility="hidden";
	//$("level_edit_buttons").style.display="none";
	$("etc_options").style.visibility="hidden";
	level_edit = false;
}

function ledit_clear_dungeon(){
	room_manager.Clear();
	room_manager.room_index_x = 0;
	room_manager.room_index_y = 0;
	room_manager.ResetCheckpoint(room);
	room_manager.SetupOldRooms(true, false);
	room_manager.SetupOldRooms(true, true);
	room_manager.beat_game = false;
	room_manager.Restart();
	room = room_manager.GetRoom();
}

function ledit_save_dungeon(){
}

function ledit_load_dungeon(){
}

function DrawLevelEditGrid(ctx, room){
	return;
	
	var color = "#000000";
	
	var ax = (-room.camera.x + room.camera.screen_offset_x) % Tile.WIDTH;
	var ay = (-room.camera.y + room.camera.screen_offset_y) % Tile.HEIGHT;
	for (var i = 1; i < ~~(GAME_WIDTH/Tile.WIDTH)+1; i++){
		drawLine(ctx, color, ax+ i * Tile.WIDTH, 0, ax + i * Tile.WIDTH, room.SCREEN_HEIGHT, 0.5);
	}
	
	for (var i = 1; i < ~~(GAME_HEIGHT/Tile.HEIGHT)+1; i++){
		drawLine(ctx, color, 0, ay + i * Tile.HEIGHT, room.SCREEN_WIDTH, ay + i * Tile.HEIGHT, 0.5);
	}
}

function TileSetMouseDown(e){
	if(!level_edit) return;
	
	e.preventDefault();
	var box = $("tileset_canvas").getBoundingClientRect();
	var x = (e.clientX - box.left);
	var y = (e.clientY - box.top);
	var tile_x = Math.floor(x / Tile.WIDTH);
	var tile_y = Math.floor(y / Tile.HEIGHT);
	LeditSetTileImage(tile_x, tile_y);
}

function LeditSetTileImage(tile_x, tile_y){
	level_edit_tile_img_x = tile_x;
	level_edit_tile_img_y = tile_y;
	
	level_edit_tileset_ctx.canvas.width = level_edit_tileset_ctx.canvas.width;
	
	level_edit_tileset_ctx.lineWidth="1";
	level_edit_tileset_ctx.strokeStyle = "#ffffff";
	level_edit_tileset_ctx.rect(tile_x * Tile.WIDTH, tile_y * Tile.HEIGHT, Tile.WIDTH, Tile.HEIGHT);
	level_edit_tileset_ctx.stroke();
}

function LevelEditMouseDown(e){
	if (!level_edit) return;
	e.preventDefault();
	level_edit_mouse_down = true;
	var box = canvas.getBoundingClientRect();
	
	var x = (e.clientX - box.left) / VIEW_SCALE + room.camera.x - room.camera.screen_offset_x;
	var y = (e.clientY - box.top) / VIEW_SCALE + room.camera.y - room.camera.screen_offset_y;
	var tile_x = Math.floor(x / Tile.WIDTH);
	var tile_y = Math.floor(y / Tile.HEIGHT);
	
	if (level_edit_object_is_tile){
		var tile = room.tiles[tile_y][tile_x];
		tile.kill_player = false;
		tile.tileset_x = level_edit_tile_img_x;
		tile.tileset_y = level_edit_tile_img_y;
		if (e.which === 3 && e.button === 2){ //RIGHT CLICK. REMOVE Tile
			tile.glitch_type = level_edit_tile_glitch_type = -1;
			tile.collision = Tile.GHOST;
			tile.tileset_x = 0;
			tile.tileset_y = 0;
		}else{
			tile.glitch_type = level_edit_tile_glitch_type;
		
			switch (level_edit_object){
				case Tile.SOLID:
					tile.collision = Tile.SOLID;
					break;
				case Tile.SUPER_SOLID:
					tile.collision = Tile.SUPER_SOLID;
					break;
				case Tile.FALLTHROUGH:
					tile.collision = Tile.FALLTHROUGH;
					break;
				case Tile.KILL_PLAYER:
					tile.collision = Tile.KILL_PLAYER;
					tile.kill_player = true;
					break;
				default:
					tile.collision = Tile.GHOST;
					break;
			}
		}
	}
	else{
		if (e.which === 3 && e.button === 2){ //RIGHT CLICK. REMOVE OBJ IF UNDER
			for (var i = room.entities.length-1; i >= 0; i--){
				if (room.entities[i].IsPointColliding(x, y)){
					room.entities.splice(i, 1);
				}
			}
		}
		else if (level_edit_object == 'player'){
			room.player.x = x - (room.player.rb/2);
			room.player.y = y - room.player.bb;
			room.player.stuck_in_wall = false;
			room.player.die_to_suffocation = true;
		}
		else{
			x = tile_x * Tile.WIDTH;
			y = tile_y * Tile.HEIGHT;
			var obj = null;
			if (level_edit_object !== "object")
				obj = eval(level_edit_object);
			else
				obj = eval(ledit_getSelected('object_options'));
			obj.x = x;
			obj.y = y;
			obj.original_x = x;
			obj.original_y = y;
			
			if (level_edit_object === "new NPC(0, 0, 0)"){
				obj.speech = $("ledit_npc_speech").value;
			}
			else if (level_edit_object === "new Collection(0, 0)"){
				obj.collection_id = parseInt(ledit_getSelected("object_options"));
				var ani_x = Math.floor(obj.collection_id / 6) * 2;
				var ani_y = obj.collection_id % 6;
				obj.animation.Change(ani_x, ani_y, 2);
			}
			else if (ledit_getSelected('object_options') === "new Door(0, 0, 0, 0, 0)"){
				obj.room_x = parseInt($("ledit_room_x").value);
				obj.room_y = parseInt($("ledit_room_y").value);
				obj.door_id = parseInt($("ledit_door_id").value);
			}
			else if (ledit_getSelected('object_options') === "new Door(0, 0, 0, 0, 0, true, 0)"){
				obj.room_x = parseInt($("ledit_room_x").value);
				obj.room_y = parseInt($("ledit_room_y").value);
				obj.door_id = parseInt($("ledit_door_id").value);
				obj.num_artifacts = parseInt($("ledit_num_artifacts").value);
			}
			else if (ledit_getSelected('object_options') === "new Checkpoint(0, 0)"){
			}
			else if (level_edit_object === "new Enemy(0, 0)"){
				obj.enemy_id = parseInt(ledit_getSelected("object_options"));
				obj.GlitchMe();
			}
			
			room.entities.push(obj);
			
			room_manager.SetupOldRooms(false, room.is_glitched);
		}
	}
}

function LevelEditMouseMove(e){
	if (!level_edit) return;
	if (level_edit_mouse_down && level_edit_object_is_tile){
		LevelEditMouseDown(e);
	}
}

function LevelEditMouseUp(e){
	if (!level_edit) return;
	
	level_edit_mouse_down = false;
}

function ledit_change_room_size(){
	room.ChangeSize($("room_width").value, $("room_height").value);
}

function ledit_change_glitch(){
	room.glitch_sequence = [eval(ledit_getSelected("glitch_options"))];
	room.glitch_index = 0;
	room.glitch_type = room.glitch_sequence[0];
	Glitch.TransformPlayer(room, room.glitch_type);
}

function ledit_add_glitch(){
	room.glitch_sequence.push(eval(ledit_getSelected("glitch_options")));
	room.glitch_index = 0;
	room.glitch_time = 0;
}

function ledit_export_room(){
	$("level_edit_export_text").value = JSON.stringify(room.Export());
}

function ledit_import_room(){
	var obj_str = $("level_edit_export_text").value;
	try{
		if (obj_str !== null && obj_str !== ""){
			room.Import(JSON.parse(obj_str));
		}
	}catch(e){
		console.log(e);
	}
}

function ledit_clear_room(){
	room = new Room();
	$("room_width").value = room.SCREEN_WIDTH;
	$("room_height").value = room.SCREEN_HEIGHT;
}

function ledit_getSelected(drop_down){
	var e = $(drop_down);
	return e.options[e.selectedIndex].value;
}

function ledit_select(box, obj_type){
	level_edit_mouse_down = false;
	$("tileset_canvas").style.display="none";

	var selected = Utils.getElementsByClass("selected_object_box");
	if (selected.length > 0){
		selected[0].className = "object_box";
	}

	box.className = "selected_object_box";
	
	level_edit_object_is_tile = false;
	switch (obj_type){
		case Tile.SOLID: 
			level_edit_object_is_tile = true;
			break;
		default:
			level_edit_object = obj_type;
			break;
	}
	
	if (level_edit_object_is_tile){
		$("tileset_canvas").style.display="block";
	}
}

function ledit_options(object){
	level_edit_tile_glitch_type = -1;

	switch (object){
		case "npc":
			$("object_option_box").innerHTML = "<br/>Speech:<br/>" +
				"<textarea style='width:128px;height:48px;' id='ledit_npc_speech' maxlength='60'></textarea>";
			break;
		case "collection":
			$("object_option_box").innerHTML = "<br/>Item:<br/>" + 
			"<select id='object_options'>" +
				"<option value='0'>Grimoire</option>" + 
				"<option value='1'>Feather Spell</option>" + 
				"<option value='2'>Floor Spell</option>" + 
				"<option value='3'>Invis Spell</option>" + 
				"<option value='4'>Wall Spell</option>" + 
				"<option value='5'>undefined</option>" + 
				"<option value='6'>Gravity Spell</option>" + 
				"<option value='7'>Memory Spell</option>" + 
				"<option value='8'>Custom Spell</option>" + 
				"<option value='9'>End Game Hat</option>" + 
				"<option value='10'>Sword</option>" + 
				"<option value='11'>Shield</option>" + 
				"<option value='12'>Grimoire--</option>" + 
				"<option value='13'>Grimoire++</option>" + 
				"<option value='15'>Multiglitch</option>" + 
				"<option value='14'>Checkpoint++</option>" + 
			"</select>";
			break;
		case "object":
			$("object_option_box").innerHTML = "<br/>Object Type:<br/>" +
			"<select id='object_options'>" +
				"<option value='new Door(0, 0, 0, 0, 0)'>Door</option>" + 
				"<option value='new Door(0, 0, 0, 0, 0, true, 0)'>Door (Lock)</option>" + 
				"<option value='new Checkpoint(0, 0)'>CheckPoint</option>" + 
			"</select><div id='object_option_box_2'></div>";
			$("object_options").onchange = function(){
				if ($("object_object").className == "selected_object_box"){
					ledit_select($("object_object"), ledit_getSelected("object_options"));
					ledit_edit_object_options();
				}
			}
			ledit_edit_object_options();
			break;
		case "enemy":
			$("object_option_box").innerHTML = "<br/>Enemy Type:<br/>" + 
			"<select id='object_options'>" +
				"<option value='0'>Floor Enemy</option>" + 
				"<option value='1'>Air Enemy</option>" +
			"</select>";
			break;
		case "tile":
			$("object_option_box").innerHTML = "<br/>Collision:<br/>" + 
			"<select id='object_options' onchange='ledit_getSelectedTile();'>" +
				"<option value='Tile.SOLID'>Solid</option>" + 
				"<option value='Tile.FALLTHROUGH'>Fallthrough</option>" + 
				"<option value='Tile.KILL_PLAYER'>Deadly</option>" + 
				"<option value='Tile.SUPER_SOLID'>Super Solid</option>" + 
				"<option value='Tile.GHOST'>Ghost</option>" + 
			"</select>";
			ledit_getSelectedTile();
			break;
		case "glitch_tile":
			$("object_option_box").innerHTML = "<br/>Collision:<br/>" + 
			"<select id='object_options' onchange='ledit_getSelectedTile();'>" +
				"<option value='Tile.SOLID'>Solid</option>" + 
				"<option value='Tile.FALLTHROUGH'>Fallthrough</option>" + 
				"<option value='Tile.KILL_PLAYER'>Deadly</option>" + 
				"<option value='Tile.SUPER_SOLID'>Super Solid</option>" + 
				"<option value='Tile.GHOST'>Ghost</option>" + 
			"</select><br/>" +
			"<select id='object_options2' onchange='ledit_getSelectedGlitch();'>" +
				"<option value='Glitch.GREY'>NONE</option>" + 
				"<option value='Glitch.GREEN'>FEATHER</option>" + 
				"<option value='Glitch.RED'>FLOOR</option>" + 
				"<option value='Glitch.ZERO'>INVIS</option>" + 
				"<option value='Glitch.GOLD'>WALL</option>" + 
				"<option value='Glitch.NEGATIVE'>WALKTHRUWALLS</option>" + 
				"<option value='Glitch.BLUE'>GRAVITY</option>" + 
				"<option value='Glitch.PINK'>MEMORY</option>" +
			"</select>";
			ledit_getSelectedTile();
			ledit_getSelectedGlitch();
			break;
		default: 
			$("object_option_box").innerHTML = "";
			break;
	}
}

function ledit_getSelectedTile(){
	switch (ledit_getSelected("object_options")){
		case "Tile.SOLID":
			level_edit_object = Tile.SOLID;
			LeditSetTileImage(0, 1);
			break;
		case "Tile.SUPER_SOLID":
			level_edit_object = Tile.SUPER_SOLID;
			LeditSetTileImage(1, 1);
			break;
		case "Tile.FALLTHROUGH":
			level_edit_object = Tile.FALLTHROUGH;
			LeditSetTileImage(2, 1);
			break;
		case "Tile.KILL_PLAYER":
			level_edit_object = Tile.KILL_PLAYER;
			LeditSetTileImage(0, 3);
			break;
		case "Tile.GHOST":
			level_edit_object = Tile.GHOST;
			LeditSetTileImage(0, 0);
			break;
		default: break;
	}
}

function ledit_getSelectedGlitch(){
	level_edit_tile_glitch_type = parseInt(eval(ledit_getSelected("object_options2")));
}

function ledit_edit_object_options(){
	var obj = ledit_getSelected("object_options");
	var text = "";
	switch (obj){
		case "new Door(0, 0, 0, 0, 0)":
			text += "<br/>&nbsp;&nbsp;Room X:<input id='ledit_room_x' type='text' value='0' style='width:32px;'><br/>" + 
					"&nbsp;&nbsp;Room Y:<input id='ledit_room_y' type='text' value='0' style='width:32px;'><br/>" + 
					"&nbsp;&nbsp;DoorID:<input id='ledit_door_id' type='text' value='0' style='width:32px;'><br/>";
			break;
		case "new Door(0, 0, 0, 0, 0, true, 0)":
			text += "<br/>&nbsp;&nbsp;Room X:<input id='ledit_room_x' type='text' value='0' style='width:32px;'><br/>" + 
					"&nbsp;&nbsp;Room Y:<input id='ledit_room_y' type='text' value='0' style='width:32px;'><br/>" + 
					"&nbsp;&nbsp;DoorID:<input id='ledit_door_id' type='text' value='0' style='width:32px;'><br/>" + 
					"# Spells:<input id='ledit_num_artifacts' type='text' value='2' style='width:32px;'>";
			break;
		case "new Checkpoint(0, 0)":
			break;
		default: break;
	}
		
	$("object_option_box_2").innerHTML = text;
}