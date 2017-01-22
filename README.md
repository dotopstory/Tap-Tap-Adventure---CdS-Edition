# Tap Tap Adventure

Tap Tap Adventure is an advanced expasion of the 2012 experimental HTML5 game developed by Little Workshop to show how WebSockets could be used to create a realtime MMORPG in the comfort of your browser.

With the visual potential behind the original game, TTA takes a leap forward towards expanding the game from many of the ideas and suggestions from earlier development releases of the game. Thus, with the expansion hundreds of new mobs, items, and sprites have been added to the game to offer a higher field of actions. 

Further accomplishments include improvements towards the rendering engine, game engine, migration of WebSockets to Socket.IO, quests, levels, new areas, inventory, party system, character information, database saving, API login & registration, and abilities. The list does not cover all of the new features and is but merely to point in the direction the game is heading.

The initial intent behind TTA is to offer a large-scaled MMORPG whereby players are able to access it from all devices in a comfortable manner, thus said the data, RAM, and CPU usage must be maintained at a minimal to ensure perfect compatibility. HTML5 comes into play when we wish to allow players to access the game from a wide variety of devices. This includes Android and Apple phones, phablets and tablets as well as Linux based machines and older OS computers.

All of the music and game art is signed under CC-BY-SA 3.0 and in compliance with those terms have credited the rightful authors for their contributions towards the development


## Running the Repo

To run your own TTA server, you must `clone` the repository. You will need the latest version of NodeJS for optimal performance.

Step 1: Install Dependencies

`$ sudo npm install -d`

Step 2: Install Redis Server - https://redis.io

Step 3: Install Http-Server

`$ sudo npm install -g http-server`

Step 3.5 (Optional): Install `nodemon`

If you're planning on developing TTA, `nodemon` is a neat tool that automatically restarts the server upon detecting a change.

`$ sudo npm install -g nodemon`

Step 4: Run redis, the server and the client

You will need a separate terminal window for each of the following (ensure you are in the server directory):

`$ redis-server`

`$ node server/js/main` or if you're using nodemon `$ nodemon server/js/main.js`

`$ http-server`

Done! You can connect to the game using http://127.0.0.1:8080/client
