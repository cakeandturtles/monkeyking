function Boss(x, y){
	GameMover.call(this, x, y, 6, 2, 26, 16, "boss_zero_sheet");
	this.momma = null;
	this.num_children = 0;
	this.num_dead_children = 0;
	this.type = "Boss";
	this.animation.frame_width = 32;
	this.animation.frame_height = 16;
	this.solid = true;
	this.collide_entities = false;
	this.can_hurt = true;
	this.can_get_hurt = true;
	this.sensitivity = 1;
	this.terminal_vel = 2.0;
	this.export_me = false;
	this.winged_death = false;
	this.count_me = false;
	
	this.prev_img = [];
	this.next_img = [];
	this.healing = false;
	this.transforming = false;
	this.transform_time = 0;
	this.transform_time_limit = 110;
	
	this.original_lb = this.lb;
	this.original_rb = this.rb;
	
	this.z_index = -10;
	this.max_run_vel = 1;
	this.vel.x = -this.max_run_vel;
	this.facing = Facing.LEFT;
	
	this.prev_vel = {x: 0, y: 0};
	this.hurt = false;
	this.hurt_time = 0;
	this.hurt_time_limit = 3;
	this.can_hurt = true;
	this.speech = "";
	
	this.animation.frame_delay = 2;
	this.maxHP = 25;
	this.HP = this.maxHP;
	this.boss_form = 0;
	this.frolick_time = 0;
	this.frolick_time_limit = 100;
	this.frolick_count = 0;
	this.frolick_limit = 5;
	this.begin_charge = false;
	this.beserking = false;
	this.frolicking = false;
	this.stunned = false;
	this.stun_time = 0;
	this.stun_time_limit = 100;
	this.fire_time = 0;
	this.fire_time_limit = 60;
	this.fire_count = 0;
	this.fire_count_limit = 4;
	this.q_height = 120;
	this.original_fly_height = 72 + this.q_height;
	this.fly_height = this.original_fly_height;
	this.zen = false;
}
extend(GameMover, Boss);

Boss.prototype.ForceTransform = function(map){	
	if (this.boss_form === 99){
		this.y = this.fly_height;
		this.x = room.MAP_WIDTH * Tile.WIDTH / 2 - this.rb/2;
		this.TransitionThree(1, map);
		this.transform_time = 1;
		this.transforming = false;
		this.Transform(1, map, false, false);
	}
	this.HP = 0;
	this.BossFormScript(1, map);
	this.transform_time = 1;
	this.transforming = false;
	this.Transform(1, map, false, false);
	this.healing = false;
	this.HP = this.maxHP;
	room.Speak(null);
}

Boss.prototype.Update = function(delta, map){
	if (this.momma === null){
		switch (this.boss_form){
			case 0:
				room_manager.critter_capacity = 10;
				break;
			case 1:
				room_manager.critter_capacity = 15;
				break;
			case 2:
				room_manager.critter_capacity = 20;
				break;
			case 3: case 99:
				room_manager.critter_capacity = 30;
				break;
			case 4:
				room_manager.critter_capacity = 50;
				break;
			default:
				room_manager.critter_capacity = 50;
				break;
		}
	}
	if (is_new_game_plus)
		room_manager.critter_capacity *= 2;
	if (this.zen) room_manager.critter_capacity = 999;
	
	if (!this.visible) return;
	GameMover.prototype.Update.call(this, delta, map);
	
	if (this.zen){
		this.HP = this.maxHP;
		boss_form = old_boss_form;
	}
	
	this.yell_time++;
	if (this.yell_time >= this.yell_time_limit){
		if (Math.floor(Math.random()*2) === 0){}
		this.yell_time = 0;
	}
	
	this.lb = this.original_lb;
	this.rb = this.original_rb;
	var boss_form = this.boss_form;
	if (boss_form === 5) boss_form = 4;
	if (boss_form === 10) boss_form = 1;
	if (boss_form === 99) boss_form = 2;
	if (this.facing === Facing.LEFT){
		this.rb -= 4 * (boss_form+1);
	}
	if (this.facing === Facing.RIGHT){
		this.lb += 4 * (boss_form+1)
	}
	
	if (this.transforming){
		room.camera.y_lim = 30;
		this.transform_time++;
		if (this.transform_time >= this.transform_time_limit){
			this.transform_time = 1;
			this.transforming = false;
			this.Transform(delta, map);
			return;
		}
		
		if (this.transform_time < 0) return;
		var freq = 20;
		if (this.transform_time >= this.transform_time_limit/2)
			freq = 10;
		if (this.transform_time % freq === 0){
			this.image = resource_manager[this.next[0]];
			this.animation.frame_width = this.next[1];
			this.animation.frame_height = this.next[2];
			
			this.x = this.next[3] - this.next[5];
			this.y = this.next[4] - this.next[6];
			this.rb = this.next[8];
			this.bb = this.next[7];
			
			if (this.x < Tile.WIDTH*7)
				this.x = Tile.WIDTH*7;
			if (this.x + this.rb >= map.MAP_WIDTH*Tile.WIDTH - (Tile.WIDTH*7))
				this.x = map.MAP_WIDTH*Tile.WIDTH - (Tile.WIDTH*7) - this.rb;
		}else if ((this.transform_time - (freq/2)) % freq === 0){
			this.image = resource_manager[this.prev[0]];
			this.animation.frame_width = this.prev[1];
			this.animation.frame_height = this.prev[2];
			
			this.x = this.prev[3];
			this.y = this.prev[4];
			this.rb = this.prev[8];
			this.bb = this.prev[7];
			
			if (this.x < Tile.WIDTH*7)
				this.x = Tile.WIDTH*7;
			if (this.x + this.rb >= map.MAP_WIDTH*Tile.WIDTH - (Tile.WIDTH*7))
				this.x = map.MAP_WIDTH*Tile.WIDTH - (Tile.WIDTH*7) - this.rb;
		}
	}
	else{
		if (is_new_game_plus)
			room.camera.y_lim = 50;
		this.BossFormScript(delta, map);
		if (this.boss_form === 10)
			return;
	
		if (this.can_hurt)
			this.HurtEnemies(delta, map);
	}
}

