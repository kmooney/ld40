/* global THREE */
window.kbState = {};

window.addEventListener('keydown', function(evt) {
    "use strict";
    if (!window.kbState[evt.key]) { 
        window.kbState[evt.key] = true;
    }
});

window.addEventListener('keyup', function(evt) {
    "use strict";
    if (window.kbState[evt.key]) {
        window.kbState[evt.key] = false;
    }
});

(function() {
    "use strict";
    var container, clock;
    var camera, scene, renderer, ship, light, water;
    var coins = [];

    // for ocean 
    var parameters = {
        oceanSide: 2000,
        size: 1.0,
        distortionScale: 3.7,
        alpha: 1.0
    };
    var BOB_M = 0.2;

    function init() {

        container = document.getElementById( 'container' );

        camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 2000 );
        camera.position.set( 70, 50, 30 );
        camera.lookAt( new THREE.Vector3( 0, 3, 0 ) );

        scene = new THREE.Scene();

        clock = new THREE.Clock();

        // loading manager

        var loadingManager = new THREE.LoadingManager( function() {
            scene.add(ship);
        });

        // collada ship

        var loader = new THREE.ColladaLoader( loadingManager );
        loader.load( '../assets/pirateship.dae', function ( collada ) {
            console.log("Collada loader loading pirateship");
            ship = collada.scene;
            ship.velocity = 0;
        } );


        var ambientLight = new THREE.AmbientLight( 0x0000ff, 0.8 );
        scene.add( ambientLight );

        var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
        light = directionalLight;
        directionalLight.position.set( 1, 1, 0 ).normalize();
        scene.add( directionalLight );


        setWater();
        setSkybox();

        for(var i=0;i<5; i++){
            addCoin(Math.random()*30,10,Math.random()*30);
        }
        //

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );

        addSoundEffects();

        window.addEventListener( 'resize', onWindowResize, false );
    }

    function addCoin(x,y,z){
        //if( coin_geometry == null){
         var coin_geometry = new THREE.CylinderGeometry( 1, 1, 0.5, 20, 3 );
         var coin_material = new THREE.MeshBasicMaterial( {color: 0xaaaa00} );
        //}
        var coin = new THREE.Mesh( coin_geometry, coin_material );
        coin.position.x = x;
        coin.position.y = y;
        coin.position.z = z;
        coin.rotation.x = Math.PI / 2;
        coins.push(coin);

        scene.add( coin );
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

    function update() {

        if (window.kbState.w) {
            ship.velocity += 0.01;
        }
        if (window.kbState.s) {
            ship.velocity -= 0.01;
        }
        if (window.kbState.a) {
            ship.rotation.z -= Math.PI / 180.0;
        }
        if (window.kbState.d) {
            ship.rotation.z += Math.PI / 180.0;
        }
        //console.log(ship.velocity);
        
    }

    function render() {

        var delta = clock.getDelta();
        var t = clock.getElapsedTime();
        if ( ship !== undefined ) {

            ship.rotation.y = Math.sin(t) * BOB_M; 
            ship.position.x += Math.sin(ship.rotation.z) * ship.velocity;
            ship.position.z += Math.cos(ship.rotation.z) * ship.velocity;
            //console.log(ship.position);
        }

        for(var c=0; c<coins.length; c++){
            coins[c].rotation.z += delta * 2 ;
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
        loader.load( '../assets/img/skyboxsun25degtest.png', function ( image ) {
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