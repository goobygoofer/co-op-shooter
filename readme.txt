must have node and npm installed
(bundled in LTS version from nodejs.org)

To run the server, either:
a) (for not-so-tech-friendly users)
download install.bat and run.bat from the repository
run install.bat
if no errors, run run.bat
for example:
    if you download install.bat and it goes to your Downloads folder
    run it there and a folder called co-op-shooter will appear
    if run.bat is also in downloads, run it there and it will run the server
    if something doesn't work, just delete everything but install.bat and run.bat
    and start over
if everything worked, after running run.bat the window that popped up should say something like:

running on default port 3000

or something similar without any errors. again if an error is thrown, start over

OR

b) (for more savvy users)

navigate to desired directory and enter the following commands:
git clone https://github.com/goobygoofer/co-op-shooter.git

npm install

node server.js

at this point the console should output:
running on default port 3000

to access on local machine type into browser address bar:
localhost:3000 

or to access from other machines on network:
ip address for machine running server + port number

IMPORTANT NOTE:
If something else on your computer is using the default port 3000, in the first few lines of server.js there is a variable
PORT and it equals 3000. change it to an unused port if you have this issue (when you try to run run.bat it will throw an error telling you the port is already in use!)