Boss.prototype.Transform = function(delta, map, spawn_heart, write){
	write = defaultValue(write, true);
	spawn_heart = defaultValue(spawn_heart, true);
	this.frolick_time = 0;
	this.frolick_count = 0;
	this.begin_charge = false;
	this.beserking = false;
	this.frolicking = false;
	this.stunned = false;
	this.stun_time = 0;
	this.healing = true;
	Utils.playSound("gainPower", master_volume, 0);
	var boss_form = this.boss_form+1;
	if (boss_form >= 5) boss_form = 4;
	if (this.boss_form !== 99 && write){
		console.log(this.boss_form + ", " + write);
		Utils.createCookie('monkeykingmemory', (boss_form) + "," + is_new_game_plus + "," + is_new_game_plus_unlocked + "," + room_manager.Stats(), 30);
	}

	if (this.boss_form !== 3){
		this.x = this.next[3] - this.next[5];
		this.y = this.next[4] - this.next[6];
		this.original_rb = this.next[8];
		this.rb = this.next[8];
		this.bb = this.next[7];
	
		if (this.x < Tile.WIDTH*7)
			this.x = Tile.WIDTH*7;
		if (this.x + this.rb >= map.MAP_WIDTH*Tile.WIDTH - (Tile.WIDTH*7))
			this.x = map.MAP_WIDTH*Tile.WIDTH - (Tile.WIDTH*7) - this.rb;
	}

	if (this.boss_form === 0){
		this.maxHP = 35;
		if (is_new_game_plus) this.maxHP = 50;
		this.boss_form = 1;
		
		if (map.player.HP <= 3 && spawn_heart)
			map.entity_queue.push(new Collection(this.x + this.rb/2, this.y, 0));
		
		this.img_name = "boss_one_sheet";
		this.image = resource_manager.boss_one_sheet;
		this.animation.frame_width = 48;
		this.animation.frame_height = 24;
		this.frolick_limit = 4;
		this.frolick_time_limit = 100;
		
		sky_color = "#bb88ff"
	}else if (this.boss_form === 1){
		this.maxHP = 75;
		if (is_new_game_plus) this.maxHP = 150;
		this.boss_form = 2;
		
		if (map.player.HP <= 4 && spawn_heart)
			map.entity_queue.push(new Collection(this.x + this.rb/2, this.y, 0));
		
		this.img_name = "boss_two_sheet";
		this.image = resource_manager.boss_two_sheet;
		this.animation.frame_width = 64;
		this.animation.frame_height = 32;

		this.terminal_vel = 0.5;
		this.original_grav_acc = 0.1;
		this.grav_acc = 0.01;
		this.jump_vel = 6.1;
		this.jump_time_limit = 180;
		
		this.frolick_limit = 3;
		this.frolick_time_limit = 100;
		
		sky_color = "#ff88bb"
	}else if (this.boss_form === 2){
		this.maxHP = 100;
		if (is_new_game_plus) this.maxHP = 200;
		this.boss_form = 3;
		this.collide_entities = false;
		
		if (map.player.HP <= 5 && spawn_heart)
			map.entity_queue.push(new Collection(this.x + this.rb/2, this.y, 0));
		
		this.img_name = "boss_three_sheet";
		this.image = resource_manager.boss_three_sheet;
		this.animation.frame_width = 128;
		this.animation.frame_height = 64;
	
		this.vel.y = 0;
		this.StopJump();
		this.terminal_vel = 0.5;
		//this.original_grav_acc = 0.1;
		this.grav_acc = 0.1;
		this.jump_vel = 1.0;
		this.jump_time_limit = 30;
		this.fly_height = 104 + this.q_height;
		this.StartJump = function(){
			this.vel.y = -this.jump_vel;
			this.is_jumping = true;
			this.jump_timer = 0;
			this.on_ground = false;
		}
		
		this.frolick_time_limit = 160;
		VIEW_SCALE = 3;
		GAME_WIDTH = 213;
		GAME_HEIGHT = 160;
		
		text_color = "#ffffff";
		sky_color = "#330033"
		
		if (!this.zen){
			for (var i = 0; i < 3; i++){
				window.setTimeout(function(){
					var fire = new Fire(16 + this.i * 12, 200);
					fire.forever = true;
					this.map.entities.push(fire);
					fire = new Fire(288 - this.i * 12, 200);
					fire.forever = true;
					this.map.entities.push(fire);
				}.bind({map: map, i: i}), i*1000);
			}
		}
	}else if (this.boss_form === 3){
		this.HP = 0;
		this.maxHP = 200;
		if (is_new_game_plus) this.maxHP = 400;
		this.boss_form = 4;
		this.collide_entities = false;
		sky_color = "#110011";
		
		if (map.player.HP <= 6 && spawn_heart)
			map.entity_queue.push(new Collection(this.x + this.rb/2, this.y, 0));
		
		this.frolick_time_limit = 10;
		this.frolick_limit = 10;
		this.stun_time_limit = 120;
		this.fly_height = 64;
		this.max_run_vel = 2.0;
		VIEW_SCALE = 2;
		GAME_WIDTH = 320;
		GAME_HEIGHT = 240;
		map.camera.y = 180;
		for (var i = map.entities.length-1; i >= 0; i--){
			if (map.entities[i].type === "Boss" && map.entities[i] !== this){
				var boss = map.entities[i];
				boss.HP = 0;
				boss.solid = false;
			}
		}

		if (!this.zen){
			if (!is_new_game_plus){
				if (!this.winged_death)
					map.entity_queue.push(new Collection(map.MAP_WIDTH * Tile.WIDTH / 2 - 4, 128, 1));
				else map.entity_queue.push(new Collection(map.MAP_WIDTH * Tile.WIDTH / 2 - 4, 256, 1));
			}else{
				if (!this.winged_death)
					map.entity_queue.push(new Collection(map.MAP_WIDTH * Tile.WIDTH / 2 - 4, 128, 2));
				else map.entity_queue.push(new Collection(map.MAP_WIDTH * Tile.WIDTH / 2 - 4, 256, 2));
			}
		}
		this.winged_death = true;
		this.y = 72 + this.q_height;
		boss_form = 4;
	}else if (this.boss_form === 4){
		this.solid = true;
		this.boss_form = 5;
		this.img_name = "boss_four_sheet";
		this.image = resource_manager.boss_four_sheet;
		sky_color = "#aaaaaa";
		text_color = "#000000";
		this.terminal_vel = 7;
		this.original_grav_acc = 0.8
		is_new_game_plus_unlocked = true;
		boss_form = 0;
		can_continue = false;
		stopMusic();
	}
}

