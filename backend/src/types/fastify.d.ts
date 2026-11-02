import "@fastify/jwt";

// Dizemos ao TypeScript o formato exato do que vai dentro do nosso JWT
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      barbershop_id: string;
      role: string;
    };
    user: {
      sub: string;
      barbershop_id: string;
      role: string;
    };
  }
}
