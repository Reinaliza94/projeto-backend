const jwt = require("jsonwebtoken");

function requireAuth(request, response, next) {
  const authorization = request.get("authorization");
  const match =
    typeof authorization === "string" &&
    authorization.match(/^Bearer\s+([^\s]+)$/i);

  if (!match) {
    return response.status(400).json({ error: "Token de autorização inválido" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return response.status(500).json({ error: "Autenticação não configurada" });
  }

  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
    const userId = Number(payload.sub);
    request.userId =
      Number.isSafeInteger(userId) && userId > 0 ? userId : null;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return response.status(400).json({ error: "Token de autorização inválido" });
    }

    throw error;
  }

  return next();
}

module.exports = requireAuth;
