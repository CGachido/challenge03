module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  database: 'meetapp01',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
