"strict mode";

var PLAYER_SPEED = 0.02
var FRICTION = .9
var GRAVITY = -0.002
var HEAD_HEIGHT = 10
var STEP_HEIGHT = 2.5
var NUDGE = 0.01
var SNAP_DISTANCE = 2

/*
	Player state at one tick
 */
function Player(id, version) {
	this.position = new THREE.Vector3(0, 300, 0)
	this.stop()
	this.look = new THREE.Euler()
	this.velocity = new THREE.Vector3()
	this.look.reorder("YXZ")
	this.id = id
	this.version = version | 0
	this.grounded = false
	this.shieldUp = false
}

Player.prototype.stop = function() {
	this.movement = {
		forward: 0,
		back: 0,
		left: 0,
		right: 0
	}
}

/*
	Event handling
 */
Player.prototype.evaluate = function(time, event, sendmess) {
	switch(event.type) {
		case "shield":
			this.shieldUp = event.change
			console.log("shield", this.shieldUp ? "up" : "down")
			break
		case "mousemove":
			this.look.x += event.mouse.x
			this.look.y += event.mouse.y
			var max = Math.PI/2
			if(this.look.x < -max) {
				this.look.x = -max
			} else if(this.look.x > max) {
				this.look.x = max
			}
			break
		case "keydown":
		case "keyup":
			for(var direction in event.movement) {
				this.movement[direction] = event.movement[direction]
			}
			break
	}
}

Player.prototype.getLookDirection = function() {
	var direction = new THREE.Vector3(0, 0, -1)		// The camera is looking down internaly
	var quaternion = new THREE.Quaternion()
	quaternion.setFromEuler(this.look)
	direction.applyQuaternion(quaternion)
	direction.normalize()
	return direction
}

Player.prototype.update = function(deltatime, collisionMap) {
	if (this.grounded) {
		var acceleration = new THREE.Vector3(
			this.movement.right - this.movement.left,
			0,
			this.movement.back - this.movement.forward
		)
		var quaternion = new THREE.Quaternion()
		quaternion.setFromEuler(this.look)
		acceleration.applyQuaternion(quaternion)

		acceleration.y = 0		// No fly
		acceleration.setLength(PLAYER_SPEED * deltatime)
		this.velocity.add(acceleration)
		this.velocity.multiplyScalar(FRICTION)
	} else {
		//TODO> whatever we want to do while in the air
	}

	this.velocity.y += GRAVITY * deltatime

	var change = this.velocity.clone()
	var horChange = new THREE.Vector3(change.x, 0, change.z)

	var from = this.position.clone()
	var direction = horChange.clone().normalize()
	//direction.y -= HEAD_HEIGHT
	from.y += STEP_HEIGHT
	var ray = new THREE.Raycaster(from, direction, 0, change.length() + NUDGE)

	var hits = ray.intersectObject(collisionMap, true)
	if (hits.length > 0) {
		horChange.setLength(hits[0].distance - NUDGE)
		change.x = horChange.x
		change.z = horChange.z
	}

	from.add(horChange)
	from.y += HEAD_HEIGHT - STEP_HEIGHT
	ray.set(from, new THREE.Vector3(0, -1, 0)) //TODO set near and far
	if (this.grounded) {
		ray.far = HEAD_HEIGHT + SNAP_DISTANCE
	} else {
		ray.far = HEAD_HEIGHT - change.y
	}
	hits = ray.intersectObject(collisionMap, true)
	if(hits.length > 0) {
		change.y -= hits[0].distance - HEAD_HEIGHT - NUDGE
		this.grounded = true	
	} else {
		this.grounded = false
	}
	
	this.position.add(change)
	//TODO raytrace, if hit, move there set grounded
	//if not and grounded trace down, if hit move done else set grounded to false
}

/*
	Player event type
 */
function PlayerEvent(event) {
	this.type = event.type
	switch(event.type) {
		case "mousemove":
			this.mouse = new THREE.Vector2()
			this.mouse.y = event.movementX || event.mozMovementX || event.webkitMovementX || 0
			this.mouse.x = event.movementY || event.mozMovementY || event.webkitMovementY || 0
			this.mouse.multiplyScalar(-0.002)
			break
		case "mouseup":
			if(event.button === 2) {
				this.type = "shield"
				this.change = false
			}
			break
		case "mousedown":
			switch(event.button) {
				case 0:
					this.type = "fire"
					break
				case 2:
					this.type = "shield"
					this.change = true
					break
			}
			break
		case "keydown":
		case "keyup":
			var change
			if(event.type === "keydown") {
				change = 1
			} else {
				change = 0
			}
			this.movement = {}
			switch ( event.keyCode ) {
				case 38: // up
				case 87: // w
				case 188: // , (for dvorak)
					this.movement.forward = change
					break
				case 37: // left
				case 65: // a (both for qwerty and dvorak)
					this.movement.left = change
					break
				case 40: // down
				case 83: // s
				case 79: // o (for dvorak)
					this.movement.back = change
					break
				case 39: // right
				case 68: // d
				case 69: // e (for dvorak)
					this.movement.right = change
					break
			}
			break
	}
}

/*
	Player model data
 */
function PlayerModel(id, version) {
	THREE.Object3D.call(this)
	this.id = id
	this.version = version
	this.body = new THREE.Mesh(new THREE.CubeGeometry(5, 10, 5))
	this.body.position.y = 8
	this.add(this.body)

	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
	this.body.add(this.camera)
	this.camera.position.y = 1.8

	var manager = new THREE.LoadingManager()
	manager.onProgress = function(item, loaded, total) {
		console.log(item, loaded, total)
	}
	var loader = new THREE.OBJLoader(manager)
	var that = this

	var shotorigin = new THREE.Object3D()
	shotorigin.name = "shotorigin" // get by using getObjectByName("shotorigin")
	this.camera.add(shotorigin)
	shotorigin.position.x = 1.75
	shotorigin.position.z = -6.5
	shotorigin.position.y = -1

	//TODO: don't load this when only used for collision
	loader.load("assets/grandfather_gun.obj", function(gun) {
		that.camera.add(gun)
		gun.position.z = -2
		gun.position.y = -1
		gun.position.x = -1.5
		gun.scale.multiplyScalar(1.5)
		gun.rotation.y = -Math.PI / 2
	})
}

PlayerModel.prototype = Object.create(THREE.Object3D.prototype)

PlayerModel.prototype.update = function(playerstate) {
	this.position = playerstate.position
	this.rotation.y = playerstate.look.y
	this.camera.rotation.x = playerstate.look.x
}