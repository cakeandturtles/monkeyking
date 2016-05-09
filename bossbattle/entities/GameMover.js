function MoveState(){}
MoveState.STANDING = 0;
MoveState.RUNNING = 1;
MoveState.JUMPING = 2;
MoveState.FALLING = 3;

function Facing(){}
Facing.LEFT = 0;
Facing.RIGHT = 1;

function GameMover(x, y, lb, tb, rb, bb, img_name, max_run_vel, jump_vel, terminal_vel){
	GameSprite.call(this, x, y, lb, tb, rb, bb, img_name);
	this.type = "GameMover";
	this.collide_entities = true;
	
	this.prev_x = this.x;
	this.prev_y = this.y;
	this.max_run_vel = defaultValue(max_run_vel, 2.0); //pixels/second
	this.gnd_run_acc = this.max_run_vel/3.0;
	this.gnd_run_dec = this.max_run_vel/3.0;
	this.air_run_acc = this.max_run_vel/3.0;
	this.air_run_dec = this.max_run_vel/3.0;
	this.horizontal_input = false;
	this.mult = 0;
	this.side_collide = true;
	
	this.left_flip_offset = 0;
	this.horizontal_collision = false;
	this.vertical_collision = false;
	this.pressing_down = false;
	this.pressed_down = false;
	this.has_double_jumped = false;
	this.stuck_in_wall = false;
	
	this.vel = {x: 0, y: 0};
	
	this.original_grav_acc = 0.8;
	this.float_grav_acc = 0.4;
	this.grav_acc = this.original_grav_acc;//35.1; //pixels/second
	this.jump_vel = defaultValue(jump_vel, 4.7);
	this.is_jumping = false;
	this.jump_timer = 0;
	this.jump_time_limit = 30;
	this.terminal_vel = defaultValue(terminal_vel, 7.0);
	this.jump_acc = 35.0; 
	this.was_on_ground = true;
	this.on_ground = true;
	this.played_land_sound = true;
	this.previous_bottom = this.y + this.bb;
	
	this.move_state = MoveState.STANDING;
	this.prev_move_state = this.move_state;
	this.facing = Facing.RIGHT;
	this.original_facing = this.facing;
	
	this.die_to_suffocation = false;
}
extend(GameSprite, GameMover);

GameMover.prototype.Import = function(obj){
	GameSprite.prototype.Import.call(this, obj);
	this.max_run_vel = obj.max_run_vel;
	this.jump_vel = obj.jump_vel;
	this.terminal_vel = obj.terminal_vel;
	this.facing = obj.facing || this.facing;
}
GameMover.prototype.Export = function(){
	var obj = GameSprite.prototype.Export.call(this);
	obj.max_run_vel = this.max_run_vel;
	obj.jump_vel = this.jump_vel;
	obj.terminal_vel = this.terminal_vel;
	return obj;
}

GameMover.prototype.ResetPosition = function(){
	GameObject.prototype.ResetPosition.call(this);
	this.facing = this.original_facing;
}


/** FUNCTION DEFINITIONS****************************************/
/**????????????????????????????????????????????????????????????*/
GameMover.prototype.Update = function(delta, map)
{	
	if (!this.stuck_in_wall){
		this.ApplyPhysics(delta, map);
		this.prev_x = this.x;
		this.prev_y = this.y;
		if (!this.on_ground){
			if (!this.was_on_ground)
				this.pressed_down = false;
			this.UpdateMoveState();
		}
	}
	this.UpdateAnimationFromState();
	
	GameSprite.prototype.Update.call(this, delta, map);
}

GameMover.prototype.UpdateMoveState = function(){
	if (this.vel.y < 0) this.move_state = MoveState.JUMPING;
	else this.move_state = MoveState.FALLING;
}

/*********************PHYSICS AND COLLISION DETECTIONS********************/
GameMover.prototype.Die = function(){}

GameMover.prototype.ApplyPhysics = function(delta, map)
{
	var prev_pos = {x: this.x, y: this.y};
	
	this.ApplyGravity(delta);
	
	if (!this.horizontal_input) this.MoveStop();
	this.HandleCollisionsAndMove(map, delta);
	this.horizontal_input = false;
	
	if (this.x == prev_pos.x) this.vel.x = 0;
	if (this.y == prev_pos.y) this.vel.y = 0;
	this.previous_bottom = this.y + this.bb;
}

