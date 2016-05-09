function Fire(x, y){
	GameMover.call(this, x, y, 4, 4, 12, 16, "fire_sheet");
	this.type = "Fire";
	this.forever = false;
	this.life = 0;
	this.life_limit = 60;
	this.collide_entities = false;
	this.HP = 1;
	this.invincible = false;
	this.hurt = false;
	this.hurt_time = 0;
	this.hurt_time_limit = 1;
	
	this.z_index = 8;
	this.animation.Change(0, 0, 2);
	this.gravity = false;
	this.magnet = false;
	this.original_grav_acc = 0.1;
	this.terminal_vel = 1.0;
}
extend(GameMover, Fire);

Fire.prototype.Update = function(delta, map){
	this.horizontal_input = true;
	if (room_manager.anna_cheat_code){
		this.delete_me = true;
		return;
	}

	if (this.hurt){	
		this.hurt_time++;
		if (this.hurt_time >= this.hurt_time_limit){
			this.hurt_time = 0;
			this.hurt = 0;
		}
	}

	if (!this.forever){
		this.life++;
		if (this.life >= this.life_limit){
			this.visible = false;
			this.delete_me = true;
		}
	}
	
	
	if (this.visible){
		for (var i = map.entities.length-1; i >= 0; i--){
			if (map.entities[i].type === "Critter"){
				if (!map.entities[i].hurt && !map.entities[i].invincible && !map.entities[i].delete_me && this.IsColliding(map.entities[i])){
					if (map.entities[i].beserking){
						map.entities[i].terminal_vel = 7.0;
						map.entities[i].hurt = true;
						map.entities[i].hurt_time = 0;
						if (map.entities[i].beserking){
							map.entities[i].scared = true;
							if (!this.invincible && !this.forever){
								this.HP--;
								this.hurt = true;
								this.hurt_time = 0;
							}
						}
						map.entities[i].beserking = false;
						
						Utils.playSound("regrow", master_volume, 0);
						if (this.HP <= 0){
							this.delete_me = true;
							this.visible = false;
							break;
						}
					}else{
						Utils.playSound("kill", master_volume, 0);
						map.entities[i].delete_me = true;
					}
				}
			}
		}
		if (this.IsColliding(map.player)){
			map.player.Hurt();
		}
	}
	
	var nearby = false;
	var q = 128;
	if ((map.player.x < this.x + q + 2 && map.player.x + q + 2 > this.x) &&
			(map.player.y < this.y + q + 2 && map.player.y + q + 2 > this.y)){
		nearby = true;
	}
	
	if (this.gravity && (!this.magnet || !nearby)){
		GameMover.prototype.Update.call(this, delta, map);
	}else if (this.magnet && map.boss.boss_form !== 5){
		if (map.player.x > this.x + 2){
			this.x+=0.5;
		}else if (map.player.x + 2 < this.x){
			this.x-=0.5;
		}if (map.player.y > this.y + 2){
			this.y+=0.5;
		}else if (map.player.y + 2 < this.y){
			this.y-=0.5;
		}
		
		return;
	}
	else{
		GameSprite.prototype.Update.call(this, delta, map);
	}
	this.UpdateAnimationFromState();
}

Fire.prototype.UpdateAnimationFromState = function(){
	if (!this.hurt){
		if (this.forever || this.invincible){
			this.animation.Change(2, 0, 2);
		}else{
			this.animation.Change(0, 0, 2);
		}
	}else{
		this.animation.Change(0, 1, 2);
	}
	this.prev_move_state = this.move_state;
}

Fire.prototype.VerticalCollision = function(obj, q, fallthrough){
	//Check for top collisions
	if (this.vel.y < 0 && !fallthrough && this.IsRectColliding(obj, this.x + this.lb + q, this.y + this.tb + this.vel.y-1, this.x + this.rb - q, this.y + this.tb)){
		this.vel.y = 0;
		this.y = obj.y + obj.bb - this.tb;
	}
	
	//Check for bottom collisions
	if (this.vel.y >= 0 && this.IsRectColliding(obj, this.x + this.lb + q, this.y + this.bb, this.x + this.rb - q, this.y + this.bb + this.vel.y + 1)){
		//Don't count bottom collision for fallthrough platforms if we're not at the top of it
		if (fallthrough && (obj.y < this.y + this.bb || this.pressing_down))
			return false;
			
		if (!this.played_land_sound){
	//		Utils.playSound("land");
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