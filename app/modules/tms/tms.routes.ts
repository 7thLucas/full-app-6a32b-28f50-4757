// Root-level barrel so the API route discovery (which scans the module root
// and `src/routes`, not `routes/`) registers the core TMS Express router.
export { default } from "./routes/tms.routes";