GameMover.prototype.ApplyGravity = function(delta){
	if (!this.on_ground){
		if (this.vel.y < this.terminal_vel)
		{
			this.vel.y += (this.grav_acc * (delta/DNUM));
			if (this.vel.y > this.terminal_vel) 
				this.vel.y = this.terminal_vel;
		}else if (this.vel.y > this.terminal_vel){
			this.vel.y -= (this.grav_acc * (delta/DNUM));
			if (this.vel.y < this.terminal_vel)
				this.vel.y = this.terminal_vel;
		}
	}else{ this.vel.y = 0; }
}

GameMover.prototype.HandleCollisionsAndMove = function(map){
	this.ResetGroundCollision();
	this.vel.x *= (delta/DNUM);
	this.vel.y *= (delta/DNUM);

	var left_tile = Math.floor((this.x + this.lb + this.vel.x - 1) / Tile.WIDTH);
	var right_tile = Math.ceil((this.x + this.rb + this.vel.x + 1) / Tile.WIDTH);
	var top_tile = Math.floor((this.y + this.tb + this.vel.y - 1) / Tile.HEIGHT);
	var bottom_tile = Math.ceil((this.y + this.bb + this.vel.y + 1) / Tile.HEIGHT);
	
	var q_horz = 3; //q is used to minimize height checked in horizontal collisions and etc.
	var q_vert = 3;
	var floor_tile = null;

	var vel_x = this.HandleVerticalCollisions(map, left_tile, right_tile, top_tile, bottom_tile, q_vert);
	this.vel.x += vel_x;
	this.y += this.vel.y;
	if (this.vel.y != 0) this.played_land_sound = false;
	floor_tile = this.HandleHorizontalCollisions(map, left_tile, right_tile, top_tile,
	bottom_tile, q_horz, floor_tile);
	this.x += this.vel.x;
	this.vel.x -= vel_x;
	
	this.vel.x /= (delta/DNUM);
	this.vel.y /= (delta/DNUM);
}

GameMover.prototype.ResetGroundCollision = function(){
	// Reset flag to search for ground collision.
	this.was_on_ground = this.on_ground;
	this.on_ground = false;
}

GameMover.prototype.HandleHorizontalCollisions = function(map, left_tile, right_tile, top_tile, bottom_tile, q, floor_tile, collide_entities){
	collide_entities = defaultValue(collide_entities, true);
	this.horizontal_collision = false;
	//Check all potentially colliding tiles
	for (var i = top_tile; i <= bottom_tile; i++){
		for (var j = left_tile; j <= right_tile; j++){
			if (!map.isValidTile(i, j)) continue;
			var tile = map.tiles[i][j];
			//don't check for collisions if potential tile is "out of bounds" or not solid
			if (tile.collision != Tile.SOLID && tile.collision != Tile.SUPER_SOLID) continue;
			
			//Reset floor tile
			if (floor_tile == null || (tile.y > this.y && Math.abs(tile.x-this.x) < Math.abs(floor_tile.x-this.x))){ 
				floor_tile = tile;
			}
			
			this.HorizontalCollision(tile, q);
		}
	}
	
	if (!this.collide_entities || !collide_entities) return;
	var entities = map.entities.slice(0);
	entities.push(map.boss);
	for (var i = 0; i < entities.length; i++){
		if (entities[i].solid && entities[i] !== this && entities[i].side_collide)
			this.HorizontalCollision(entities[i], q);
	}
}

GameMover.prototype.HorizontalCollision = function(obj, q){
	//Check for left collisions
	if (this.vel.x < 0 && this.IsRectColliding(obj, this.x + this.lb + this.vel.x - 1, 
	this.y + this.tb + q, this.x + this.lb, this.y + this.bb - q)){
		this.vel.x = 0;
		this.horizontal_collision = true;
		this.x = obj.x + obj.rb - this.lb;
	}
	
	//Check for Right collisions
	if (this.vel.x > 0 && this.IsRectColliding(obj, this.x + this.rb, this.y + this.tb + q, this.x + this.rb + this.vel.x + 1, this.y + this.bb - q)){
		this.vel.x = 0;
		this.horizontal_collision = true;
		this.x = obj.x + obj.lb - this.rb;
	}
}

