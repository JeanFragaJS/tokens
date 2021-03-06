require('dotenv').config();

const express = require('express');
const routes = require('../src/routes');
const InvalidArgumentError = require('./err/InvalidArgumentError');
const NotFound = require('./err/NotFound');
const Unauthorized = require('./err/Unauthorized')
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');


//Inicialização Redis
require('../redis/blocklist-access-token');
require('../redis/allowlist-refresh-token');

const app = express();

//Mideddleware de Definição de Headers;
app.use( (req, res, next)=>{
  res.set({
    'Content-Type': 'application/json'
  });
  next();
})

//Rotas
routes(app);

//Middeleware de TRATAMENTO DE ERROS;
app.use((err, req, res, next) => {
  let status = 500;
  const body = { message: err.message }
  
  //ifs para verificar que tipo de erro será emitido;
  if ( err instanceof InvalidArgumentError ) {
    status = 400;
  }
  if (err instanceof NotFound) {
    status = 404;
  }
  if (err instanceof Unauthorized) {
    status = 401;
  }
  if (err instanceof JsonWebTokenError) {
    status = 401;
  }
  if (err instanceof TokenExpiredError) {
    status = 401;
    body.expiradoEm = err.expiredAt;
  }



  //resposta formatada para ser emitida;
  res.status(status).json(body);
})


app.listen(3939, ()=> {console.log("api run on port 3939")});

