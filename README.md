# CS-Messaging-Web-App
A web-based messaging application for communication between customers and agents. It features role-based access, canned responses, customer info popups, message search, and priority messaging. Tasks are assigned to agents to avoid overlap and ensure efficient inquiry management.

Features
Role-based access for customers and agents
Canned responses for quick replies
Customer information popups for context
Message search functionality
Priority messaging for urgent inquiries
Task assignment to agents for efficient management

Step1 : Open your terminal (Git Bash) and run the following command to clone the repository:

git clone https://github.com/Jasmine-Shrivastava/CS-Messaging-Web-App.git


Step 2: Initialize a Node application and install required dependencies in backend:

npm init -y
npm install express mongoose cors socket.io


Step 3: To start the server run the following command in backend.

node server.js

Step 4: Go to project folder (that is cd .. from backend) and create the frontend of the app by using the following command

npx create-react-app frontend
cd frontend

Step 5: Go to frontend and install the required dependencies.

npm install axios react-router-dom socket.io-client

Step 6: To start the frontend run the following command in frontend.

npm start