GameMover.prototype.HandleVerticalCollisions = function(map, left_tile, right_tile, top_tile, bottom_tile, q){
	var vel_x = 0;
	var entities = map.entities.slice(0);
	entities.push(map.boss);
	if (this.collide_entities){
		for (var i = 0; i < entities.length; i++){
			if (entities[i].solid && entities[i] !== this){
				var mount = this.VerticalCollision(entities[i], q, false, false);
				if (mount !== null){
					vel_x = mount.vel.x;
					
					if (mount.type === "Boss" && mount.boss_form === 0 && mount.momma !== null && this.type === "Player"){
						mount.fly_height -= 2;
						/*mount.maxHP = 100;
						mount.HP = mount.maxHP;
						mount.boss_form = 10;
						mount.terminal_vel = 0;
						mount.original_grav_acc = 0;
						mount.vel.y = 0;
						mount.grav_acc = 0;
						mount.frolick_time = 0;
						mount.frolick_time_limit = 60;
						Utils.playSound("gainPower", master_volume, 0);*/
					}
					break;
				}
			}		
		}		
	}

	//Check all potentially colliding tiles
	for (var i = top_tile; i <= bottom_tile; i++){
		for (var j = left_tile; j <= right_tile; j++){
			if (!map.isValidTile(i, j)) continue;
			var tile = map.tiles[i][j];
			//don't check for collisions if potential tile is "out of bounds" or not solid
			if (tile.collision == Tile.GHOST || tile.collision == Tile.KILL_PLAYER) 
				continue;
			this.VerticalCollision(tile, q, (tile.collision === Tile.FALLTHROUGH));
		}
	}
	
	return vel_x;
}

GameMover.prototype.VerticalCollision = function(obj, q, fallthrough, only_top){
	var only_top = defaultValue(only_top, false);
	
	//Check for top collisions
	if (!only_top && this.vel.y < 0 && !fallthrough && this.IsRectColliding(obj, this.x + this.lb + q, this.y + this.tb + this.vel.y-1, this.x + this.rb - q, this.y + this.tb)){
		this.vel.y = 0;
		this.y = obj.y + obj.bb - this.tb;
	}
	
	//Check for bottom collisions
	if (this.vel.y >= 0 && this.IsRectColliding(obj, this.x + this.lb + q, this.y + this.bb, this.x + this.rb - q, this.y + this.bb + this.vel.y + 1)){
		//Don't count bottom collision for fallthrough platforms if we're not at the top of it
		if ((fallthrough || only_top) && (obj.y < this.y + this.bb || this.pressing_down))
			return false;
			
		if (!this.played_land_sound){
			Utils.playSound("land", 0.3);
			this.played_land_sound = true;
		}
		this.vel.y = 0;
		this.on_ground = true;
		this.LandOnGround();
		this.has_double_jumped = false;
		this.y = obj.y + obj.tb - this.bb;
		return obj;
	}
	return null;
}

GameMover.prototype.LandOnGround = function(){}

/******************RENDER AND ANIMATION FUNCTIONS***********************/
GameMover.prototype.UpdateAnimationFromState = function(){
	switch (this.move_state){
		case MoveState.STANDING:
			this.animation.Change(0, 0, 2);
			break;
		case MoveState.RUNNING: 
			this.animation.Change(2, 0, 4);
			if (this.prev_move_state == MoveState.FALLING || this.prev_move_state == MoveState.JUMPING)
				this.animation.curr_frame = 1;
			break;
		case MoveState.JUMPING:
			this.animation.Change(0, 1, 2);
			break;
		case MoveState.FALLING:
			this.animation.Change(4, 1, 2);
			break;
		default: break;
	}
	
	this.prev_move_state = this.move_state;
}

GameSprite.prototype.Render = function(ctx, camera){
	if (this.image === null || !this.visible) return;
	var ani = this.animation;
	var row = ani.rel_ani_y;
	var column = ani.rel_ani_x + ani.curr_frame;
	var abs_ani_y = this.animation.abs_ani_y
	
	if (this.facing == Facing.LEFT){
		this.animation.abs_ani_y += 2 * this.animation.frame_height;
	}
	
	ctx.drawImage(this.image, 
		//SOURCE RECTANGLE
		ani.frame_width * column + ani.abs_ani_x + this.base_ani_x,
		ani.frame_height * row + ani.abs_ani_y + this.base_ani_y,
		ani.frame_width, ani.frame_height,
		//DESTINATION RECTANGLE
		~~(this.x-camera.x+camera.screen_offset_x+0.5) + ani.x_offset, 
		~~(this.y-camera.y+camera.screen_offset_y+0.5)+ani.y_offset,
		ani.frame_width, ani.frame_height
	);
	this.animation.abs_ani_y = abs_ani_y;
}