Boss.prototype.BossFormScript = function(delta, map){
	if (this.healing){
		if (this.HP <= 0) this.HP = 0;
		this.HP++;
		if (this.HP >= this.maxHP){
			this.healing = false;
			this.HP = this.maxHP
		}
		//return;
	}

	if (this.hurt){
		this.hurt_time++;
		if (this.hurt_time >= this.hurt_time_limit){
			this.hurt = false;
			this.vel.x = this.prev_vel.x;
			this.vel.y = this.prev_vel.y;
		}
		else return;
	}

	if (this.boss_form === 0){
		this.ScriptZero(delta, map);
		
		if (this.HP <= 0){
			this.HP = 0;
			Utils.playSound("LOZ_Boss_Scream1", master_volume, 0);
			if (this.momma === null){
				this.transforming = true;
				this.transform_time = 0;
				this.prev = ["boss_zero_sheet", 32, 16, this.x, this.y, 0, 0, 16, 30];
				this.next = ["boss_one_sheet", 48, 24, this.x, this.y, 8, 8, 24, 44];
				
				map.camera.instant = false;
				map.camera.speed = 0;
				
				Trophy.GiveTrophy(Trophy.MONKEY_KING);
				boss_form = this.boss_form+1;
				prev_new_game_plus = is_new_game_plus;
			}else{
				this.momma.fly_height += 26;
				if (is_new_game_plus){
					this.img_name = "baby_one_sheet";
					this.image = resource_manager.baby_one_sheet;
				}
				this.maxHP = 100;
				this.HP = this.maxHP;
				this.boss_form = 10;
				this.terminal_vel = 0;
				this.original_grav_acc = 0;
				this.vel.y = 0;
				this.grav_acc = 0;
				this.frolick_time = 0;
				this.frolick_time_limit = 60;
				Utils.playSound("gainPower", master_volume, 0);
			}
		}
	}
	else if (this.boss_form === 1){
		this.ScriptOne(delta, map);		
		if (this.HP <= 0){
			this.HP = 0;
			Utils.playSound("LOZ_Boss_Scream1", master_volume, 0);
			this.solid = false;
			this.transforming = true;
			this.transform_time = 0;
			this.prev = ["boss_one_sheet", 48, 24, this.x, this.y, 0, 0, 24, 44];
			this.next = ["boss_two_sheet", 64, 32, this.x, this.y, 8, 8, 32, 56];
			
			map.camera.instant = false;
			map.camera.speed = 0;
			
			boss_form = this.boss_form+1;
			prev_new_game_plus = is_new_game_plus;
		}
	}else if (this.boss_form === 2){
		this.solid = false;
		this.ScriptTwo(delta, map);
		
		if (this.HP <= 0){
			this.HP = 0;
			Utils.playSound("LOZ_Boss_Scream1", master_volume, 0);
			this.boss_form = 99;
			this.vel.y = 0;
			this.StopJump();
			this.terminal_vel = 0.5;
			this.original_grav_acc = 0.1;
			this.grav_acc = 0.1;
			this.jump_vel = 1.0;
			this.jump_time_limit = 30;
			this.fly_height = 128 + this.q_height;
			this.StartJump = function(){
				this.vel.y = -this.jump_vel;
				this.is_jumping = true;
				this.jump_timer = 0;
				this.on_ground = false;
			}
	
			boss_form = 3;
			prev_new_game_plus = is_new_game_plus;
		}
	}else if (this.boss_form === 99){
		this.TransitionThree(delta, map);
	}else if (this.boss_form === 3){
		this.ScriptThree(delta, map);
		
		if (this.HP <= 0){
			Utils.playSound("LOZ_Boss_Scream1", master_volume, 0);
			this.Transform(delta, map);
			
			if (!this.zen){
				bg_name = "And_Start_Havok";
				if (resource_manager.play_music){
					stopMusic();
					startMusic();
				}
			}
	
			boss_form = this.boss_form;
		}
	}else if (this.boss_form === 4){
		this.ScriptFour(delta, map);
		if (this.HP <= 0){
			this.HP = 0;
			this.can_hurt = false;
			for(var i = 0; i < 3; i++){
				window.setTimeout(function(){
					Utils.playSound("LOZ_Boss_Scream1", master_volume, 0);
				}, i * 1000);
			}
			map.entities = [];
			this.transforming = true;
			this.transform_time = 0;
			this.solid = true;
			this.prev = ["boss_three_sheet", 128, 64, this.x, this.y, 0, 0, 64, 108];
			this.next = ["boss_four_sheet", 128, 64, this.x, this.y, 0, 0, 64, 108];
			this.frolick_time_limit = 360;
			this.frolick_time = 0;
			
			room_manager.time = Math.round(((((Date.now() - room_manager.then) / 1000) / 60) + 0.00001) * 100) / 100;
			stopMusic();
			bg_name = null;
			resource_manager.play_music = true;
			this.speech = "";
			
			if (!room_manager.submitted){
				room_manager.submitted = true;
				Trophy.AddScore(room_manager.time + " min", room_manager.time*100, 31770);
				Trophy.GiveTrophy(Trophy.TRUE_MONKEY_KING);
				if (is_new_game_plus)
					Trophy.GiveTrophy(Trophy.TRUE_TRUE_MONKEY_KING);
			}
			is_new_game_plus_unlocked = true;
			boss_form = 4;
			prev_new_game_plus = is_new_game_plus;
		}
	}else if (this.boss_form === 5){
		if (this.on_ground){
			this.frolick_time++;
			if (this.frolick_time >= this.frolick_time_limit){
				this.frolick_time_limit = 480;
				if (this.speech.indexOf("deaths") >= 0){
					this.speech = "a winner is you?\n\npress enter then esc to main menu";
				}else{
					this.speech = "deaths: " + room_manager.num_deaths + "\n" +
					"monkeys shot: " + room_manager.num_critters_released + "\n" +
					"time: " + (room_manager.time.toFixed(2)) + " min";
				}
				this.frolick_time = 0;
				map.Speak(this.speech, 9999, true);
			}
		}
	}else if (this.boss_form === 10){
		this.BabyFly(delta, map);
	}
}

