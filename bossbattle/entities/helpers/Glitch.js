Glitch.GREY = 0;
Glitch.RED = 1;
Glitch.GREEN = 2;
Glitch.ZERO = 3;
Glitch.BLUE = 4;
Glitch.GOLD = 5;
Glitch.NEGATIVE = 6;
Glitch.PINK = 7;

Glitch.PREVIOUS = 0;

function Glitch(){};

Glitch.TransformPlayer = function(map, glitch_type, normalize, only_visual, only_tile){
	var die_to_suffocation = false;
	if (Glitch.PREVIOUS === Glitch.NEGATIVE){
		die_to_suffocation = true;
	}
	Glitch.PREVIOUS = glitch_type;
	if (glitch_type === Glitch.NEGATIVE){
		die_to_suffocation = false;
		map.player.stuck_in_wall = false;
	}
	if (room_manager) room_manager.glitch_type = glitch_type;
	normalize = defaultValue(normalize, true);
	only_visual = only_visual || false;
	only_tile = only_tile || false;
	
	//Normalize the player before transforming
	if (normalize){
		room_manager.multi_glitch = false;
		var facing = map.player.facing;
		var vel = map.player.vel;
		var is_jumping = map.player.is_jumping;
		var jump_timer = map.player.jump_timer;
		var jump_time_limit = map.player.jump_time_limit;
		var on_ground = map.player.on_ground;
		var stuck_in_wall = map.player.stuck_in_wall;
		map.player = new Player(map.player.x, map.player.y);
		map.player.die_to_suffocation = die_to_suffocation;
		map.player.stuck_in_wall = stuck_in_wall;
		map.player.facing = facing;
		map.player.vel = vel;
		map.player.is_jumping = is_jumping;
		map.player.jump_timer = jump_timer;
		map.player.jump_time_limit = jump_time_limit;
		map.player.on_ground = on_ground;
		if (map.player.is_jumping)
			map.player.grav_acc = map.player.float_grav_acc;
		//map.player.grav_acc = grav_acc;
		if (map.glitch_type != Glitch.RED){
			map.player.on_ground = false;
		}
		map.player.was_on_ground = true;

		map.tilesheet_name = "tile_grey_sheet";
	}

	var oldbb = map.player.bb;
	switch (glitch_type){
		case Glitch.GREY:
			map.player.img_name = "player_grey_sheet";
			map.tilesheet_name = "tile_grey_sheet";
			break;
		case Glitch.RED:
			Glitch.RedTransform(map, map.player, only_visual, only_tile);
			break;
		case Glitch.GREEN:
			Glitch.GreenTransform(map, map.player, only_visual, only_tile);
			break;
		case Glitch.BLUE:
			Glitch.BlueTransform(map, map.player, only_visual, only_tile);
			break;
		case Glitch.GOLD:
			Glitch.GoldTransform(map, map.player, only_visual, only_tile);
			break;
		case Glitch.ZERO:
			Glitch.ZeroTransform(map, map.player, only_visual, only_tile);
			break;
		case Glitch.NEGATIVE:
			Glitch.NegativeTransform(map, map.player, only_visual, only_tile);
			break;
		case Glitch.PINK:
			Glitch.PinkTransform(map, map.player, only_visual, only_tile);
			break;
		default: break;
	}

	map.player.y += oldbb - map.player.bb;
	map.player.image = eval("resource_manager." + map.player.img_name);
}
extend(GameSprite, Glitch);

Glitch.GlitchToTilesheet = function(glitch_type){
	switch (glitch_type){
		case Glitch.GREY:
			return resource_manager.tile_grey_sheet;
		case Glitch.RED:
			return resource_manager.tile_red_sheet;
		case Glitch.GREEN:
			return resource_manager.tile_green_sheet;
		case Glitch.BLUE:
			return resource_manager.tile_blue_sheet;
		case Glitch.GOLD:
			return resource_manager.tile_gold_sheet;
		case Glitch.ZERO:
			return resource_manager.tile_zero_sheet;
		case Glitch.NEGATIVE:
			return resource_manager.tile_negative_sheet;
		case Glitch.PINK:
			return resource_manager.tile_pink_sheet;
	}
}

//******GLITCH TRANSFORMATION DEFINTIIONS***************************/
Glitch.RedTransform = function(map, player, only_visual, only_tile){
	if (!only_tile) player.img_name = "player_red_sheet";
	if (only_visual) return;
	map.tilesheet_name = "tile_red_sheet";
	if (only_tile) return;
			
	player.ResetGroundCollision = function(){};
}

