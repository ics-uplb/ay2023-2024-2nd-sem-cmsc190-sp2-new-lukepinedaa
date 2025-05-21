# Development Set-up
## Prerequisites
* Node.js 
* MongoDB
* Git
* IDE (Visual Studio Code)
* Web Browser 
## Instructions
1. Clone the Repository from link
```
	- git clone "git-link"
	- cd repo
```
2. Set Up the Backend (Node.js + Express + MongoDB):
```
cd backend
npm install
```
Create a .env file in the backend folder with the following contents:
```
MONGO_URI = your mongo uri
EMAIL_USER = your email for auth
EMAIL_PASS = your pass for auth
```
Run the backend server:
```
node index.js
```
3. Set Up the Frontend (React):
```
cd ../frontent
npm install
```
Start the frontend server:
```
npm start
```
4. Access the Application
```
localhost:3000
```
