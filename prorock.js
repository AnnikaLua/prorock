//Prorock Schwerkraftsimulator v0.0.3
//© 2018 Joel Zeller

'use strict';

var settings = {
    "rocket": //Einstellungen für die Rakete
    {
        "thrust": 0.1, //Schub
        "rotationSpeed": 0.025, //Drehgeschwindigkeit
        "color": "white", //Farbe
        "startPosition":
        {
            "x": 0,
            "y": -500
        }
    },
    "planets": //Einstellungen für die Planeten
    {
        "0":
        {
            "position":
            {
                "x": 0,
                "y": 0
            },
            "radius": 500,
            "gravity": 20000,
            "color": "blue"
        },
        "1":
        {
            "position":
            {
                "x": 5000,
                "y": 1000
            },
            "radius": 500,
            "gravity": 20000,
            "color": "red"
        }
    },
    "ui":
    {
        "canvasID": "prorock",
        "containerID": "container",
        "zoomInID": "zoomin",
        "zoomOutID": "zoomout",
        "gravityID": "gravity",
        "resetID": "reset",
        "trailCheckboxID": "trail",
        "trailLengthID": "trailLength"
    },
    "controls":
    {
        "thrust": "ArrowUp",
        "turnLeft": "ArrowLeft",
        "turnRight": "ArrowRight",
        "reset": "KeyR",
        "pause": "KeyP"
    }
};

function init() {
    var canvas = document.getElementById(settings.ui.canvasID);

    if (!canvas.getContext) {
        window.alert("Fehler: Kein Canvas gefunden!");
        return;
    }
    var simulation = new Simulation(canvas);
    var graphics = new Graphics(canvas, simulation);
    var ui = new UI(simulation, graphics);

    function animate (time) {
        simulation.simulate(time);
        graphics.render();
        requestAnimationFrame(animate);
    }

    graphics.resizeCanvas();
    animate();
}

class UI {
    constructor (simulation, graphics) {
        this.simulation = simulation;
        this.graphics = graphics;
        this.zoomIn = document.getElementById(settings.ui.zoomInID);
        this.zoomOut = document.getElementById(settings.ui.zoomOutID);
        this.trailCheckbox = document.getElementById(settings.ui.trailCheckboxID);
        this.trailLength = document.getElementById(settings.ui.trailLengthID);
        this.resetButton = document.getElementById(settings.ui.resetID);

        this.trailCheckbox.checked = simulation.rocket.showTrail;
        this.trailLength.value = simulation.rocket.trailLength;

        this.zoomIn.addEventListener('click', graphics.zoomIn.bind(graphics));
        this.zoomOut.addEventListener('click', graphics.zoomOut.bind(graphics));
        this.trailCheckbox.addEventListener('input', function () {
            simulation.rocket.showTrail = this.checked;
        });
        this.trailLength.addEventListener('input', function () {
            simulation.rocket.trailLength = this.value;
        });
        this.resetButton.addEventListener('click', simulation.reset.bind(simulation));
    }
}

class Graphics {
    constructor (canvas, simulation) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.container = document.getElementById(settings.ui.containerID);
        this.simulation = simulation;
        this.canvasOffset = new Vector(0, 0);
        this.zoomRange = [1, 12];
        this.zoomValue = 3;
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.canvas.addEventListener('mousedown', this.mouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.mouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.mouseUp.bind(this));
        this.mouse = false;
        this.mouseMovement = undefined;
        this.canvasOffset = new Vector(0, 0);
        this.boundMouseMove = this.mouseMove.bind(this);
    }

    set zoom (z) {
        if (z > this.zoomRange[1]) {
            this.zoomValue = this.zoomRange[1];
        } else if (z < this.zoomRange[0]) {
            this.zoomValue = this.zoomRange[0];
        } else {
            this.zoomValue = z;
        }
        this.transformCanvas();
    }
    get zoom () {
        return this.zoomValue;
    }

    render () {
        this.clearCanvas();
        this.simulation.drawPlanets();
        this.simulation.rocket.draw();
    }

    clearCanvas () {
        this.context.save();
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.restore();
    }
    
    resizeCanvas () {
        this.canvas.width = 300;
        this.canvas.height = 150;
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.transformCanvas();
    }

    transformCanvas () {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.translate((this.canvas.width / 2) + this.canvasOffset.x, (this.canvas.height / 2) + this.canvasOffset.y);
        this.context.scale(1 / (this.zoom ** 1.5), 1 / (this.zoom ** 1.5));
    }

    zoomIn () {
        this.zoom -= 1;
    }
    zoomOut () {
        this.zoom += 1;
    }

    mouseDown(evt) {
        if (!this.mouse) {
            this.canvas.classList.add('moving');
            this.canvas.addEventListener('mousemove', this.boundMouseMove);
        }
    }
    mouseUp(evt) {
        this.mouse = false;
        this.canvas.classList.remove('moving');
        this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    }
    mouseMove(evt) {
        if (this.mouse) {
            this.mouseMovement = new Vector(evt.movementX, evt.movementY);
            this.canvasOffset.add(this.mouseMovement);
            this.transformCanvas();
        } else {
            this.mouse = true;
        }
    }
}