Boss.prototype.BabyFly = function(delta, map){
	this.can_get_hurt = false;
	this.solid = map.boss.boss_form !== 4 && !is_new_game_plus;

	if (this.frolick_time < this.frolick_time_limit){
		this.frolick_time++;
	}else{
		this.grav_acc = 0;
		this.original_grav_acc = 0;
		this.animation.frame_delay = 8;
		this.y-=1.5;
	}
	
	if (this.y < 0 - this.bb){
		this.delete_me = true;
		map.boss.num_children--;
	}
}

Boss.prototype.ScriptZero = function(delta, map){
	this.max_run_vel = 0.33;
	if (this.momma !== null){
		this.max_run_vel = 1.0;
		this.side_collide = false;
	}
	if (this.on_ground)
		this.horizontal_input = true;
	this.animation.frame_delay = 32;
	if (this.horizontal_collision){
		if (this.facing === Facing.LEFT){
			this.facing = Facing.RIGHT;
		}else{
			this.facing = Facing.LEFT;
		}
	}
	if (this.facing === Facing.LEFT)
		this.vel.x = -this.max_run_vel;
	else
		this.vel.x = this.max_run_vel;
		
	if (this.momma !== null){
		if (this.y + this.bb/2 <= room.player.y + room.player.bb/2 || is_new_game_plus)
			this.solid = false;
		else this.solid = true;
	
		if (this.fly_height < this.original_fly_height){
			this.fly_height++;
		}if (this.fly_height < this.original_fly_height - 16){
			this.fly_height = this.original_fly_height - 16;
		}
		
		if (this.beserking)
			this.horizontal_input = true;
		if (this.y > this.fly_height){
			this.StartJump();
			this.beserking = true;
		}else{ 
			this.StopJump();
		}
	}
	
	if (!this.horizontal_input) this.vel.x = 0;
}

