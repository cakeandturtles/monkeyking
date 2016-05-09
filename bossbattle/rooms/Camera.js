function Camera(x, y){
	this.screen_offset_x = 0;
	this.screen_offset_y = 0;

	this.x = x || 0;
	this.y = y || 0; 
	this.width = 640;
	this.height = 480;
	this.x_lim = 80;
	this.y_lim = 20;
	
	this.temp_monkey = null;
	this.transform_after_time = 0;
	
	this.instant = true;
	this.speed = 1.5;
}
		
Camera.prototype.Update = function(delta, map){
	if (this.speed < 5.0)
		this.speed += 0.1;
	else this.instant = true;
	

	this.width = 640 / VIEW_SCALE;
	this.height = 480 / VIEW_SCALE;

	var player = map.player;
	this.x_lim = 80;
	if (input_manager.key_manager.keys_down[InputManager.RELEASE]){
		this.x_lim = 30;
		if (this.temp_monkey !== null){
			if (this.temp_monkey.delete_me && map.boss.hurt){
				this.temp_monkey = map.boss; //THE BOSS...
			}else{
				player = this.temp_monkey;
			}
		}else{
			for (var i = 0; i < map.entities.length; i++){
				if (map.entities[i].type === "Critter" && map.entities[i].beserking && !map.entities[i].camera_man && map.boss.boss_form < 4){
					player = map.entities[i];
					this.temp_monkey = map.entities[i];
					map.entities[i].camera_man = true;
					break;
				}
			}
		}
	}else if (input_manager.key_manager.keys_up[InputManager.RELEASE]){
		this.temp_monkey = null;
		for (var i = 0; i < map.entities.length; i++){
			if (map.entities[i].type === "Critter" && map.entities[i].beserking){
				map.entities[i].camera_man = true;
			}
		}
	}
	if (room.boss.transforming || room.boss.boss_form === 99){
		player = room.boss;
		if (player.boss_form === 2)
			this.x_lim = 30;
		else 
			this.x_lim = 50;
			
		if (this.instant) this.x_lim = 20;
		
		this.transform_after_time = 1;
	}else if (this.transform_after_time > 0){
		player = room.boss;
		this.x_lim = 30;
	
		this.transform_after_time++;
		if (this.transform_after_time >= 60){
			this.transform_after_time = 0;
			this.instant = false;
			this.speed = 0;
		}
	}
	
	//Horizontal panning RIGHT	
	if (player.x + player.rb + this.x_lim - this.x >= this.width){
		if (this.x < map.MAP_WIDTH * Tile.WIDTH - this.width){
			if (this.instant)
				this.x = (player.x + player.rb + this.x_lim) - this.width;
			else{
				this.x += (this.speed) * (delta/DNUM);
			}
		}
	} 
	
	//HOrizontal panning LEFT
	if (player.x + player.lb - this.x_lim - this.x <= 0){
		if (this.x > 0){
			if (this.instant)
				this.x = (player.x + player.lb - this.x_lim);
			else{ 
				this.x -= (this.speed) * (delta/DNUM);
			}
		}
	}
	
	//Vertical panning DOWN
	if (player.y + player.bb + this.y_lim - this.y >= this.height){
		if (this.y < map.MAP_HEIGHT * Tile.HEIGHT - this.height){
			if (this.instant)
				this.y = (player.y + player.bb + this.y_lim) - this.height;
			else{
				this.y += (this.speed) * (delta/DNUM);
			}
		}
	} //vertical panning UPWARD
	if (player.y + player.tb - this.y_lim - this.y <= 0){
		if (this.y > 0){
			if (this.instant)
				this.y = (player.y + player.tb - this.y_lim);
			else{
				this.y -= (this.speed) * (delta/DNUM);
			}
		}
	}
	
	if (this.x >= map.MAP_WIDTH * Tile.WIDTH - this.width)
		this.x = map.MAP_WIDTH * Tile.WIDTH - this.width;
	if (this.x <= 0) this.x = 0;
	
	if (this.y >= map.MAP_HEIGHT * Tile.HEIGHT - this.height)
		this.y = map.MAP_HEIGHT * Tile.HEIGHT - this.height;
	if (this.y <= 0) this.y = 0;
}