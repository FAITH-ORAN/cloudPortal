# CloudPortal Project Documentation

Welcome to the CloudPortal project! This document guides you through setting up both the front-end and back-end components of the project, as well as configuring it with your Azure account details.

## Github Repository

<a href="https://github.com/FAITH-ORAN/cloudPortal">Link to Repo</a>

## Overview

The CloudPortal project consists of two main parts:

- Front-End: Built with Angular
- Back-End: Built with Node.js

## Pre-requisites

Before you start, ensure you have the following installed:

- Node.js: Version 21.2.0 or above
- npm (Node Package Manager): Version 10.2.4 or above
- Angular CLI: Version 15.1.4 or above

## User Credentials

Use the following credentials to log into the application:

- User1:
  Username: user1
  Password: password1
  Note: User without credit
- User2:
  Username: user2
  Password: password2
  Note: User with access to one machine
- User3:
  Username: user3
  Password: password3
  Note: User with all access

## Setting Up the Front-End (Angular)

To set up and run the front-end part of the project:

1- Navigate to the front-end project directory.
2- Install dependencies by running: npm i
3- Start the project by running: ng serve
4- Open a web browser and go to http://localhost:4200/ to view the application.

## Setting Up the Back-End (Node.js)

Before setting up the back-end, you will need to configure it with your Azure account details. This includes your Subscription ID, Application ID, and Secret. These details should be entered into the .env file located in the back-end folder.

### Azure Configuration

Open the .env file in the back-end project folder.
Fill in the placeholders with your Azure credentials:

AZURE_TENANT_ID=your_tenant_id_here
AZURE_CLIENT_ID=your_client_id_here
AZURE_CLIENT_SECRET=your_client_secret_here
AZURE_SUBSCRIPTION_ID=your_subscription_id_here

Ensure that you replace `your_tenant_id`, `your_client_id`, `your_client_secret`, and `your_subscription_id` with your actual Azure account details.

### Running the Back-End

1- Navigate to the back-end project directory.
2- Install dependencies by running: npm i
3- Start the project by running: node start
4- The back-end server will start, and it will interact with your Azure account based on the credentials provided in the .env file.