Boss.prototype.ScriptOne = function(delta, map){
	this.max_run_vel = 1.0;
	this.animation.frame_delay = 16;
	
	if (this.stunned){
		this.animation.frame_delay = 64;
		this.stun_time++;
		if (this.stun_time >= this.stun_time_limit){
			this.stunned = false;
			this.stun_time = 0;
			this.frolick_time = 0;
		}
		return;
	}
	
	if (!this.beserking){
		this.animation.frame_delay = 16;
		this.frolick_time++;
		if (this.frolick_time >= this.frolick_time_limit){
			this.frolick_count++;
			if (this.frolick_count === this.frolick_limit){
				this.frolick_count = 0;
				this.stun_time = 0;
				this.beserking = true;
				this.begin_charge = false;
				this.solid = false;
					
				Utils.playSound("dash2", master_volume, 0);
			}else if (this.frolick_count === this.frolick_limit-1){
				this.frolick_time = 0;
				this.vel.x = 0;
				this.frolicking = false;
				this.begin_charge = true;
				
				Utils.playSound("dashcharge", master_volume, 0);
			}else{
				this.frolick_time = 0;
				var rand = Math.floor(Math.random()*2);
				this.frolicking = true;
				this.move_state = MoveState.RUNNING;
				if (this.x + this.lb + this.rb/2 > map.player.x + map.player.lb + map.player.rb/2)
					this.facing = Facing.LEFT;
				else
					this.facing = Facing.RIGHT;
			}
		}
		
		if (this.frolicking){
			this.horizontal_input = true;
			if (this.horizontal_collision){
				if (this.facing === Facing.LEFT)
					this.facing = Facing.RIGHT;
				else
					this.facing = Facing.LEFT;
			}
			
			if (this.facing === Facing.LEFT)
				this.vel.x = -this.max_run_vel;
			else
				this.vel.x = this.max_run_vel;
		}
		if (this.begin_charge){
			this.animation.frame_delay = 8;
			if (this.frolick_time % 40 === 0 && this.frolick_time < this.frolick_time_limit/2){
				if (this.x + this.lb + this.rb/2 > map.player.x + map.player.lb + map.player.rb/2)
					this.facing = Facing.LEFT;
				else
					this.facing = Facing.RIGHT;
			}
		}
	}else{	
		this.stun_time++;
		if (this.stun_time >= 30)
			this.solid = true;
		this.animation.frame_delay = 8;
		this.max_run_vel = 2.5;
		this.horizontal_input = true;
		if (this.facing === Facing.LEFT)
			this.vel.x = -this.max_run_vel;
		else this.vel.x = this.max_run_vel;
	
		//DIE TO SOLIDS!!!			
		if (this.horizontal_collision){ 
			Utils.playSound("thud", master_volume, 0);
			this.solid = true;
			this.beserking = false;
			this.vel.x = 0;
			vel_x = 0;
			this.stunned = true;
			this.stun_time = 0;
		}
	}
}