class Control {
    constructor(rocket) {
        window.addEventListener('keydown', this.keyDown.bind(this));
        window.addEventListener('keyup', this.keyUp.bind(this));
        this.heldKeys = [];
        this.rocket = rocket;
    }
    keyDown(evt) {
        if (this.heldKeys[evt.key]) {
            return;
        }
        if (evt.key === settings.controls.thrust) {
            this.rocket.thrusting = true;
        } else if (evt.key === settings.controls.turnLeft) {
            this.rocket.rotation -= this.rocket.rotSpeed;
        } else if (evt.key === settings.controls.turnRight) {
            this.rocket.rotation += this.rocket.rotSpeed;
        }
        this.heldKeys[evt.key] = true;
    }

    keyUp(evt) {
        if (evt.key == settings.controls.thrust) {
            this.rocket.thrusting = false;
        } else if (evt.key === settings.controls.turnLeft) {
            this.rocket.rotation += this.rocket.rotSpeed;
        } else if (evt.key === settings.controls.turnRight) {
            this.rocket.rotation -= this.rocket.rotSpeed;
        }
        delete this.heldKeys[evt.key];
    }
}

class Simulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.loop = function () {
            this.running = true;
            while (this.running) {
                this.running = false;
            }
        };
        this.rocket = new Rocket(new Vector(settings.rocket.startPosition.x, settings.rocket.startPosition.y), 0, 5, this.ctx);
        this.planets = [];
        var s = settings.planets;
        for (var planet in s) {
            this.planets.push(new Planet(Object.assign(new Vector(0, 0), s[planet].position), s[planet].radius, s[planet].gravity, s[planet].color, this.ctx));
        }
    }
    render() {
        this.clearCanvas();
        this.drawPlanets();
        this.rocket.updateTrail();
        if(this.rocket.showTrail) {
            this.rocket.drawTrail();
        }
        this.rocket.draw();
    }
    drawPlanets() {
        this.planets.forEach(function (v) {
            v.draw();
        });
    }

    simulate () {
        this.gravitate();
        this.rocket.rotate(this.rocket.rotation);
        this.rocket.move(this.rocket.velocity);
        this.checkCollision();
    }

    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    gravitate() {
        this.planets.forEach (function (planet) {
            var acceleration = planet.pos.clone().subtract(this.rocket.pos);
            var distance = acceleration.length;
            acceleration.normalize().multiply(planet.gravity / (distance ** 2));
            this.rocket.accelerate(acceleration);
        }, this);
    }
    checkCollision() {
        this.planets.forEach(function (planet) {
            if (this.rocket.pos.clone().subtract(planet.pos).length < planet.radius) {
                var angle = this.rocket.pos.clone().subtract(planet.pos).angle;
                this.rocket.velocity.rotate(-angle);
                this.rocket.velocity.y = 0;
                this.rocket.velocity.rotate(angle);
                this.rocket.velocity.multiply(0.9);
                this.rocket.pos.subtract(planet.pos).normalize();
                this.rocket.pos.multiply(planet.radius);
                this.rocket.pos.add(planet.pos);
                if (this.rocket.velocity.length < 0.05) {
                    this.rocket.velocity.multiply(0);
                }
            }
        }, this);
    }
    createPlanet(planet) {
        this.planets.push(new Planet(Object.assign(Vector(0, 0), planet.position), planet.radius, planet.gravity, planet.color, this.context));
    }

    reset () {
        Object.assign(this.rocket.pos, settings.rocket.startPosition);
        this.rocket.velocity.multiply(0);
        this.rocket.attitude = 0;
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    rotate(phi) {
        var xt, yt;
        xt = ((this.x * Math.cos(phi)) - (this.y * Math.sin(phi)));
        yt = ((this.x * Math.sin(phi)) + (this.y * Math.cos(phi)));
        this.x = xt;
        this.y = yt;
        return this;
    }
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }
    subtract(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }
    dot(vector) {
        var theta = this.angle + vector.angle;
        return (this.length * vector.length * Math.cos(theta));
    }
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    set length(l) {
        this.normalize().multiply(l);
    }
    normalize() {
        this.multiply(1 / this.length);
        return this;
    }
    get angle() {
        var angle = Math.asin(this.x / this.length);
        if (this.y < 0) {
            return angle;
        } else {
            return Math.PI - angle;
        }
    }
    set angle(a) {
        this.rotate(a - this.angle);
        return this;
    }
    clone() {
        return new Vector(this.x, this.y);
    }
}

