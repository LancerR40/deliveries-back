# deliveries-back
API REST server to serve [**dashboard**](https://github.com/LancerR40/deliveries-dashboard) and [mobile](https://github.com/LancerR40/deliveries-app) apps requests corresponding to my [URBE University](https://www.urbe.edu/index.jsp) Thesis called **Software for the Online Management of Road Transport Cargoes**

* [Node.js](https://nodejs.org/en/)
* [Express.js](https://expressjs.com/)

## Table of contents
* [Project information](#project-information)
* [Requirements](#requirements)
* [Clone project](#clone-project)
* [Install dependencies](#install-dependencies)
* [Environment variables](#environment-variables)
* [Run server](#run-server)

## Project information
This project is to handle the requests of the web and mobile app and connects to a MySQL database to store data that will then be displayed in the Front-end

## Requirements
You must have:

* Installed [node.js](https://nodejs.org/en/) and [yarn](https://classic.yarnpkg.com/en/) package manager on your machine
* [Cloudinary Platform](https://cloudinary.com/) account
* Some email account such as [Gmail](https://www.google.com/intl/es-419/gmail/about/), [Outlook](https://outlook.live.com/owa/), or another email service for the sending mails 

## Clone project

```
https://github.com/LancerR40/deliveries-back.git
```

## Install dependencies

```
cd ./deliveries-back
yarn
```

## Environment variables
Create a .env file, then copy all variables from .env.example to .env file and add the values to each one<br />For example:

```$
PORT= 4000
DATABASE_HOST= 127.0.0.1
DATABASE_USER= your database user
DATABASE_PASSWORD= your database password 
DATABASE_NAME= deliveries_db
DATABASE_PORT= 3306 (Default MySQL port) 
CLOUDINARY_CLOUD_NAME= your cloudinary account name 
CLOUDINARY_API_KEY= your cloudinary account key
CLOUDINARY_API_SECRET= your cloudinary account secret
TOKEN_KEY= any token secret for example: RhrWyohEGL6C1U7B81zuCYMwopwL7pX1
SMTP_AUTH_TYPE= login (Keep this as login value)
SMTP_AUTH_EMAIL= your email
SMTP_AUTH_PASSWORD= your email password
```

**Note**: the SMTP values is required to send mails to drivers when they are assigned shipments

## Run server

```
yarn dev
```
