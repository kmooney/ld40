/* global THREE, ShipsLog, _*/
window.kbState = {};
window.mState = {};
window.debug = {};

window.addEventListener('keydown', function(evt) {
    "use strict";
    if (!window.kbState[evt.key]) { 
        window.kbState[evt.key] = true;
    }
    return false;
});

window.addEventListener('keyup', function(evt) {
    "use strict";
    if (window.kbState[evt.key]) {
        window.kbState[evt.key] = false;
    }
    return false;
});

window.addEventListener('keypress', function(evt) {
    "use strict";
    if (evt.key === "`" || evt.key === '~') {
        if (ShipsLog.visible()) {
            ShipsLog.hide();
        } else {
            ShipsLog.show();
        }
    }
});

window.addEventListener('wheel', function(e) {
    "use strict";
    window.mState.zoomOut = e.deltaY < -1 ? true : false;
    window.mState.zoomIn = e.deltaY > 1 ? true : false;
});

window.addEventListener('mousemove', function(e) {
    "use strict";
    window.mState.deltaX = e.movementX;
});

(function() {
    "use strict";
    var container, clock;
    var camera, scene, renderer, ship, light, water;
    var coin_geometry, coin_material, islandGeometry, islandMaterial;
    var coins = [],
        shoals = [];
    var map = [];
    var score = 0;
    var coinsound = null;

    // for ocean 
    var parameters = {
        oceanSide: 2000,
        size: 1.0,
        distortionScale: 3.7,
        alpha: 1.0
    };
    var BOB_M = 0.2;
    var SQUIRREL_FACTOR = 0.01;
    var MAX_VELOCITY = 3;

    ShipsLog.log("Starting Lagoon Doubloons!");

    function init() {

        container = document.getElementById( 'container' );

        camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 2000 );
        camera.position.set( 75, 50, 30 );
        camera.lookAt( new THREE.Vector3( 0, 3, 0 ) );
        debug.camera = camera;
        scene = new THREE.Scene();

        clock = new THREE.Clock();

        // loading manager

        var loadingManager = new THREE.LoadingManager( function() {
            scene.add(ship);
        });

        // collada ship

        var loader = new THREE.ColladaLoader( loadingManager );
        loader.load( '../assets/pirateship.dae', function ( collada ) {
            ShipsLog.log("Collada loader loading pirateship");
            ship = collada.scene;
            ship.velocity = 0;
            ship.position.x = -16;
            ship.position.z = -16;
            window.debug.ship = ship;

        } );


        var ambientLight = new THREE.AmbientLight( 0x0000ff, 0.8 );
        scene.add( ambientLight );

        var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
        light = directionalLight;
        directionalLight.position.set( 1, 1, 0 ).normalize();
        scene.add( directionalLight );


        setWater();
        setSkybox();

        generate_map(10,10,40);

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );

        addSoundEffects();

        window.addEventListener( 'resize', onWindowResize, false );
        window.debug.coins = coins;
        window.debug.scene = scene;
    }


    function generate_map(w,h,s){
        for(var i=0; i< w; i++){
            for(var j=0; j<h; j++){
                var v = Math.random();
                if(v > 0.8) {
                    addIsland(i*s,0,j*s);
                }else if(v > 0.3){
                    addCoin(i*s,3,j*s);
                }
            }
        }
    }

    function addCoin(x,y,z){
        if( coin_geometry == null){
            coin_geometry = new THREE.CylinderGeometry( 1, 1, 0.5, 20, 3 );
            coin_material = new THREE.MeshBasicMaterial( {color: 0xaaaa00} );
        }
        var coin = new THREE.Mesh( coin_geometry, coin_material );
        coin.position.x = x;
        coin.position.y = y;
        coin.position.z = z;
        coin.rotation.x = Math.PI / 2;
        coins.push(coin);

        scene.add( coin );
    }

    function addIsland(x, y, z) {
        if( islandGeometry == null){
            islandGeometry = new THREE.CylinderGeometry(2, 5, 3, 20, 3),
            islandMaterial = new THREE.MeshBasicMaterial({color: 0xaa6600});
        }
        var island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.position.x = x;
        island.position.y = y;
        island.position.z = z;
        shoals.push(island);
        scene.add(island);


    }

    function addSoundEffects(){
        // ocean sound from https://freesound.org/people/DANMITCH3LL/sounds/240204/
        //Create an AudioListener and add it to the camera
        var listener = new THREE.AudioListener();
        camera.add( listener );
        
        // create a global audio source
        var sound = new THREE.Audio( listener );
        
        var audioLoader = new THREE.AudioLoader();
        
        //Load a sound and set it as the Audio object's buffer
        audioLoader.load( '../assets/sounds/ocean-waves.ogg', function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( true );
            sound.setVolume( 0.5 );
            sound.play();
        });
        
        coinsound = new THREE.Audio(listener);
        //Coin sound by Mattias Michael Lahoud
        // https://archive.org/details/8BITCOIN01
        audioLoader.load('../assets/sounds/ca-ching.ogg', function(buf) {
            coinsound.setBuffer(buf);
            coinsound.setLoop(false);
            coinsound.setVolume(0.5);
        });
    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function animate() {

        requestAnimationFrame( animate );

        render();

    }

    function collectCoin(which) {
        score += 1;
        MAX_VELOCITY -= 0.3;
        MAX_VELOCITY = Math.max(MAX_VELOCITY, 0.3);
        var myCoin = _.find(coins, function(c) {
            return c.uuid === which; 
        });
        ship.position.y -= 0.1;
        myCoin.collected = true;
        coinsound.play();
    }

    function dumpCoins() {
        score = 0;
        ship.position.y = 0;
        MAX_VELOCITY = 3;

        // 1. Calculate where the coins should land 1st, just needs to 
        //    be an empty spot with no islands and no coins.
        // 2. Then fire them in arcs, all at once, from your boat to their
        //    precalculated landing spots

    }

    function crash() {
        ship.velocity = -1 * ship.velocity;
        dumpCoins();
    }

    function collider() {
        var coinNumber = 0,
            shoalNumber = 0,
            shipRadius = ship.children[2].geometry.boundingSphere.radius;

        _.each(coins, function(coinMesh) {
            if (coinMesh.collected !== true) {
                var radius = coinMesh.geometry.boundingSphere.radius;
                var c = coinMesh.position;
                var x = Math.pow(radius - shipRadius, 2);
                var y = Math.pow(c.x - ship.position.x, 2) + Math.pow(c.z - ship.position.z, 2);
                var z = Math.pow(radius + shipRadius, 2);
                if (x <= y && y <= z) {
                    collectCoin(coinMesh.uuid);
                }
                coinNumber ++;
            }
        });

        _.each(shoals, function(shoalMesh) {
            var radius = shoalMesh.geometry.boundingSphere.radius;
            var c = shoalMesh.position;
            var x = Math.pow(radius - shipRadius, 2);
            var y = Math.pow(c.x - ship.position.x, 2) + Math.pow(c.z - ship.position.z, 2);
            var z = Math.pow(radius + shipRadius, 2);
            if (x <= y && y <= z) {
                crash();
            }
            shoalNumber ++;
        });
    }

    function update() {

        if (window.kbState.w) {
            ship.velocity += 0.01;
        }
        if (window.kbState.s) {
            ship.velocity -= 0.01;
        }
        ship.velocity = Math.min(MAX_VELOCITY, ship.velocity);
        if (window.mState.deltaX) {
            ship.rotation.z -= (Math.PI / 360.0) * window.mState.deltaX;
        }
/*
        if (window.kbState.a) {
            ship.rotation.z += Math.PI / 180.0;
        }

        if (window.kbState.d) {
            ship.rotation.z -= Math.PI / 180.0;
        }
*/
        if (window.mState.zoomIn) {
            camera.position.y -= 1;
        }

        if (window.mState.zoomOut) {
            camera.position.y += 1;
        }

        camera.lookAt(ship.position);
        collider();
    }

    function render() {

        var delta = clock.getDelta();
        var t = clock.getElapsedTime();
        if ( ship !== undefined ) {

            ship.rotation.y = Math.sin(t) * BOB_M; 
            ship.rotation.z += Math.sin(t) * SQUIRREL_FACTOR;
            ship.position.x += Math.sin(ship.rotation.z) * ship.velocity;
            ship.position.z += Math.cos(ship.rotation.z) * ship.velocity;
            //console.log(ship.position);
        }

        for(var c=0; c<coins.length; c++){
            if (coins[c] !== 'undefined') {
                if (coins[c].collected) {
                    coins[c].position.y += 1;
                    coins[c].rotation.z += delta * 20;
                } else {
                    coins[c].rotation.z += delta * 2 ;
                }
            }
        }

        water.material.uniforms.time.value += 1.0 / 200.0;
        water.material.uniforms.size.value = parameters.size;
        water.material.uniforms.distortionScale.value = parameters.distortionScale;
        water.material.uniforms.alpha.value = parameters.alpha;

        renderer.render( scene, camera );

    }

    function setWater() {
        water = new THREE.Water(
            parameters.oceanSide * 5,
            parameters.oceanSide * 5,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load( '../assets/img/waternormals.jpg', function ( texture ) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }),
                alpha:  parameters.alpha,
                sunDirection: light.position.clone().normalize(),
                sunColor: 0xffff00,
                waterColor: 0x0033aa,
                distortionScale: parameters.distortionScale,
                fog: typeof scene.fog !== 'undefined'
            }
        );
        water.rotation.x = - Math.PI / 2;
        water.receiveShadow = true;
        scene.add( water );
    }

    function setSkybox() {
        var cubeMap = new THREE.CubeTexture( [] );
        cubeMap.format = THREE.RGBFormat;
        var loader = new THREE.ImageLoader();
        loader.load( '../assets/img/skyboxsun25degtest.jpg', function ( image ) {
            var getSide = function ( x, y ) {
                var size = 1024;
                var canvas = document.createElement( 'canvas' );
                canvas.width = size;
                canvas.height = size;
                var context = canvas.getContext( '2d' );
                context.drawImage( image, - x * size, - y * size );
                return canvas;
            };
            cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
            cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
            cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
            cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
            cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
            cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
            cubeMap.needsUpdate = true;
        } );
        var cubeShader = THREE.ShaderLib.cube;
        cubeShader.uniforms.tCube.value = cubeMap;
        var skyBoxMaterial = new THREE.ShaderMaterial( {
            fragmentShader: cubeShader.fragmentShader,
            vertexShader: cubeShader.vertexShader,
            uniforms: cubeShader.uniforms,
            side: THREE.BackSide
        } );
        var skyBox = new THREE.Mesh(
            new THREE.BoxGeometry( parameters.oceanSide * 5 + 100, parameters.oceanSide * 5 + 100, parameters.oceanSide * 5 + 100 ),
            skyBoxMaterial
        );
        scene.add( skyBox );
    }

    init();
    animate();
    window.setInterval(update, 1.0/30.0);
})();