class Shape {
    constructor(list, fillStyle) {
        this.points = [];
        list.forEach(function (v, i, a) {
            var vector = new Vector(v[0], v[1]);
            this.points.push(vector);
        }, this);
        this.fillStyle = fillStyle;
    }
    rotate(phi) {
        this.points.forEach(function (v, i, a) {
            v.rotate(phi);
        });
    }
    scale(scalar) {
        this.points.forEach(function (v, i, a) {
            v.multiply(scalar);
        });
    }
    move(position) {
        this.points.forEach(function (v, i, a) {
            v.add(position);
        });
    }
    fill(context) {
        this.draw(context);
        context.fill();
    }
    stroke(context) {
        this.draw(context);
        context.stroke();
    }
    strokeGradient(context, gradient) {
        context.lineCap = 'round';
        this.points.forEach(function (v, i, a) {
            if (i == 0) {
                context.moveTo(v.x, v.y);
            } else {
                context.beginPath();
                context.moveTo(a[i - 1].x, a[i - 1].y);
                context.lineTo(v.x, v.y);
                context.strokeStyle = gradient.color(i / this.points.length).toString();
                context.stroke();
            }
        }, this);
    }
    draw(context) {
        context.beginPath();
        this.points.forEach(function (v, i, a) {
            if (i == 0) {
                context.moveTo(v.x, v.y);
            } else {
                context.lineTo(v.x, v.y);
            }
        });
    }
    addPoint(vector) {
        this.points.push(vector);
    }
    removePoint() {
        this.points.shift();
    }
    clone() {
        var shape = new Shape([], this.fillStyle);
        this.points.forEach(function (v, i, a) {
            shape.addPoint(new Vector(v.x, v.y));
        });
        return shape;
    }
    get length() {
        return this.points.length;
    }
    set length(l) {
        while (this.length > l) {
            this.removePoint();
        }
    }
}

class Rocket {
    constructor(pos, rot, size, context) {
        this.pos = pos;
        this.attitude = rot;
        this.size = size;
        this.ctx = context;
        this.throttle = 0.1;
        this.thrusting = false;
        this.rotSpeed = settings.rocket.rotationSpeed;
        this.rotation = 0;
        this.velocity = new Vector(0, 0);
        this.shape = new Shape([[2, 4], [2, -4], [0, -7], [-2, -4], [-2, 4]], 'white');
        this.control = new Control(this);
        this.trail = new Shape([], 'green');
        this.trailLength = 100;
        this.showTrail = false;
        this.trailGradient = new Gradient([new Color(0, 0, 0, 1), 0], [new Color(0, 0.7, 0, 1), 0.3], [new Color(0, 1, 0), 1]);
        this.updateTrail();
    }

    draw() {
        if (this.showTrail) {
            this.drawTrail();
        }
        var shape = this.shape.clone();
        shape.rotate(this.attitude);
        shape.scale(this.size);
        shape.move(this.pos);
        this.ctx.fillStyle = 'white';
        shape.fill(this.ctx);
    }

    drawTrail() {
        this.ctx.lineWidth = 10;
        this.trail.strokeGradient(this.ctx, this.trailGradient);
    }

