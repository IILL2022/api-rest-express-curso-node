const express = require("express");
const Joi = require("joi");
const logger = require("./logger");
const morgan = require("morgan");
const config = require("config");
const inicioDebug = require("debug")("app:inicio");
const dbDebug = require("debug")("app:db");
//Para una app extensa mejor un solo debug

//Instanciar el elemento
const app = express();

const usuarios = [
  { id: 1, nombre: "Intza" },
  { id: 2, nombre: "Alex" },
  { id: 3, nombre: "María" },
];

const port = process.env.PORT || 3000;

//Vamos a usar el app.use (monta la función middleware)
//Vamos a parse json
//Permite recibir formatos de tipo jason

app.use(express.json()); //body
//Otra forma sin ser json:
app.use(express.urlencoded({ extended: true })); //body
//Para recursos estáticos
app.use(express.static("public")); //Uso de la carpeta public
//Con poner localhost:3000/prueba.txt accede directamente aunque está dentro de public

//Configuración de entorno

//Para configurar entornos de trabajo: npm - config
//Se crea el directorio config donde guardaremos los archivos de configuración
//creamos default.json
//development.json para el entorno de desarrollo (morgan solo debe verse en desarrollo)
//Otro para producción: production.json

console.log("Aplicación: " + config.get("nombre"));
console.log("BD Server: " + config.get("configDB.host"));

//Para realizar el registro de todas nuestras peticiones vamos a usar un middleware de terceros: morgan
if (app.get("env") === "development") {
  app.use(morgan("tiny"));
  // console.log("Morgan habilitado");
  inicioDebug("Morgan habilitado");
}

//Módulo debug para depuraciones
//Por ejemplo lo de Morgan y aquí lo de DB
dbDebug("Conectando con la base de datos");

/////....

//funciín Middleware propia
app.use(logger);

app.use(function (req, res, next) {
  console.log("Autenticando ...");
  next();
});

//variable de entorno para el puerto

app.listen(port, () => {
  console.log(`Escuchando en el puerto ${port}...`);
});

//Cuáles van a ser los métodos a implementar
/*
app.get("/", (req, res) => {
  res.send("Hola Mundo desde Express");
}); //petición

app.get("/api/usuarios", (req, res) => {
  res.send(["aa", "bb"]);
}); //petición

//Parámetros (dos puntos)

app.get("/api/usuarios/:id", (req, res) => {
  res.send(req.params.id);
});

app.get("/api/usuarios/:year/:month", (req, res) => {
  res.send(req.params);
});

//Poniendo los parámetros en la línea de búsqueda
//localhost:5000/api/usuarios/1990/2?sexo=M
app.get("/api/usuarios/:year/:month", (req, res) => {
  res.send(req.query);
});

*/

app.get("/api/usuarios", (req, res) => {
  res.send(usuarios);
});

app.get("/api/usuarios/:id", (req, res) => {
  let usuario = usuarios.find((u) => u.id === parseInt(req.params.id));
  if (!usuario) res.status(404).send("El usuario no fue encontrado");
  res.send(usuario);
});

//Para usar POST es que usamos el app.use con json
/*
app.post("/api/usuarios", (req, res) => {
  const usuario = { id: usuarios.length + 1, nombre: req.body.nombre };
  usuarios.push(usuario);
  //Para usar esto necesitamos POSTMAN
  res.send(usuario);
});
*/

//Validando datos
/*
app.post("/api/usuarios", (req, res) => {
  //Por ejemplo si no existe o tiene menor largo
  if (!req.body.nombre || req.body.nombre.length <= 2) {
    res.status(400).send("Debe ingresar un nombre que tenga mínimo 3 letras");
    return; //Bad request
  }

*/

//Validando con JOI
//JSON

app.post("/api/usuarios", (req, res) => {
  //Por ejemplo si no existe o tiene menor largo
  const schema = Joi.object({
    nombre: Joi.string().min(3).required(),
  });

  /*
  const result = schema.validate({ nombre: req.body.nombre });
  console.log(result);
*/

  //Con urlñencoded:

  /*
  let body = req.body;
  console.log(body.nombre);
  res.json({ body });
*/

  //Validadndo error
  const { error, value } = schema.validate({ nombre: req.body.nombre });
  if (!error) {
    const usuario = { id: usuarios.length + 1, nombre: value.nombre };
    usuarios.push(usuario);
    res.send(usuario);
  } else {
    const mensaje = error.details[0].message;
    res.status(400).send(mensaje);
  }

  /*
  if (!req.body.nombre || req.body.nombre.length <= 2) {
    res.status(400).send("Debe ingresar un nombre que tenga mínimo 3 letras");
    return; //Bad request
    

  const usuario = { id: usuarios.length + 1, nombre: req.body.nombre };
  usuarios.push(usuario);
  res.send(usuario);
  */
});

//Ahora va el PUT

app.put("/api/usuarios/:id", (req, res) => {
  //Primero valiamos si existe el id que voy a modificar
  /*
  let usuario = usuarios.find((u) => u.id === parseInt(req.params.id));
*/

  let usuario = existeUsuario(req.params.id);
  if (!usuario) {
    res.status(404).send("El usuario no fue encontrado");
    return;
  }

  //Ver si es dato correcto, con JOI

  const { error, value } = validarUsuario(req.body.nombre);
  if (error) {
    const mensaje = error.details[0].message;
    res.status(400).send(mensaje);
    return;
  }

  //Validado, lo cambiaremos
  usuario.nombre = value.nombre;
  res.send(usuario);
}); //envío de datos al servidor

//DELETE
app.delete("/api/usuarios/:id", (req, res) => {
  let usuario = existeUsuario(req.params.id);
  if (!usuario) {
    res.status(404).send("El usuario no fue encontrado");
    return;
  }
  //Identificar el índice para luego borrar
  const index = usuarios.indexOf(usuario);
  //Eliminarlo
  usuarios.splice(index, 1); //Desde cuál y cuántos
  res.send(usuarios);
}); //envío de datos al servidor

//Validaciones en métodos
function existeUsuario(id) {
  return usuarios.find((u) => u.id === parseInt(id));
}

function validarUsuario(nom) {
  const schema = Joi.object({
    nombre: Joi.string().min(3).required(),
  });
  return schema.validate({ nombre: nom });
}