Glitch.GreenTransform = function(map, player, only_visual, only_tile){
	if (!only_tile) player.img_name = "player_green_sheet";
	if (only_visual) return;
	map.tilesheet_name = "tile_green_sheet";
	if (only_tile) return;
	
	player.gnd_run_acc = player.max_run_vel/10.0;
	player.gnd_run_dec = player.max_run_vel/100.0;
	player.air_run_acc = player.max_run_vel/10.0;
	player.air_run_dec = player.max_run_vel/100.0;
	
	player.terminal_vel = 1.0;
	player.original_grav_acc = 0.2;
	player.float_grav_acc = 0.2;
	player.grav_acc = player.original_grav_acc;
	player.jump_vel = 2.6;
	player.dbl_jump = false;
	
	player.ResetHorizontalVelocity = function(mult){};
	
	player.StartJump = function(){
		if (!this.dbl_jump){
			Utils.playSound("jump");
			this.vel.y = -this.jump_vel;
			this.is_jumping = true;
			this.jump_timer = 0;
			if (!this.on_ground)
				this.dbl_jump = true;
			this.on_ground = false;
		}
	}
	
	player.LandOnGround = function(){
		this.dbl_jump = false;
	}
}

Glitch.ZeroTransform = function(map, player, only_visual, only_tile){
	if (!only_tile) player.img_name = "player_zero_sheet";
	if (only_visual) return;
	map.tilesheet_name = "tile_zero_sheet";
	if (only_tile) return;
	
	player.DieToSpikesAndStuff = function(){}
}

Glitch.BlueTransform = function(map, player, only_visual, only_tile){
	if (!only_tile) player.img_name = "player_blue_sheet";
	if (only_visual) return;
	map.tilesheet_name = "tile_blue_sheet";
	if (only_tile) return;
	
	player.tb = 0;
	player.bb = 14;
	
	player.ApplyGravity = function(delta, map)
	{
		if (!this.on_ground){
			if (this.vel.y > -this.terminal_vel)
			{
				this.vel.y -= (this.grav_acc) * (delta/DNUM);
				if (this.vel.y < -this.terminal_vel) 
					this.vel.y = -this.terminal_vel;
			}else if (this.vel.y < -this.terminal_vel){
				this.vel.y += (this.grav_acc) * (delta/DNUM);
				if (this.vel.y > -this.terminal_vel)
					this.vel.y = -this.terminal_vel;
			}
		}else{ this.vel.y = 0; }
	}
		
	player.HandleVerticalCollisions = function(map, left_tile, right_tile, top_tile, bottom_tile, q){
		//Check all potentially colliding tiles
		for (var i = top_tile; i <= bottom_tile; i++){
			for (var j = left_tile; j <= right_tile; j++){
				if (!map.isValidTile(i, j)) continue;
				var tile = map.tiles[i][j];
				//don't check for collisions if potential tile is "out of bounds" or not solid
				if (tile.collision == Tile.GHOST || tile.collision == Tile.KILL_PLAYER) continue;
				
				var top_collision = false;
				var old_y = this.y;
				
				//Check for top collisions
				if (this.vel.y <= 0 && this.IsRectColliding(tile, this.x + this.lb + q, this.y + this.tb + this.vel.y-1, this.x + this.rb - q, this.y + this.tb)){
					//Don't count bottom collision for fallthrough platforms if we're not at the top of it
					if (tile.collision == Tile.FALLTHROUGH && (tile.y + Tile.HEIGHT > this.y || this.pressing_down))
						continue;
				
					this.vel.y = 0;
					this.y = tile.y + Tile.HEIGHT - this.tb;
					
					if (!this.played_land_sound){
						Utils.playSound("land");
						this.played_land_sound = true;
					}
					this.LandOnGround();
					top_collision = true;
					this.on_ground = true;
					this.has_double_jumped = false;
				}
				
				//Check for bottom collisions
				if (this.vel.y > 0 && tile.collision != Tile.FALLTHROUGH && this.IsRectColliding(tile, this.x + this.lb + q, this.y + this.bb, this.x + this.rb - q, this.y + this.bb + this.vel.y + 1)){
					this.vel.y = 0;
					if (top_collision) this.y = old_y
					else this.y = tile.y - this.bb;
				}
			}
		}
	}
	
	
	player.StartJump = function(){
		if (this.on_ground){
			Utils.playSound("jump");
			this.vel.y = this.jump_vel;
			this.is_jumping = true;
			this.jump_timer = 0;
			this.on_ground = false;
		}
	}

	player.Jump = function(){
		if (this.is_jumping){
			this.jump_timer+=(delta/DNUM);
			if (this.jump_timer >= this.jump_time_limit){
				this.jump_timer = 0;
				this.is_jumping = false;
				this.grav_acc = this.original_grav_acc;
			}else{
				this.grav_acc = this.float_grav_acc;
				this.vel.y += (this.jump_vel * ((this.jump_time_limit - (this.jump_timer/2)) / (this.jump_time_limit * 60))) * (delta/DNUM);
			}
		}
	}
}

