function Critter(x, y, id, winged){
	GameMover.call(this, x, y, 2, 2, 14, 16, "critter_sheet");
	this.type = "Critter";
	this.animation.frame_height = 16;
	this.critter_id = defaultValue(id, 0);
	this.camera_man = false;
	winged = defaultValue(winged, false);
	if (winged){
		this.img_name = "critter_wing_sheet";
		this.image = resource_manager.critter_wing_sheet;
		this.terminal_vel = 0.5;
		this.jump_vel *= 0.6;
		this.float_grav_acc = 0.3;
		this.original_grav_acc = 0.3;
		this.StartJump = function(){
			this.vel.y = -this.jump_vel;
			this.is_jumping = true;
			this.jump_timer = 0;
			this.on_ground = false;
		}
	}
	this.winged = winged;
	this.frolick_time = 0;
	this.frolick_time_limit = 50;
	this.frolicking = false;
	this.beserking = false;
	this.scared = false;
	this.still_scared = false;
	this.invincible = false;
	this.max_run_vel = 3.0;
	this.export_me = false;
	
	this.HP = 3;
	this.hurt = false;
	this.hurt_time = 0;
	this.hurt_time_limit = 60;
	
	var rand = Math.floor(Math.random()*64);
	if (rand < 8)
		this.critter_id = 1; //gold
	else if (rand < 12 && is_new_game_plus)
		this.critter_id = 4; //glitch
	else if (rand === 63 && room.player.HP < room.player.maxHP)
		this.critter_id = 2; //healing
	
	this.z_index = -30;
}
Critter.unique_caught = 0;;
extend(GameMover, Critter);

Critter.prototype.Update = function(delta, map){
	this.played_land_sound = true;
	
	this.animation.abs_ani_y = this.critter_id * 4 * this.animation.frame_height;
	
	if (this.hurt){
		this.hurt_time++;
		if (this.hurt_time >= this.hurt_time_limit){
			this.hurt_time = 0;
			this.hurt = false;
		}
	}

	if (this.beserking){
		this.Beserk(delta, map);
	}else if (this.scared){
		this.Scared(delta, map);
	}else{
		this.Frolick(delta, map);
	}
	
	if (this.x + this.rb < 0 || this.x + this.lb >= map.MAP_WIDTH * Tile.WIDTH || this.y + this.bb < 0 || this.y + this.tb >= map.MAP_HEIGHT * Tile.HEIGHT){
		this.delete_me = true;
	}
}

Critter.prototype.Frolick = function(delta, map){
	if (map.boss.boss_form !== 5 && this.IsColliding(map.player) && this.visible){
		Critter.unique_caught++;
		this.delete_me = true;
		if (this.critter_id === 1){
			for (var i = 0; i < 3; i++){
				room_manager.critter_queue.push([this.critter_id, this.winged]);
				window.setTimeout(function(){
					Utils.playSound("gold", master_volume, 0);
				}, i*100);
			}
		}
		else if (this.critter_id === 2){
			Utils.playSound("LOZ_Get_Heart", master_volume, 0);
			map.player.HP++;
			if (map.player.HP > map.player.maxHP)
				map.player.HP = map.player.maxHP;
		}
		else if (this.critter_id === 4){
			Utils.playSound("specialGoblin", master_volume, 0);
			for (var i = 0; i < 5; i++){
				room_manager.critter_queue.push([this.critter_id, this.winged]);
			}
		}
		else{
			Utils.playSound("catch", master_volume, 0);
			room_manager.critter_queue.push([this.critter_id, this.winged]);
		}
		
		while (room_manager.critter_queue.length > room_manager.critter_capacity){
			room_manager.critter_queue.pop();
		}
	}else if (map.player.magnet && map.boss.boss_form !== 5 && this.winged){
		if (map.player.x > this.x + 2){
			this.x+=2;
		}else if (map.player.x + 2 < this.x){
			this.x-=2;
		}if (map.player.y > this.y + 2){
			this.y+=2;
		}else if (map.player.y + 2 < this.y){
			this.y-=2;
		}
		
		return;
	}
	
	this.frolick_time++;
	if (this.frolick_time >= this.frolick_time_limit){
		this.frolick_time = 0;
		if (this.winged){
			this.StartJump();
			this.StopJump();
		}
		var rand = Math.floor(Math.random()*3);
		if (rand === 0){
			this.frolicking = false;
			this.move_state = MoveState.STANDING;
		}else{
			this.frolicking = true;
			this.move_state = MoveState.RUNNING;
			if (rand === 1){
				this.vel.x = this.max_run_vel/4;
				this.facing = Facing.RIGHT;
			}
			else if (rand === 2){
				this.vel.x = -this.max_run_vel/4;
				this.facing = Facing.LEFT;
			}
		}
	}
	if (this.frolicking){
		this.horizontal_input = true;
		if (this.horizontal_collision){
			if (this.facing === Facing.LEFT){
				this.vel.x = this.max_run_vel/4;
				this.facing = Facing.RIGHT;
			}
			else{
				this.vel.x = -this.max_run_vel/4;
				this.facing = Facing.LEFT;
			}
		}
	}
	
	GameMover.prototype.Update.call(this, delta, map);
}

Critter.prototype.Beserk = function(delta, map){
	this.vel.x *= (delta/DNUM);
	this.x += this.vel.x;
	this.vel.x /= (delta/DNUM);
	var vel_x = this.vel.x;
	this.vel.x = Math.abs(vel_x) / vel_x;
	
	//DIE TO SOLIDS!!!			
	var left_tile = Math.floor((this.x + this.lb + this.vel.x - 1) / Tile.WIDTH);
	var right_tile = Math.ceil((this.x + this.rb + this.vel.x + 1) / Tile.WIDTH);
	var top_tile = Math.floor((this.y + this.tb + this.vel.y - 1) / Tile.HEIGHT);
	var bottom_tile = Math.ceil((this.y + this.bb + this.vel.y + 1) / Tile.HEIGHT);
	this.HandleHorizontalCollisions(map, left_tile, right_tile, top_tile, bottom_tile, 3, null, map.boss.boss_form === 5);
	if (this.horizontal_collision){
		Utils.playSound("minithud", master_volume, 0);	
		this.delete_me = true;
	}
	this.vel.x = vel_x;
	
	this.UpdateAnimationFromState();
	GameSprite.prototype.Update.call(this, delta, map);
}

Critter.prototype.Scared = function(delta, map){	
	if (this.on_ground){
		this.StartJump();
	}
	else{
		this.animation.frame_delay = 8;
		this.Jump();
	}

	this.horizontal_input = true;
	if (this.facing === Facing.LEFT)
		this.MoveLeft();
	else this.MoveRight();

	GameMover.prototype.Update.call(this, delta, map);
	if (this.horizontal_collision){
		Utils.playSound("minithud", master_volume, 0);	
		this.delete_me = true;
	}
}

//RENDER
Critter.prototype.UpdateAnimationFromState = function(){
	if (this.hurt && this.hurt_time < this.hurt_time_limit/2 && this.critter_id === 4){
		this.animation.Change(2, 1, 1);
	}else{
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
	}
	
	this.prev_move_state = this.move_state;
}