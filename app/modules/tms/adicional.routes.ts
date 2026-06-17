// Root-level barrel so the API route discovery (which scans the module root
// and `src/routes`, not `routes/`) registers the adicionales Express router.
export { default } from "./routes/adicional.routes";
