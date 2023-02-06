# Cadastral Management Platform - Backend
API developed with Node and used by the project [predial-frontend](https://github.com/carloshrod/predial-frontend).

## Technologies and libraries
* Node
* Express
* Bcryptjs
* Jsonwebtoken
* MongoDB (Atlas)
* Mongoose
* Nodemailer
* Cloudinary
* Express-fileupload
* Fs-extra

## Run app
1. Clone or download the project on your computer.

2. Install the necessary dependencies from the terminal, with the command **npm install** or its **yarn** equivalent.

3. Set up an account in [MongoDb Atlas](https://www.mongodb.com/atlas/database).

4. Configure mail server with [Nodemailer](https://nodemailer.com/smtp/). In case of using Gmail, activate the authentication in 2 steps of the account to use and configure an application password.

5. Set up an account on [Cloudinary](https://cloudinary.com/). Enable "unsigned uploading".

6. Set the environment variables described in the **env-example.txt** file

7. Clone or download on your computer the project corresponding to the Frontend from [predial-frontend](https://github.com/CarlosHdzR/predial-frontend) and follow the steps to run it.

8. Run the **npm run dev** command or its **yarn** equivalent.
