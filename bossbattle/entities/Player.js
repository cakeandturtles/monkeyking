function Player(x, y){
	GameMover.call(this, x, y, 2, 2, 14, 16, "player_sheet");
	this.type = "Player";
	this.frozen = false;
	this.animation.frame_height = 16;
	this.has_wings = false;
	this.magnet = false;
	this.combo = false;
	this.combo_time = 0;
	this.combo_time_limit = 20;
	
	this.alert_time = 0;
	this.alert_time_limit = 10;
	this.alert_color = "#00ff00";
	this.zen = false;
	
	this.z_index = -100;
	this.maxHP = 3;
	this.HP = this.maxHP;
	this.hurt = false;
	this.hurt_time = 0;
	this.hurt_time_limit = 100;
}
extend(GameMover, Player);

Player.prototype.Update = function(delta, map){
	if (this.magnet && this.img_name !== "player_magnet_sheet"){
		this.img_name = "player_magnet_sheet";
		this.image = resource_manager["player_magnet_sheet"];
	}

	if (this.combo){
		this.combo_time++;
		if (this.combo_time >= this.combo_time_limit){
			this.combo_time = 0;
			this.combo = false;
		}
	}

	if (this.zen) this.HP = this.maxHP;

	if (this.HP === 1){
		this.alert_time++;
		if (this.alert_time >= this.alert_time_limit){
			this.alert_time = 0;
			if (this.alert_color === "#00ff00")
				this.alert_color = "#ff0000";
			else this.alert_color = "#00ff00";
		}
	}else this.alert_color = "#00ff00";
	if (this.HP >= this.maxHP) this.HP = this.maxHP;

	if (this.hurt){
		if (this.hurt_time % 2 === 0 && room_manager.lost_queue.length > 0){
			var q = room_manager.lost_queue.shift();
			var critter = new Critter(this.x, this.y-8, q[0], q[1]);
			critter.critter_id = q[0];
			critter.jump_vel = Math.floor(Math.random()*critter.jump_vel)+1;
			critter.scared = true;
			critter.invincible = true;
			critter.StartJump();
			critter.gnd_run_acc = critter.max_run_vel/10.0;
			critter.air_run_acc = critter.max_run_vel/10.0;
			critter.vel.x = Math.floor(Math.random()*critter.max_run_vel);
			
			if (Math.floor(Math.random()*2) === 0){
				critter.facing = Facing.LEFT;
				critter.vel.x *= -1;
			}
			else critter.facing = Facing.RIGHT;
			map.entity_queue.push(critter);
		}
	
		this.hurt_time++;
		if (this.hurt_time < this.hurt_time_limit/2){
			if (this.hurt_time % 8 === 0){
				this.visible = false;
			}else if ((this.hurt_time - 4) % 8 === 0){ 
				this.visible = true; 
			}
		}else{
			if (this.hurt_time % 16 === 0){
				this.visible = false;
			}else if ((this.hurt_time - 8) % 16 === 0){
				this.visible = true;
			}
		}
		
		
		if (this.hurt_time >= this.hurt_time_limit){
			this.visible = true;
			this.hurt = false;
			room_manager.lost_queue = [];
		}
	}
	
	if (this.frozen){
		this.vel.x = 0;
		this.vel.y = 0;
		this.grav_acc = 0;
	}else if (this.grav_acc === 0){
		this.grav_acc = this.original_grav_acc;
	}
	GameMover.prototype.Update.call(this, delta, map);
}

Player.prototype.WingMe = function(){
	room.player.img_name = "player_wing_sheet";
	room.player.has_wings = true;
	room.player.image = resource_manager.player_wing_sheet;
	room.player.original_grav_acc = 0.3;
	room.player.float_grav_acc = 0.1;
	room.player.grav_acc = 0.3;
	room.player.jump_time_limit = 30;
	room.player.jump_vel = 3.6;
	room.player.terminal_vel = 3.0;
	room.player.StartJump = function(){
		this.vel.y = -this.jump_vel;
		this.is_jumping = true;
		this.jump_timer = 0;
		this.jump_time_limit = 120;
		this.on_ground = false;
	}
	room.player.Jump = function(){
		if (this.is_jumping){
			this.jump_timer+=(delta/DNUM);
			if (this.jump_timer >= this.jump_time_limit){
				this.jump_timer = 0;
				this.is_jumping = false;
				this.grav_acc = this.original_grav_acc;
			}else{
				this.grav_acc = this.float_grav_acc;
			}
		}
	}
	room.player.StopJump = function(){
		this.jump_timer = 0;
		this.is_jumping = false;
		this.grav_acc = this.original_grav_acc;
	}
}

Player.prototype.Hurt = function(){
	if (this.hurt) return;
	
	var len = room_manager.critter_queue.length;
	for (var i = 0; i < Math.ceil(6*len/10); i++){
		room_manager.lost_queue.push(room_manager.critter_queue.pop());
	}
	
	this.hurt = true;
	this.hurt_time = 0;
	Utils.playSound("hurt", master_volume, 0);
	this.HP--;
	if (is_new_game_plus)
		this.HP--;
	if (this.HP <= 0){
		this.Die();
	}
}

Player.prototype.Die = function(){
	this.hurt_time = -99999;
	dead_timer = 0;
	dead = true;
	this.frozen = true;
	Utils.playSound("die", master_volume, 0);
}

//RENDER
Player.prototype.Render = function(ctx, camera){
	GameMover.prototype.Render.call(this, ctx, camera);
	var q = (4/VIEW_SCALE);
	
	if (this.combo){
		ctx.font = (16*q) + "px pixelFont";
		var thex = ~~(this.x-camera.x+camera.screen_offset_x+0.5)-2;
		var they = ~~(this.y-camera.y+camera.screen_offset_y+0.5);
	
		if (combo_time < combo_time_limit / 3)
			ctx.fillStyle = "#ffff00";
		else if (combo_time < 2 * (combo_time_limit / 3))
			ctx.fillStyle = "#00ffff";
		else ctx.fillStyle = "#ff00ff";
		
		ctx.fillText("+5", thex, (they-8));
		ctx.font = (8*q) + "px pixelFont";
	}
	
	if (room.boss.boss_form === 5 || this.zen)
		return;
	
	for (var i = 0; i < this.maxHP; i++){
		ctx.fillStyle = "#000000";
		ctx.fillRect(12*q+i*7*q, 2*q, 8*q, 8*q);
		
		ctx.fillStyle = "#ff0000";
		ctx.fillRect(13*q+i*7*q, 3*q, 6*q, 6*q);
		
		if (this.HP > i){
			ctx.fillStyle = this.alert_color;
			ctx.fillRect(13*q+i*7*q, 3*q, 6*q, 6*q);
		}
	}
}