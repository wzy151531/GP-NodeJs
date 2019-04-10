# GP-Code
### 2019-02-14
1.change tcp-server to tls-server to encrypt the data<br>
2.add log.txt in NodeJs to record the info that accepted by server<br>
3.add ADMIN client to manage other clients<br>
4.fix the problem caused by the connection order of TEST-CLIENT and ADMIN<br>
5.fix the problem that makes server break down caused by the compulsive shutdown of any connection<br>
### 2019-02-15
1.update openssl<br>
2.add the ADMIN's authorization<br>
3.fix the problem that log.txt has been covered caused by the server's breakdown<br>
### 2019-02-16
1.add ADMIN command password for the request of managing other clients(code maybe confused because of the unknown problem of windows that the Windows PowerShell only can send request once)<br>
### 2019-02-17
1.fix the constant listen of ADMIN password<br>
2.tidying up code(the problem that ADMIN only can send info once has been solved through adding the request command in the code of ADMIN directly)<br>
3.merge the sockets array and clientsInfo array<br>
4.add the judge of ADMIN's command for void client<br>
5.add interval in each command of ADMIN(to simulate multiple times of ADMIN's commands)<br>
### 2019-02-24
1.use 'npm-init' to add package.json<br>
### 2019-03-11
1.complete uart to wifi function and tested with 8 byte(F9 00 04 00 00 00 0D F9)<br>
2.complete the function that extracts characteristic value from finger to server(207 byte)<br> 
### 2019-03-16
1.complete the recognition function that uses touching fpc1020A interrupt to wake up the fpc1020A and extract characteristic value to server('R' + 215 byte)<br>
2.complete the collect function that collects the finger characteristic value by pressing the button(pin3) when recognition('C' + 215 byte)<br>
### 2019-03-17
1.collect fingerprint features to train a matching template<br>
### 2019-03-20
1.merge branch demo and branch master<br>
### 2019-03-21
1.streamlined init.lua<br>
2.add recognition algorithm(logistic) in server(!todo:still has problem with the parameters)<br>
### 2019-04-10
1.organize the whole folder after the mid-term inspection<br>
2.decide to use another 1020A as a matching client to match the fingerprint features and to store the fingerprint features<br>
### 2019-04-11
1.add matching client code and corresponding server code(not tested)<br>
