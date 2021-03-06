//DataBase
const db = require('../models');

//tokens
const tokens = require('../tokens/tokens');

//erros
const Notfound = require('../err/NotFound');

//outros
const bcrypt = require('bcrypt'); 
const {EmailVerificacao, EmailRedefinicaoDeSenha} =  require('../emails/emails');

//conversores
const {ConversorUsuarios} = require('../conversor/Conversor');
const InvalidArgumentError = require('../err/InvalidArgumentError');

//funcionalidades
function geraEndereco (rota, token) {
  const baseURL =  process.env.BASE_URL;
  return `${baseURL}${rota}${token}`
}

class UsuariosControllers {
  static async add ( req, res, next ) {
    const { name, email, cargo, password,  } = req.body;

    try{ 
      const custoHash = 12;
      const senhaHash = await bcrypt.hash( password, custoHash );
      const newUser = await db.usuarios.create( {name, email, cargo, password: senhaHash, emailVerificado: false});

      const token =  tokens.verificacaoEmail.cria(newUser.id);
      const endereco =  geraEndereco('/usuarios/verifica_email/', token);
      const emailVerificacao = new EmailVerificacao(newUser, endereco)
      emailVerificacao.enviarEmail().catch(console.log);

      return res.status( 201 ).json( newUser );
    } catch ( err ){
      console.log( err );
      next( err ) ;

    }
  }

  static async login ( req, res, next ) {
    try {
      const accessToken = tokens.access.cria( req.user.id );
      const refreshToken  = await tokens.refresh.cria(req.user.id);
      res.set( 'Authorization', accessToken);
      return res.status( 200 ).json({ refreshToken });

    } catch ( err ) {
      console.log( err );
      next( err ) ;

    }
  }

  static async logout ( req, res, next ) {
    try {
      const token = req.token; //esse token vem do middleware que é recupera da estratégia de autenticação. 
      await tokens.access.invalida( token );
  
      return res.status(204).send();
    } catch (err) {
      console.log( err );
      next( err ) ;
      
    }
  }

  static async list (req, res, next) {
    try{
        const allUsers = await db.usuarios.findAll();
        const conversor = new ConversorUsuarios(
          'json',
          req.acesso.todos.permitido ? req.acesso.todos.atributos :
          req.acesso.apenasSeu.atributos
          )
          
        return res.status(200).send(conversor.converter(allUsers));
    }catch (err) {
      console.log( err );
      next( err ) ;
    }
  }

  static async verificaEmail ( req, res, next) {
    try {
      const usuario =  req.user;
      usuario.update({ emailVerificado: true } );
      return res.status(200).json();
    } catch (err) {
      console.log( err );
      next( err ) ;
    }
  }

  static async remove (req, res, next) {
    const  {userID} = req.params
    try {
        const user = await db.usuarios.findByPk(userID);
        if (!user) {
          throw new Notfound('usuário');
        }
       await user.destroy({where: {id: Number(userID)}});
       return res.status(204).json()
    } catch (err) {
      console.log( err );
      next( err ) ;
    }
  }

  //Envio de email para recuperação de senha. 
  static async forgotPassword (req, res, next) {
    const repostaPadrao = {message: "Se encontrarmos um usuário com este e-mail, enviaremos as instruções para o mesmo redefinir a senha"};
    const { email } = req.body;

    try { 
      const user = await db.usuarios.findOne({where: { email: email }})
      const token = await tokens.RedefinicaoDeSenha.criarToken(user.id);
      const emailForgotPassword= new EmailRedefinicaoDeSenha(user, token);
      await emailForgotPassword.enviarEmail();

      res.send(repostaPadrao);
    }catch (err) {
      console.log(err);
      if( err  instanceof Notfound ) {
        res.send(repostaPadrao)
        return;
      };
      next(err);
    };
  };

  //Mudança de Senha do Usuário. 
  static async changePassword (req, res, next) {
    const { token, password } = req.body;
    try{
      if( typeof token !== 'string' || token.length === 0 ) {
        throw new InvalidArgumentError;
      };

      const id =  await tokens.RedefinicaoDeSenha.verifica(token); 
      const user = await db.usuarios.findByPk(id);

      const custoHash = 12;
      const senhaHash = await bcrypt.hash( password, custoHash );

      await user.update( { password: senhaHash }, { where : { id: id } } );

      return res.status(200).send({message: 'Sua senha foi atualizada com sucesso'}); 
    }catch ( err) {
      console.log(err)
      next(err);
    }
  }

}

module.exports = UsuariosControllers;