Boss.prototype.ScriptTwo = function(delta, map){
	if (!this.beserking && !this.stunned){
		this.max_run_vel = 1.6;
		this.horizontal_input = true;
		if (this.horizontal_collision){
			this.frolick_count++;
			if (this.frolick_count >= 5){//this.frolick_limit){
				this.frolick_count = 0;
				this.frolick_time = 0;
				this.beserking = true;
				this.StopJump();
				this.vel.y = 0;
			}
			
			if (this.facing === Facing.LEFT){
				this.facing = Facing.RIGHT;
				this.vel.x = this.max_run_vel;
			}else{
				this.facing = Facing.LEFT;
				this.vel.x = -this.max_run_vel;
			}
		}else{
			if (this.facing === Facing.LEFT)
				this.vel.x = -this.max_run_vel;
			else this.vel.x = this.max_run_vel;
		}
		
		if (this.beserking) return;
		if (this.on_ground){
			this.StartJump();
		}
		else{
			this.animation.frame_delay = 8;
			this.Jump();
		}
	}else if (this.beserking){
		this.vel.x = 0;
		if (this.on_ground){
			if (this.frolick_time === 0)
				Utils.playSound("dashcharge", master_volume, 0);
			this.frolick_time++;
			if (this.frolick_time >= this.frolick_time_limit ){
				this.beserking = false;
				this.stunned = true;
				this.stun_time = 0;
				this.stun_time_limit = 100;
			}
		}
	}else if (this.stunned){
		this.stun_time++;
		if (this.stun_time % 20 === 0){
			var i = this.stun_time / 20;
			var x = this.x;
			var q = 16;
			if (this.facing === Facing.LEFT){
				q = -16;
			}
			else x += 48;
			var fire = new Fire(x + (i*q), this.y+8);
			fire.invincible = true;
			map.entity_queue.push(fire);
			Utils.playSound("awaken", master_volume, 0);
		}
		if (this.stun_time >= this.stun_time_limit){
			this.stunned = false;
		}
	}
}

Boss.prototype.TransitionThree = function(delta, map){
	this.can_hurt = false;
	if (this.y > this.fly_height) this.StartJump();
	else{ 
		this.can_hurt = true;
		this.StopJump();
	}
	if (this.x + this.rb/2 < (map.MAP_WIDTH * Tile.WIDTH / 2) - 10){
		this.facing = Facing.RIGHT;
		this.horizontal_input = true;
		this.vel.x = this.max_run_vel;
	}else if (this.x + this.rb/2 > (map.MAP_WIDTH * Tile.WIDTH / 2) + 10){
		this.facing = Facing.LEFT;
		this.horizontal_input = true;
		this.vel.x = -this.max_run_vel;
	}else if (this.y <= this.fly_height){	
		this.boss_form = 2;
		this.transforming = true;
		this.transform_time = 0;
		this.prev = ["boss_two_sheet", 64, 32, this.x, this.y, 0, 0, 32, 56];
		this.next = ["boss_three_sheet", 128, 64, this.x, this.y, 32, 32, 64, 108];
		
		map.camera.instant = false;
		map.camera.speed = 0;
	}
}

Boss.prototype.ScriptThree = function(delta, map){	
	var num_children = 0;
	var num_real_children = 0;
	var num_minions = 0;
	for (var i = 0; i < map.entities.length; i++){
		if (map.entities[i].type === "Boss"){
			if (map.entities[i].count_me){
				num_children++;
			}
			num_real_children++;
		}
		else if (map.entities[i].type === "Critter" && map.entities[i].critter_id === 4){
			num_minions++;
		}
	}
	
	this.max_run_vel = 0.33;
	this.animation.frame_delay = 12;
	this.horizontal_input = true;
	this.frolick_time++;
	if (this.frolick_time >= this.frolick_time_limit){
		this.frolick_time = 0;
		if (num_minions < 4){
			var fire = new Fire(this.x + this.rb/2, this.y + this.bb/2);
			fire.hurt_time_limit = 6;
			fire.gravity = true;
			fire.terminal_vel = 0.5;
			fire.life = fire.life_limit * -4;
			map.entity_queue.push(fire);
		}
	}
	
	if (this.horizontal_collision){		
		if (this.facing === Facing.LEFT){
			this.facing = Facing.RIGHT;
		}else{
			this.facing = Facing.LEFT;
		}
	}
	
	if (this.facing === Facing.LEFT)
		this.vel.x = -this.max_run_vel;
	else this.vel.x = this.max_run_vel;

	if (this.y > this.fly_height) this.StartJump();
	else{ 
		this.can_hurt = true;
		this.StopJump();
	}

	if (num_real_children < 2){
		if (this.horizontal_collision){
			var baby = new Boss(this.x + 48, this.y);
			if (this.facing === Facing.RIGHT)
				baby.x -= 40;
			else baby.x += 32;
			baby.momma = this;
			if (!is_new_game_plus){
				baby.can_hurt = false;
				baby.can_get_hurt = false;
				baby.HP = 1;
			}else{
				baby.HP = 3;
			}
			if (!is_new_game_plus){
				baby.img_name = "baby_one_sheet";
				baby.image = resource_manager.baby_one_sheet;
			}else{
				baby.img_name = "baby_fire_sheet";
				baby.image = resource_manager.baby_fire_sheet;
			}
			map.entity_queue.push(baby);
			
			baby.terminal_vel = 0.5;
			baby.original_grav_acc = 0.1;
			baby.grav_acc = 0.1;
			baby.jump_vel = 1.0;
			baby.jump_time_limit = 30;
			baby.original_fly_height = 312 - (num_children*40);
			if (num_children === 0){
				baby.count_me = true;
			}
			baby.fly_height = baby.original_fly_height;
			this.fly_height -= 26;
			baby.StartJump = function(){
				this.vel.y = -this.jump_vel;
				this.is_jumping = true;
				this.jump_timer = 0;
				this.on_ground = false;
			}
			
			if (num_children === 1){
				if (!is_new_game_plus){
					map.Speak("ride the stone monkeys up.\nshoot the monkey king from the side\nshoot fire to put it out!", 9999);
					console.log("speaking");
				}
			}
		}
	}
}