Glitch.GoldTransform = function(map, player, only_visual, only_tile){
	if (!only_tile) player.img_name = "player_gold_sheet";
	if (only_visual) return;
	map.tilesheet_name = "tile_gold_sheet";
	if (only_tile) return;
	
	player.WalkUpWalls = function(){
		if (this.horizontal_collision && this.horizontal_input){
			this.vel.y = -1;
			this.on_ground = true;
			this.move_state = MoveState.RUNNING;
		}
	}
	
	player.UpdateMoveState = function(){
		if (!this.horizontal_collision){
			if (this.vel.y < 0) this.move_state = MoveState.JUMPING;
			else this.move_state = MoveState.FALLING;
		}
	}
}

Glitch.NegativeTransform = function(map, player, only_visual, only_tile){
	if (!only_tile) player.img_name = "player_negative_sheet";
	if (only_visual) return;
	map.tilesheet_name = "tile_negative_sheet";
	if (only_tile) return;
		
	player.HandleHorizontalCollisions = function(map, left_tile, right_tile, top_tile, bottom_tile, q, floor_tile){
		this.horizontal_collision = false;
		//Check all potentially colliding tiles
		for (var i = top_tile; i <= bottom_tile; i++){
			for (var j = left_tile; j <= right_tile; j++){
				if (!map.isValidTile(i, j)) continue;
				var tile = map.tiles[i][j];
				//don't check for collisions if potential tile is "out of bounds" or not solid
				if (tile.collision != Tile.SUPER_SOLID) continue;
				
				//Reset floor tile
				if (floor_tile == null || (tile.y > this.y && Math.abs(tile.x-this.x) < Math.abs(floor_tile.x-this.x))){ 
					floor_tile = tile;
				}
				
				//Check for left collisions
				if (this.vel.x < 0 && this.IsRectColliding(tile, this.x + this.lb + this.vel.x - 1, 
				this.y + this.tb + q, this.x + this.lb, this.y + this.bb - q)){
					//this is a negative slope (don't collide left)
					if (tile.l_height < tile.r_height){}
					//okay we're colliding with a solid to our left
					else{
						this.vel.x = 0;
						this.horizontal_collision = true;
						this.x = tile.x + Tile.WIDTH - this.lb;
					}
				}
				
				//Check for Right collisions
				if (this.vel.x > 0 && this.IsRectColliding(tile, this.x + this.rb, this.y + this.tb + q, this.x + this.rb + this.vel.x + 1, this.y + this.bb - q)){
					//this is a positive slope (don't collide right)
					if (tile.r_height < tile.l_height){}
					//okay we're colliding with a solid to our right
					else{
						this.vel.x = 0;
						this.horizontal_collision = true;
						this.x = tile.x - this.rb;
					}
				}
			}
		}
	}

	player.HandleVerticalCollisions = function(map, left_tile, right_tile, top_tile, bottom_tile, q){
		//Check all potentially colliding tiles
		for (var i = top_tile; i <= bottom_tile; i++){
			for (var j = left_tile; j <= right_tile; j++){
				if (!map.isValidTile(i, j)) continue;
				var tile = map.tiles[i][j];
				//don't check for collisions if potential tile is "out of bounds" or not solid
				if (tile.collision == Tile.GHOST) continue;
				
				//Check for top collisions
				if (this.vel.y <= 0 && tile.collision === Tile.SUPER_SOLID && this.IsRectColliding(tile, this.x + this.lb + q, this.y + this.tb + this.vel.y - 1, this.x + this.rb - q, this.y + this.tb)){
					this.vel.y = 0;
					this.y = tile.y + Tile.HEIGHT - this.tb;
				}
					
				//Check for bottom collisions
				if (this.vel.y >= 0 && this.IsRectColliding(tile, this.x + this.lb + q, this.y + this.bb, this.x + this.rb - q, this.y + this.bb + this.vel.y + 1)){
					//Don't count bottom collision for fallthrough platforms if we're not at the top of it
					if (tile.y < this.y + this.bb || (this.pressing_down && !this.touching_door && tile.collision != Tile.SUPER_SOLID))
						continue;
					this.vel.y = 0;
					
					if (!this.played_land_sound){
						Utils.playSound("land");
						this.played_land_sound = true;
					}
					this.on_ground = true;
					this.has_double_jumped = false;
					this.y = tile.y - this.bb;
				}
			}
		}
	}
	
	player.DieToSuffocation = function(map){};
}

Glitch.PinkTransform = function(map, player, only_visual, only_tile){
	if (!only_tile) player.img_name = "player_pink_sheet";
	if (only_visual) return;
	map.tilesheet_name = "tile_pink_sheet";
	if (only_tile) return;
	
	/*player.PressDown = function(){
		this.pressing_down = true;
		this.pressed_down = true;
		this.on_ground = false;
		
		if (!this.touching_door && !this.touching_checkpoint){
			var checkpoint = new Checkpoint(this.x, this.y);
			checkpoint.lex = 3;
			checkpoint.is_glitched = true;
			checkpoint.export_me = false;
			room.entities.push(checkpoint);
		}
	}*/
}