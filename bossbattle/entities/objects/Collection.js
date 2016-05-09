function Collection(x, y, collection_id){
	GameMover.call(this, x, y, 2, 2, 14, 16, "collection_sheet");
	this.type = "Collection";
	this.collide_entities = false;
	this.collection_id = collection_id;
	//this.animation.frame_delay = 30;
	
	var ani_x = Math.floor(this.collection_id / 6) * 2;
	var ani_y = this.collection_id % 6;
	this.animation.Change(ani_x, ani_y, 2);
	this.terminal_vel = 0.3;
	
	this.z_index = -28;
}
Collection.prototype.Import = function(obj){
	GameMover.prototype.Import.call(this, obj);
	this.collection_id = obj.collection_id;
	
	var ani_x = Math.floor(this.collection_id / 6) * 2;
	var ani_y = this.collection_id % 6;
	this.animation.Change(ani_x, ani_y, 2);
}

Collection.prototype.Export = function(){
	var obj = GameMover.prototype.Export.call(this);
	obj.collection_id = this.collection_id;
	return obj;
}
extend(GameMover, Collection);

Collection.prototype.Update = function(delta, map){
	if (this.IsColliding(map.player) && this.visible){
		this.visible = false;
		this.delete_me = true;
		room_manager.num_artifacts++;
		//room.Speak("item get: "+this.GetName(), true);
		this.GetEvent(delta, map);
	}
	
	GameMover.prototype.Update.call(this, delta, map);
}

Collection.prototype.UpdateAnimationFromState = function(){
}

Collection.prototype.GetName = function(){
	switch (this.collection_id){
		case 0: return "full restore";
		case 1: return "wing powerup";
		default: break;
	}
}

Collection.prototype.GetEvent = function(delta, map){
	switch (this.collection_id){
		case 0:
			//room_manager.has_spellbook = true;
			map.player.maxHP++;
			map.player.HP = map.player.maxHP;
			Utils.playSound("LOZ_Get_Heart", master_volume, 0);
			break;
		case 1:		
			Utils.playSound("gainPower", master_volume, 0);
			map.player.WingMe();
			map.camera.y_lim = 80;
			map.camera.instant = false;
			map.camera.speed = 0;
			
			//SET THE ROOM ON FIRE
			for (var i = 0; i < 7; i++){
				room_manager.timeout_queue.push(window.setTimeout(function(){
					var fire = new Fire(56 + this.i*16, 320);
					fire.forever = true;
					this.map.entity_queue.push(fire);
					fire = new Fire(248 - this.i * 16, 320);
					fire.forever = true;
					this.map.entity_queue.push(fire);
					Utils.playSound("awaken", master_volume, 0);
				}.bind({map: map, i: i}), i*1000));
			}
			break;
		case 2:
			map.player.magnet = true;
			//SET THE ROOM ON FIRE
			for (var i = 0; i < 7; i++){
				room_manager.timeout_queue.push(window.setTimeout(function(){
					var fire = new Fire(56 + this.i*16, 320);
					fire.forever = true;
					this.map.entity_queue.push(fire);
					fire = new Fire(248 - this.i * 16, 320);
					fire.forever = true;
					this.map.entity_queue.push(fire);
					Utils.playSound("awaken", master_volume, 0);
				}.bind({map: map, i: i}), i*1000));
			}
			break;
		default: break;
	}
}