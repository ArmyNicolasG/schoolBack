const express = require('express');
const sessions = require('express-session');
const SQLStorage = require('express-mysql-session');
require('dotenv').config();
const cors = require('cors');
const mysql = require('mysql');

const app = express();

app.use(cors({
	origin: 'http://localhost:3000'
}));

const SQLStoreConfig = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
}

const storeSession = new SQLStorage(SQLStoreConfig);

const options = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME
}

const { PORT } = process.env;

let connection = mysql.createConnection(options);

app.use(express.json());

app.use(sessions({
	saveUninitialized: false,
	resave: false,
	store: storeSession,
	secret: 'mysecretkey_node',
	key: 'user_cookie'   
}));

//ROUTES

//Create users
app.post('/create-user', (req, res) => {
	if(req.session.userRole === 'Administrador') {
		const { userId, password, name, lastNames, email, birthDate, phone, userRole } = req.body;

		connection.query(`SELECT * FROM users WHERE user_id = ${userId} OR email = ${email};`, (err, result) => {

			if(err) { res.status(500).send({ message: 'Error en la base de datos' }); }
			 else if (result.length == 0){
				connection.query(`INSERT INTO users (userId, password, name, lastNames, email, birthDate, phone, userRole) VALUES ('${userId}', '${password}', '${name}', '${lastNames}', '${email}', '${birthDate}', '${phone}', '${userRole}')`, (err, results) => {
					if(err) {
						res.status(500).send({ message: 'Error en la base de datos' });
					}
					else {
						res.status(201).send({ message: `¡Usuario "${lastNames} ${name}" creado exitosamente!` });
					}
				});
			}
			else{ res.send({ message: '¡Ya existe un usuario registrado con las credenciales proporcionadas!' });}

			
		});

	}
	else {
		res.status(405).send({ message: '¡No tienes permisos para realizar esta acción!' });
	}
});

//Login
app.post('/login', (req, res) => {
	console.log(req.body);
	let { userId, password } = req.body;
	let query = `SELECT * FROM users WHERE user_id = '${userId}' AND password = '${password}'`;
	connection.query(query, (err, results) => {
		if (err) {
			console.log(err);
			res.sendStatus(500);
		}
		else{
			if(results.length > 0) {
				req.session.userId = userId;
				req.session.userRole = results[0].user_role;
				res.status(200).send({ message: '¡Bienvenido!' });
			}
			else {
				res.status(401).send({ message: '¡Usuario inexistente o contraseña incorrecta!' });
			}
		}
	});
});

app.listen(PORT, () => {
	console.log("Listening on port: " + PORT);
});
