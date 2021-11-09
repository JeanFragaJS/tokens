const db = require('../models')

class UsuariosControllers {
  static async add (req, res) {
    const {name, email, password} = req.body
    try{
      const NewUser = await db.usuarios.create({name, email, password})
      return res.status(201).json(NewUser)

    }catch(err){
      return res.json(err)
    }
  }

  static async list (req, res) {
    try{
        const allUsers = await db.usuarios.findAll();
        return res.status(200).json(allUsers)
    }catch (err) {
      return res.status(500).json(err);
    }
  }

  static async remove (req, res) {
    const  {userID} = req.params
    try {
       await db.usuarios.destroy({where: {id: Number(userID)}});
       return res.status(204).json()
    } catch (err) {
      return res.status(500).json({message: "oops algo deu errado!"})
    }
  }


}

module.exports = UsuariosControllers