/*******************FUNCTIONS FOR MOVEMENT INPUT BY OBJECT*****************/
GameMover.prototype.MoveLeft = function(){
	this.facing = Facing.LEFT;
	//if (this.vel.x > 0) this.vel.x = 0;
	this.Move(-1);
}

GameMover.prototype.MoveRight = function(){
	this.facing = Facing.RIGHT;
	//if (this.vel.x < 0) this.vel.x = 0;
	this.Move(1);
}

GameMover.prototype.Move = function(mult){
	this.mult = mult;
	this.pressed_down = false;

	var acc;
	this.horizontal_input = true;
	this.ResetHorizontalVelocity(mult);
	if (this.on_ground){
		acc = this.gnd_run_acc;
		this.move_state = MoveState.RUNNING;
	}
	else{ acc = this.air_run_acc; }
	
	if (Math.abs(this.vel.x) < this.max_run_vel){
		this.vel.x += (acc * mult) * (delta/DNUM);
		this.CorrectVelocity(mult);
	}
	else if (Math.abs(this.vel.x) > this.max_run_vel){
		this.vel.x -= (acc * mult) * (delta/DNUM);
		if (Math.abs(this.vel.x) < this.max_run_vel)
			this.vel.x = this.max_run_vel * mult;
	}
	else if (Math.abs(this.vel.x) == this.max_run_vel && this.vel.x != this.max_run_vel * mult){
		this.vel.x += (acc * mult) * (delta/DNUM);
	}
}

GameMover.prototype.ResetHorizontalVelocity = function(mult){
	if ((this.vel.x * mult) < 0) this.vel.x = 0;
}

GameMover.prototype.MoveStop = function(){
	this.mult = 0;
	if (this.on_ground){
		if (this.vel.x > 0){
			this.vel.x -= (this.gnd_run_dec) * (delta/DNUM);
			if (this.vel.x < 0) this.vel.x = 0;
		}else if (this.vel.x < 0){
			this.vel.x += (this.gnd_run_dec) * (delta/DNUM);
			if (this.vel.x > 0) this.vel.x = 0;
		}
		this.move_state = MoveState.STANDING;
	}else{
		if (this.vel.x > 0){
			this.vel.x -= (this.air_run_dec) * (delta/DNUM);
			if (this.vel.x < 0) this.vel.x = 0;
		}else if (this.vel.x < 0){
			this.vel.x += (this.air_run_dec) * (delta/DNUM);
			if (this.vel.x > 0) this.vel.x = 0;
		}
	}
}

GameMover.prototype.CorrectVelocity = function(mult){
	if (Math.abs(this.vel.x) > this.max_run_vel)
		this.vel.x = this.max_run_vel * mult;
}

GameMover.prototype.StartJump = function(){
	if (this.on_ground){
		this.vel.y = -this.jump_vel;
		this.is_jumping = true;
		this.jump_timer = 0;
		this.on_ground = false;
	}
}

GameMover.prototype.Jump = function(){
	if (this.is_jumping){
		this.jump_timer+=(delta/DNUM);
		if (this.jump_timer >= this.jump_time_limit){
			this.jump_timer = 0;
			this.is_jumping = false;
			this.grav_acc = this.original_grav_acc;
		}else{
			this.grav_acc = this.float_grav_acc;
			this.vel.y += (-this.jump_vel * ((this.jump_time_limit - (this.jump_timer/2)) / (this.jump_time_limit * 60))) * (delta/DNUM);
		}
	}
}

GameMover.prototype.StopJump = function(){
	this.jump_timer = 0;
	this.is_jumping = false;
	this.grav_acc = this.original_grav_acc;
}

GameMover.prototype.PressDown = function(){
	this.pressing_down = true;
	this.pressed_down = true;
	this.on_ground = false;
}

GameMover.prototype.StopPressingDown = function(){
	this.pressing_down = false;
}