    updateTrail() {
        this.trail.addPoint(this.pos.clone());
        this.trail.length = this.trailLength;
        window.setTimeout(this.updateTrail.bind(this), 75);
    }

    turn(a) {
        this.attitude += a;
    }

    move() {
        if (this.thrusting) {
            this.thrust();
        }
        this.pos.add(this.velocity);
    }

    accelerate(acceleration) {
        this.velocity.add(acceleration);
    }

    thrust() {
        var thrust = new Vector(0, -1);
        thrust.rotate(this.attitude);
        thrust.multiply(this.throttle);
        this.accelerate(thrust);
    }

    rotate(rotation) {
        this.attitude += rotation;
    }
}

class Planet {
    constructor(pos, radius, gravity, color, context) {
        this.pos = pos;
        this.radius = radius;
        this.gravity = gravity;
        this.ctx = context;
        this.color = color;
    }
    draw() {
        this.ctx.fillStyle = this.color;
        this.ctx.beginPath();
        this.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();

    }
}

class Color {
    constructor(r, g, b, a) {
        if (!r) {
            this.r = 0;
        } else {
            this.r = r;
        }
        if (!g) {
            this.g = 0;
        } else {
            this.g = g;
        }
        if (!b) {
            this.b = 0;
        } else {
            this.b = b;
        }
        if (a == undefined) {
            this.a = 1;
        } else {
            this.a = a;
        }
    }

    get r () {
        return this.colorR;
    }
    set r (v) {
        if (v > 1) {
            this.colorR = 1;
        } else if (v < 0) {
            this.colorR = 0;
        } else {
            this.colorR = v;
        }
    }

    get g () {
        return this.colorG;
    }
    set g (v) {
        if(v > 1) {
            this.colorG = 1;
        } else if (v < 0) {
            this.colorG = 0;
        } else {
            this.colorG= v;
        }
    }

    get b () {
        return this.colorB;
    }
    set b (v) {
        if(v > 1) {
            this.colorB = 1;
        } else if (v < 0) {
            this.colorB = 0;
        } else {
            this.colorB = v;
        }
    }

    get a () {
        return this.alpha;
    }
    set a (v) {
        if(v > 1) {
            this.alpha = 1;
        } else if (v < 0) {
            this.alpha = 0;
        } else {
            this.alpha = v;
        }
    }

    multiply (color) {
        return Color.multiply(this, color);
    }
    static multiply (c1, c2) {
        return new Color(c1.r * c2.r, c1.g * c2.g, c1.b * c2.b, c1.a * c2.a);
    }

    add (color) {
        return Color.add(this, color);
    }
    static add (c1, c2) {
        return new Color(c1.r +c2.r, c1.g + c2.g, c1.b + c2.b, c1.a + c2.a);
    }

    interpolate (color, inter) {
        return Color.interpolate(this, color, inter);
    }
    static interpolate (c1, c2, inter) {
        return Color.add(Color.multiply(c1, new Color(1 -inter, 1 -inter, 1 -inter, 1 -inter)), this.multiply(c2, new Color(inter, inter, inter, inter)));
    }

    toString () {
        return "rgba(" + 
        Math.round(this.r * 255) + "," + 
        Math.round(this.g * 255) + "," + 
        Math.round(this.b * 255) + "," + 
        this.a + ")";
    }
}

class Gradient {
    constructor() {
        this.colors = [];
        for(var i = 0; i < arguments.length; i++) {
            this.colors.push(arguments[i]);
        }
        this.colors.sort(function (a, b) {
            if(a[1] > b[1]) {
                return 1;
            } else if (a[1] < b[1]) {
                return -1;
            } else if (a[1] == b[1]) {
                return 0;
            }
        });
    }
    color(value) {
        if(value > 1) {
            value = 1;
        }
        var index;
        for(index = 0; index < this.colors.length; index++) {
            if (this.colors[index][1] > value) {
                break;
            }
        }
        if (index == 0) {
            return this.colors[0][0];
        } else {
            value = (value - this.colors[index - 1][1]) / this.colors[index][1];
            return Color.interpolate(this.colors[index - 1][0], this.colors[index][0], value);
        }
    }
}

if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener("DOMContentLoaded", init);
}