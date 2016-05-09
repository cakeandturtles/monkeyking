function Checkpoint(x, y){
	GameSprite.call(this, x, y, 4, 5, 12, 16, "obj_sheet");
	this.type = "Checkpoint";
	this.checkpoint_id = Checkpoint.CHECKPOINT_ID;
	Checkpoint.CHECKPOINT_ID++;
	
	this.active = false;
	this.animation.Change(2, 0, 1);
	this.lex = 1;
	
	this.z_index = 9;
}
Checkpoint.CHECKPOINT_ID = 0;

Checkpoint.prototype.Import = function(obj){
	GameSprite.prototype.Import.call(this, obj);
	this.checkpoint_id = obj.checkpoint_id;
}

Checkpoint.prototype.Export = function(){
	var obj = GameSprite.prototype.Export.call(this);
	obj.checkpoint_id = this.checkpoint_id;
	return obj;
}

Checkpoint.prototype.Update = function(delta, map){
	GameSprite.prototype.Update.call(this, delta, map);
	
	if (this.IsColliding(map.player)){
		map.player.touching_checkpoint = true;
		if (!this.active){
			room_manager.ActivateCheckpoint(this);
			Utils.playSound("checkpoint", master_volume, 0);
			this.active = true;
			this.animation.Change(this.lex, 0, 2);
		}
	}
}
extend(GameSprite, Checkpoint);

Checkpoint.prototype.Deactivate = function(){
	this.active = false;
	this.animation.Change(this.lex+1, 0, 1);
}