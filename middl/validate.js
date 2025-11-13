const yup = require("yup");

const validate = async (req, res, next) => {
  try {
    const schema = yup.object().shape({
      username: yup
        .string()
        .matches(/^[A-Z][a-z]*/)
        .required(),
      email: yup.string().email().matches(/^[a-zA-Z0-9]+@esprit.tn$/).required(),
      cin: yup.number().required(),
    });

    await schema.validate(req.body);
    next();
  } catch (err) {
    res.status(404).json(err);
  }
};
module.exports = validate;