Boss.prototype.ScriptFour = function(delta, map){	
	this.max_run_vel = 1.5;
	this.animation.frame_delay = 12;
	
	if (!this.stunned){
		this.horizontal_input = true;
		
		this.fire_time++;
		if (!this.zen && this.fire_time >= this.fire_time_limit){
			this.fire_time = 0;
			var fire = new Fire(this.x + this.rb/2, this.y + this.bb/2);
			fire.gravity = true;
			fire.life = fire.life_limit * -1.5;
			if (is_new_game_plus)
				fire.magnet = true;
			map.entity_queue.push(fire);
		}
		if (this.horizontal_collision){		
			/*if (map.player.y <= 200)
				this.fly_height = map.player.y + map.player.bb/2;*/
			this.fly_height = Math.floor(Math.random()*136);
			if (this.facing === Facing.LEFT){
				this.facing = Facing.RIGHT;
			}else{
				this.facing = Facing.LEFT;
			}
		
			if (map.player.has_wings){
				this.frolick_count++;
				if (this.frolick_count >= this.frolick_limit){
					this.frolick_count = 0;
					this.stunned = true;
				}
			}
		}
		
		this.frolick_time++;
		if (!this.zen && this.frolick_time >= this.frolick_time_limit){
			this.frolick_time = 0;
			var fire = new Fire(this.x + this.rb/2, this.y + this.bb/2);
			fire.life = 0;
			fire.z_index = this.z_index+100;
			map.entity_queue.push(fire);
			//Utils.playSound("awaken", master_volume, 0);
		}
		
		if (this.facing === Facing.LEFT)
			this.vel.x = -this.max_run_vel;
		else this.vel.x = this.max_run_vel;

		if (this.y > this.fly_height) this.StartJump();
		else{ 
			this.can_hurt = true;
			this.StopJump();
		}
	}else{
		this.BlowFire(delta, map);
	}
}

Boss.prototype.BlowFire = function(delta, map){
	if (this.y > 72) this.StartJump();
	else{ 
		this.can_hurt = true;
		this.StopJump();
	}
	if (this.x + this.lb + this.rb/2 < map.MAP_WIDTH*Tile.WIDTH/2 - 1){
		this.x = this.x+=0.4;
		return;
	}else if (this.x + this.lb + this.rb/2 > map.MAP_WIDTH*Tile.WIDTH/2 + 1){
		this.x = this.x-=0.4;
		return;
	}

	this.stun_time+=1;
	if (this.stun_time >= this.stun_time_limit*2){
		this.stun_time = 0;
		this.stunned = false;
	}
	if (this.stun_time % 8 !== 0 || this.zen) return;

	var fire = new Fire(this.x+this.lb + this.rb/2, this.y+this.bb/2);
	fire.life = -(fire.life_limit/2);
	fire.gravity = true;
	fire.original_grav_acc = 0;
	fire.grav_acc = 0;
	fire.z_index = this.z_index+100;
	var vely = 0;
	
	var st = this.stun_time % this.stun_time_limit;
	fire.vel.x = fire.max_run_vel * Math.cos(Math.PI*2*st/this.stun_time_limit);
	vely = -1 * (fire.max_run_vel * Math.sin(Math.PI*2*st/this.stun_time_limit));
	
	map.entity_queue.push(fire);
	fire.Update = function(delta, map){
		this.y += vely;
		Fire.prototype.Update.call(this, delta, map);
	}
	
	if (this.facing === Facing.LEFT) fire.vel.x = -fire.vel.x;
}

