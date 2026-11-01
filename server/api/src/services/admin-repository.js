function adminRepository(pool) {
  const one = async (sql, params) => (await pool.query(sql, params)).rows[0] || null;
  return {
    byUsername: username => one('SELECT * FROM portfolio_admins WHERE username = $1', [username]),
    byEmail: email => one('SELECT * FROM portfolio_admins WHERE email = $1', [email]),
    byId: id => one('SELECT * FROM portfolio_admins WHERE id = $1', [id]),
    resetPassword: (id, version, hash) => one(`UPDATE portfolio_admins SET password_hash = $3,
      token_version = token_version + 1, updated_at = now()
      WHERE id = $1 AND token_version = $2 AND NOT blocked RETURNING id`, [id, version, hash]),
  };
}
module.exports = { adminRepository };
