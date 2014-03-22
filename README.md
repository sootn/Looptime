Looptime
========

Looptime is a 3D multiplayer game built in HTML5, WebGL, JavaScript and GoLang. 


Setup
-----

1. http://golang.org/doc/install
2. git clone https://github.com/sootn/Looptime
3. cd Looptime
4. go install
5. go run main.go
6. open http://localhost:9000


Debug
-----

http://localhost:9000/?debug=true will activate debug mode.
In debug mode you are in a single player game without networking. You also see the otherwise invisible collisionmap.


TODO
----

- make addAndReplayEvent capable of taking multiple events at a time
- improve handling of timewave wraparound
- disable jumping to the current time, I think it breaks things
- make something graphically pleasing when the start delay is happening
- make the gun a MeshPhongMaterial with envMap for shinynesss
- mark killer waves in timemap