const nodemailer = require ('nodemailer');

const configuracaoEmailProducao = {
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USUARIO,
    pass: process.env.EMAIL_SENHA
  },
  secure: true
};

const configuracaoEmailTeste = (contaTeste) => ({
    host: 'smtp.ethereal.email',
    auth: contaTeste, 
  
})

async function criaConfiguracaoEmail () {
  if (process.env.NODE_ENV === 'production') {
    return configuracaoEmailProducao;

  } else {
    const contaTeste = await nodemailer.createTestAccount();
    return configuracaoEmailTeste(contaTeste)
  }
}
class Email {

  async  enviarEmail ( ) {
    const configuracaoEmail = await criaConfiguracaoEmail();
    const transportador = nodemailer.createTransport(configuracaoEmail);
  
    const info =  await transportador.sendMail( this);
  
    if ( process.env.NODE_ENV !== 'production' ) { 
      //para recurperar o link do email teste
      console.log("URL : " + nodemailer.getTestMessageUrl(info));
    };
  };
};


class EmailVerificacao extends Email {
  constructor (usuario, endereco) {
    super();
    
    this.from = '"Blog do Código"<noreply@blogdocodigo.com.br>';
    this.to = usuario.email;
    this.subject =  'Verificação de email';
    this.text =  `Olá! Verifique seu email aqui: ${endereco} `;
    this.html = `<h1>Olá!</h1> Verifique seu email aqui: <a href = "${endereco}"> ${endereco} </a>`;
    
  };
};

class EmailRedefinicaoDeSenha extends Email {
  constructor ( usuario, token ) {
    super();
    
    this.from = '"Blog do Código"<noreply@blogdocodigo.com.br>';
    this.to = usuario.email;
    this.subject =  'Redefinição de senha';
    this.text =  `Olá! Você solicitou uma redefinição de senha. Use o token a seguir para trocar sua senha: 
    ${token}`;
    this.html = `<h1>Olá!</h1> Olá! Você solicitou uma redefinição de senha.Use o token a seguir para trocar sua senha: 
    ${token}`;
    
  };
};



module.exports = { EmailVerificacao, EmailRedefinicaoDeSenha };