Boss.prototype.HurtEnemies = function(delta, map){
	var q = 3;
	var p = 3 * (this.boss_form + 1);
	var pq = 2 + (this.boss_form * 4);
	var x = this.x;
	var y = this.y;
	var lb = this.lb;
	var tb = this.tb;
	var rb = this.rb;
	var bb = this.bb;
	var can_get_hurt = this.can_get_hurt;
	for (var i = map.entities.length-1; i >= 0; i--){
		if (map.entities[i] !== undefined && map.entities[i].type === "Critter" && !map.entities[i].delete_me){
			var critter = map.entities[i];
			if (critter.beserking){
				if (can_get_hurt && this.IsRectColliding(critter, x+lb+q, y+tb+q,x+rb-q,y+bb-q)){
					this.HP -= this.sensitivity;
					room_manager.num_hit++;
					if (room_manager.num_hit > room_manager.biggest_combo){
						room_manager.biggest_combo = room_manager.num_hit;
					}
					if (room_manager.num_hit % 10 === 0){
						map.player.combo = true;
						map.player.combo_time = 0;
						Utils.playSound("frenzyStart", master_volume, 0);
						for (var i = 0; i < 5; i++){
							room_manager.critter_queue.unshift([3, false]);
						}
					}
					
					if (!this.hurt){
						this.prev_vel.x = this.vel.x;
						this.prev_vel.y = this.vel.y;
					}
					this.hurt = true;
					this.hurt_time = 0;
					
					if (this.momma === null)
						can_get_hurt = false;
					if (!this.healing) map.Speak(null);
					
					Utils.playSound("LA_Chest_Open", master_volume, 0);
					critter.delete_me = true;
					continue;
				}
			}else if (!critter.invincible && critter.on_ground && this.momma === null){		
				if ((this.facing === Facing.LEFT && this.IsRectColliding(critter, x+lb, y+tb+p, x+lb+pq, y+bb-p)) ||
						(this.facing === Facing.RIGHT && this.IsRectColliding(critter, x+rb-pq, y+tb+p, x+rb, y+bb-p))){
					Utils.playSound("locked", master_volume, 0);
					critter.delete_me = true;
					continue;
				}
				if (this.boss_form >= 2 && this.can_hurt){
					if (this.facing === Facing.LEFT && this.IsRectColliding(critter, x+lb, y+bb/2, x+rb/2, y + bb) || this.facing === Facing.RIGHT && this.IsRectColliding(critter, x+rb/2, y+bb/2, x+rb, y + bb) ||
							this.IsRectColliding(critter, x+lb+bb/2, y+tb, x+rb-bb/2, y+bb)){
						Utils.playSound("locked", master_volume, 0);
						critter.delete_me = true;
						continue;
					}
				}
			}
		}
	}
	
	if (!this.zen && ((this.facing === Facing.LEFT && this.IsRectColliding(map.player, x+lb, y+tb+p, x+lb+pq, y+bb-p)) ||
			(this.facing === Facing.RIGHT && this.IsRectColliding(map.player, x+rb-pq, y+tb+p, x+rb, y+bb-p)))){
		map.player.Hurt();
	}
	if ((this.boss_form >= 2 && this.can_hurt && !this.zen) || (this.boss_form === 0 && is_new_game_plus)){
		if (this.facing === Facing.LEFT && this.IsRectColliding(map.player, x+lb, y+bb/2, x+rb/2, y + bb) || this.facing === Facing.RIGHT && this.IsRectColliding(map.player, x+rb/2, y+bb/2, x+rb, y + bb) ||
				this.IsRectColliding(map.player, x+rb/4+bb/2, y+bb/2, x+rb-bb/2, y+bb)){
			map.player.Hurt();
		}
	}
}

//RENDER
Boss.prototype.UpdateAnimationFromState = function(){
	if (this.hurt && this.hurt_time < this.hurt_time_limit/2){
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

Boss.prototype.Render = function(ctx, camera){
	GameMover.prototype.Render.call(this, ctx, camera);
	if (this.momma !== null || this.boss_form === 5 || this.zen || this.transforming) return;
	
	ctx.fillStyle = "#000000";
	ctx.fillRect(8*(4/VIEW_SCALE), 108*(4/VIEW_SCALE), 128*(4/VIEW_SCALE), 8*(4/VIEW_SCALE));
	ctx.fillStyle = "#ff0000";
	if (this.boss_form === 4)
		ctx.fillStyle = "#000000";
	ctx.fillRect(9*(4/VIEW_SCALE), 109*(4/VIEW_SCALE), 126*(4/VIEW_SCALE), 6*(4/VIEW_SCALE));
	ctx.fillStyle = "#00ff00";
	if (this.boss_form === 4)
		ctx.fillStyle = "#bb00bb";
	if (this.HP < 0) this.HP = 0;
	ctx.fillRect(9*(4/VIEW_SCALE), 109*(4/VIEW_SCALE), ~~(126*(this.HP / this.maxHP))*(4/VIEW_SCALE), 6*(4/VIEW_SCALE));
}